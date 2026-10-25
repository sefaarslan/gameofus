import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { COIN_PRICES, CoinError, applyCoins } from "@/lib/coins";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";
import { checkRateLimitWindow } from "@/lib/rate-limit";
import { authAiUser } from "@/lib/ai/access";
import { modelSpecs, unavailable } from "@/lib/ai/http";
import { AiUnavailableError, anyCapacity, runWithFallback } from "@/lib/ai/run";
import { generateSoloAnalysis } from "@/lib/ai/solo/generate";
import { UnknownGameTypeError, getSoloAdapter } from "@/lib/ai/solo/registry";
import { currentSoloAnalysis, reapStaleSolo, refundSoloIfCharged, soloCoinRef } from "@/lib/ai/solo/store";
import type { SoloAdapter, SoloSessionRow } from "@/lib/ai/solo/types";
import type { Locale } from "@/lib/ai/digest";
import type { Json } from "@/types/database.types";

// Üretim (ana model + olası yedek) en fazla ~35 sn sürebilir
export const maxDuration = 60;

export function OPTIONS() {
  return corsOptions();
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** POST hız sınırı: kullanıcı başına dakikada 5, günde 20 (oda yorumuyla aynı) */
const POST_LIMIT_MIN = { limit: 5, windowMs: 60_000 };
const POST_LIMIT_DAY = { limit: 20, windowMs: 24 * 60 * 60 * 1000 };

/**
 * Oturum + sahiplik: yalnızca oturumun SAHİBİ (user_id = JWT kullanıcısı). Oturum yok / başkasının / anonim web oturumu (user_id boş)
 * → hepsi AYNI `404 SESSION_NOT_FOUND` (varlık sızmaz; solo uçlarının geri kalanıyla aynı davranış).
 */
async function loadOwnSession(sessionId: string, userId: string): Promise<SoloSessionRow | null> {
  if (!UUID_RE.test(sessionId)) return null;
  const { data } = await createAdminClient()
    .from("solo_sessions")
    .select("id, game, locale, pack_key, status, user_id, scenario_ids, answers")
    .eq("id", sessionId)
    .maybeSingle();
  return data && data.user_id === userId ? data : null;
}

/** Oyun türüne göre adaptör; kayıtlı değilse temiz hata (400, 500 değil). */
function adapterFor(session: SoloSessionRow): SoloAdapter | Response {
  try {
    return getSoloAdapter(session.game);
  } catch (e) {
    if (e instanceof UnknownGameTypeError) return apiError("INVALID_PAYLOAD", "Bu oyun için AI analizi desteklenmiyor.");
    throw e;
  }
}

const localeOf = (v: string): Locale => (v === "tr" || v === "en" || v === "es" ? v : "tr");

/**
 * GET: oturumun AI analiz durumu (ücretsiz). `none` hata değildir: 200 ile döner, mobil "100 coinle aç" butonunu gösterir.
 * Yanıt: { status, purchasedByMe, gameType, content?, createdAt? }. Yalnızca JWT (mobil) ve yalnızca oturumun sahibi.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const user = await authAiUser(req);
  if (user instanceof Response) return user;
  const session = await loadOwnSession(sessionId, user.id);
  if (!session) return apiError("SESSION_NOT_FOUND", "Oturum bulunamadı.", 404);
  const adapter = adapterFor(session);
  if (adapter instanceof Response) return adapter;

  await reapStaleSolo(session.id);
  const row = await currentSoloAnalysis(session.id);
  if (!row) return apiOk({ status: "none", purchasedByMe: false, gameType: adapter.gameType });
  return apiOk({
    status: row.status,
    purchasedByMe: row.purchased_by === user.id,
    gameType: adapter.gameType,
    ...(row.status === "ready" ? { content: row.content, createdAt: row.created_at } : {}),
  });
}

/** POST: AI analizi satın al ve üret (100 coin, `solo_ai`). Sıra ve hata davranışı oda yorumuyla aynı (docs/API_SPEC.md §10d). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  // 1) Kimlik (yalnızca JWT) → hız sınırı → oturum sahipliği → rıza
  const user = await authAiUser(req);
  if (user instanceof Response) return user;
  if (
    !(await checkRateLimitWindow(`u:${user.id}`, "ai_solo_min", POST_LIMIT_MIN)) ||
    !(await checkRateLimitWindow(`u:${user.id}`, "ai_solo_day", POST_LIMIT_DAY))
  ) {
    return apiError("RATE_LIMITED", "Çok fazla deneme. Biraz sonra tekrar dene.", 429);
  }
  const session = await loadOwnSession(sessionId, user.id);
  if (!session) return apiError("SESSION_NOT_FOUND", "Oturum bulunamadı.", 404);
  const adapter = adapterFor(session);
  if (adapter instanceof Response) return adapter;
  const gameType = adapter.gameType;

  const supabase = createAdminClient();
  const { data: profile } = await supabase.from("users").select("ai_consent_version, ai_consent_at").eq("id", user.id).maybeSingle();
  if (!profile?.ai_consent_at || !profile.ai_consent_version) {
    return apiError("AI_CONSENT_REQUIRED", "AI analiz için önce onay vermelisin.", 403);
  }

  // 2) Oyun tamamlanmış mı
  if (!adapter.isEligible(session)) return apiError("RESULT_NOT_READY", "Oyun henüz tamamlanmadı.", 409);

  // 3) Zaten hazır / üretiliyor mu? (takılmış kayıtlar önce temizlenir)
  await reapStaleSolo(session.id);
  const existing = await currentSoloAnalysis(session.id);
  if (existing?.status === "ready") {
    return apiOk({ status: "ready", gameType, content: existing.content, applied: false, purchasedByMe: true });
  }
  if (existing?.status === "generating") return apiOk({ status: "generating", gameType }, 202);

  // 4) Kapasite ve veri HAZIR değilse coin düşmeden dön
  const specs = modelSpecs(req);
  if (!(await anyCapacity(specs))) return unavailable(false, { gameType });
  const input = await adapter.loadInput(session, supabase);
  const digest = input ? adapter.buildDigest(session, input) : null;
  if (!digest) return apiError("RESULT_NOT_READY", "Oyun verisi hazır değil.", 409);

  // 5) Yarış-güvenli "üretim başlat" satırı (oturumda aynı anda tek aktif kayıt)
  const locale = localeOf(session.locale);
  const { data: began } = await supabase.rpc("ai_solo_begin", {
    p_session: session.id,
    p_user: user.id,
    p_game: gameType,
    p_locale: locale,
    p_consent: profile.ai_consent_version,
  });
  const started = began?.[0];
  if (!started) {
    const other = await currentSoloAnalysis(session.id);
    if (other?.status === "ready") return apiOk({ status: "ready", gameType, content: other.content, applied: false, purchasedByMe: true });
    return apiOk({ status: "generating", gameType }, 202);
  }
  const { id: rowId, attempt } = started;

  const failRow = async (kind: string) => {
    await supabase.from("ai_solo_analyses").update({ status: "failed", error_kind: kind, updated_at: new Date().toISOString() }).eq("id", rowId);
  };

  // 6) Coin düş (yetersizse satırı sil)
  let balance: number;
  try {
    ({ balance } = await applyCoins(user.id, -COIN_PRICES.solo_ai, "solo_ai", soloCoinRef(session.id, attempt)));
  } catch (e) {
    await supabase.from("ai_solo_analyses").delete().eq("id", rowId);
    if (e instanceof CoinError && e.code === "INSUFFICIENT_COINS") return apiError("INSUFFICIENT_COINS", "Yeterli coin yok.", 402);
    return apiError("INTERNAL_ERROR", "Coin işlemi yapılamadı.", 500);
  }

  // 7) Üret (ana + yedek). Başarısızlıkta satır `failed`, coin iade.
  try {
    const result = await runWithFallback(specs, (spec) => generateSoloAnalysis(adapter, digest, locale, spec));
    const { error } = await supabase
      .from("ai_solo_analyses")
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
    return apiOk({ status: "ready", gameType, content: result.content, balance, applied: true, purchasedByMe: true });
  } catch (err) {
    const kinds = err instanceof AiUnavailableError ? err.reasons.join(",") : "internal";
    console.error("[ai-solo] analiz üretilemedi", { gameType, attempt, kinds }); // kişisel veri yok
    await failRow(kinds.slice(0, 120));
    const refunded = await refundSoloIfCharged(user.id, session.id, attempt);
    return unavailable(refunded, { gameType });
  }
}
