import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { COIN_PRICES, CoinError, applyCoins } from "@/lib/coins";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";
import { normalizeRoomCode } from "@/lib/room-code-utils";
import { checkRateLimitWindow } from "@/lib/rate-limit";
import { authAiUser, bothPlayersConsented, resolveAiParticipant } from "@/lib/ai/access";
import { modelSpecs, unavailable } from "@/lib/ai/http";
import { buildDigest } from "@/lib/ai/digest";
import { coinRef, currentCommentary, reapStale, refundIfCharged } from "@/lib/ai/commentary-store";
import { loadRawRoom } from "@/lib/ai/room-data";
import { AiUnavailableError, anyCapacity, generateWithFallback } from "@/lib/ai/run";
import type { Json } from "@/types/database.types";

// Üretim (ana model + olası yedek) en fazla ~35 sn sürebilir
export const maxDuration = 60;

export function OPTIONS() {
  return corsOptions();
}

/** POST hız sınırı: kullanıcı başına dakikada 5, günde 20 */
const POST_LIMIT_MIN = { limit: 5, windowMs: 60_000 };
const POST_LIMIT_DAY = { limit: 20, windowMs: 24 * 60 * 60 * 1000 };

/**
 * GET: odanın AI yorum durumu. Odanın HER katılımcısına (satın alan da, partner de) ücretsiz. Yalnızca JWT (mobil).
 * `none` hata değildir: 200 ile döner, mobil "100 coinle aç" butonunu gösterir.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const roomCode = normalizeRoomCode((await params).roomCode);
  const user = await authAiUser(req);
  if (user instanceof Response) return user;
  const ctx = await resolveAiParticipant(req, roomCode, user);
  if (ctx instanceof Response) return ctx;

  await reapStale(ctx.room.id, roomCode);
  const row = await currentCommentary(ctx.room.id);
  // `playersConsented`: odadaki her oyuncunun AI rızası var mı. false ise POST `403 AI_PARTNER_CONSENT_REQUIRED` döner; mobil butonu gizleyebilir.
  if (!row) return apiOk({ status: "none", purchasedByMe: false, playersConsented: await bothPlayersConsented(ctx.room.id) });
  return apiOk({
    status: row.status,
    purchasedByMe: row.purchased_by === user.id,
    ...(row.status === "ready" ? { content: row.content, createdAt: row.created_at } : {}),
  });
}

/** POST: AI yorumu satın al ve üret (100 coin). Sıra ve hata davranışı için docs/API_SPEC.md → "AI yorum". */
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const roomCode = normalizeRoomCode((await params).roomCode);

  // 1) Kimlik (yalnızca JWT) → hız sınırı → katılımcı doğrulama → rıza
  const user = await authAiUser(req);
  if (user instanceof Response) return user;
  if (
    !(await checkRateLimitWindow(`u:${user.id}`, "ai_commentary_min", POST_LIMIT_MIN)) ||
    !(await checkRateLimitWindow(`u:${user.id}`, "ai_commentary_day", POST_LIMIT_DAY))
  ) {
    return apiError("RATE_LIMITED", "Çok fazla deneme. Biraz sonra tekrar dene.", 429);
  }
  const ctx = await resolveAiParticipant(req, roomCode, user);
  if (ctx instanceof Response) return ctx;
  const { room } = ctx;

  const supabase = createAdminClient();
  const { data: profile } = await supabase.from("users").select("ai_consent_version, ai_consent_at").eq("id", user.id).maybeSingle();
  if (!profile?.ai_consent_at || !profile.ai_consent_version) {
    return apiError("AI_CONSENT_REQUIRED", "AI yorum için önce onay vermelisin.", 403);
  }

  // 2) Oda durumu. `expires_at` geçmiş olsa bile satın alma serbesttir: oyun süresi dolsa da sonuç saklama süresi (90 gün) boyunca
  //    okunabilir; oda silindiyse zaten bulunamaz (INVALID_TOKEN). Burada yalnızca sonucun hazır olması aranır.
  if (room.status !== "result_ready" && room.status !== "completed") {
    return apiError("RESULT_NOT_READY", "Sonuçlar henüz hazır değil.", 409);
  }

  // 3) Zaten hazır / üretiliyor mu? (takılmış kayıtlar önce temizlenir)
  await reapStale(room.id, roomCode);
  const existing = await currentCommentary(room.id);
  if (existing?.status === "ready") {
    return apiOk({ status: "ready", content: existing.content, applied: false, purchasedByMe: existing.purchased_by === user.id });
  }
  if (existing?.status === "generating") return apiOk({ status: "generating" }, 202);

  // 3b) YENİ üretim iki oyuncunun verisini üçüncü tarafa gönderir: odadaki herkesin AI rızası olmalı (hesaplıda `users`, web misafirinde
  //     katılım satırı). Eksikse hiçbir şey gönderilmeden ve coin düşmeden döner. (Zaten üretilmiş yorumun okunması yukarıda etkilenmez.)
  if (!(await bothPlayersConsented(room.id))) {
    return apiError("AI_PARTNER_CONSENT_REQUIRED", "Odadaki diğer oyuncu yapay zekâ yorumuna izin vermedi.", 403);
  }

  // 4) Kapasite ve veri HAZIR değilse coin düşmeden dön
  const specs = modelSpecs(req);
  if (!(await anyCapacity(specs))) return unavailable(false);
  const raw = await loadRawRoom(room.id, room.locale, room.relationship_type);
  if (!raw) return apiError("RESULT_NOT_READY", "Sonuç verisi hazır değil.", 409);
  const digest = buildDigest(raw);

  // 5) Yarış-güvenli "üretim başlat" satırı (aynı anda tek aktif kayıt)
  const { data: began } = await supabase.rpc("ai_commentary_begin", {
    p_room: room.id,
    p_user: user.id,
    p_locale: raw.locale,
    p_consent: profile.ai_consent_version,
  });
  const started = began?.[0];
  if (!started) {
    const other = await currentCommentary(room.id);
    if (other?.status === "ready") {
      return apiOk({ status: "ready", content: other.content, applied: false, purchasedByMe: other.purchased_by === user.id });
    }
    return apiOk({ status: "generating" }, 202);
  }
  const { id: rowId, attempt } = started;

  const failRow = async (kind: string) => {
    await supabase
      .from("ai_commentaries")
      .update({ status: "failed", error_kind: kind, updated_at: new Date().toISOString() })
      .eq("id", rowId);
  };

  // 6) Coin düş (yetersizse satırı sil)
  let balance: number;
  try {
    ({ balance } = await applyCoins(user.id, -COIN_PRICES.ai_commentary, "ai_commentary", coinRef(roomCode, attempt)));
  } catch (e) {
    await supabase.from("ai_commentaries").delete().eq("id", rowId);
    if (e instanceof CoinError && e.code === "INSUFFICIENT_COINS") return apiError("INSUFFICIENT_COINS", "Yeterli coin yok.", 402);
    return apiError("INTERNAL_ERROR", "Coin işlemi yapılamadı.", 500);
  }

  // 7) Üret (ana + yedek). Başarısızlıkta satır `failed`, coin iade.
  try {
    const result = await generateWithFallback(digest, specs);
    const { error } = await supabase
      .from("ai_commentaries")
      .update({
        status: "ready",
        content: result.content as unknown as Json,
        model: `${result.meta.provider}:${result.meta.model}`,
        prompt_version: result.meta.promptVersion,
        prompt_tokens: result.meta.promptTokens,
        completion_tokens: result.meta.completionTokens,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rowId);
    if (error) throw new Error("db_write_failed");
    return apiOk({ status: "ready", content: result.content, balance, applied: true, purchasedByMe: true });
  } catch (err) {
    const kinds = err instanceof AiUnavailableError ? err.reasons.join(",") : "internal";
    console.error("[ai] yorum üretilemedi", { attempt, kinds }); // kişisel veri yok
    await failRow(kinds.slice(0, 120));
    const refunded = await refundIfCharged(user.id, roomCode, attempt);
    return unavailable(refunded);
  }
}
