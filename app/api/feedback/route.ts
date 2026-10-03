import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyToken, extractToken } from "@/lib/token";
import { isRoomExpired } from "@/lib/expire";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";

export function OPTIONS() {
  return corsOptions();
}

const WANTS_AI = ["yes", "maybe", "no"] as const;
type WantsAi = (typeof WANTS_AI)[number];

/**
 * Sonuç ekranındaki mini anket. Katılımcı başına oda başına tek kayıt (upsert):
 * önce puan, sonra isteğe bağlı AI ilgisi/yorum aynı satıra eklenir.
 * Kimlik: participant token (anonim). Cevap/tahmin içeriği saklanmaz.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_PAYLOAD", "Geçersiz istek gövdesi.");
  }

  const { roomCode, soloSessionId, rating, wantsAi, comment, participantToken: bodyToken, platform } =
    body as Record<string, unknown>;

  const token = extractToken(req, typeof bodyToken === "string" ? bodyToken : null);
  if (!token) return apiError("INVALID_TOKEN", "Token gereklidir.", 403);

  const isSolo = typeof soloSessionId === "string" && soloSessionId.length > 0;
  if (!isSolo && (typeof roomCode !== "string" || roomCode.length === 0)) {
    return apiError("INVALID_PAYLOAD", "Oda kodu ya da oturum kimliği zorunludur.");
  }
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return apiError("INVALID_PAYLOAD", "Puan 1-5 arasında olmalıdır.");
  }
  if (wantsAi != null && !WANTS_AI.includes(wantsAi as WantsAi)) {
    return apiError("INVALID_PAYLOAD", "Geçersiz seçim.");
  }
  if (comment != null && typeof comment !== "string") {
    return apiError("INVALID_PAYLOAD", "Geçersiz yorum.");
  }
  const cleanComment = typeof comment === "string" ? comment.trim().slice(0, 500) : null;

  const supabase = createAdminClient();

  // ── Solo oyun oturumu: token oturumun token_hash'ine karşı doğrulanır, oturum tamamlanmış olmalı ──
  if (isSolo) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(soloSessionId as string)) {
      return apiError("SESSION_NOT_FOUND", "Oturum bulunamadı.", 404);
    }
    const { data: session } = await supabase
      .from("solo_sessions")
      .select("id, game, locale, platform, token_hash, status")
      .eq("id", soloSessionId as string)
      .maybeSingle();
    if (!session) return apiError("SESSION_NOT_FOUND", "Oturum bulunamadı.", 404);
    if (!verifyToken(token, session.token_hash)) return apiError("INVALID_TOKEN", "Geçersiz token.", 403);
    if (session.status !== "completed") return apiError("RESULT_NOT_READY", "Oyun henüz tamamlanmadı.");

    const { error: soloErr } = await supabase.from("feedback").upsert(
      {
        solo_session_id: session.id,
        game: session.game,
        rating,
        locale: session.locale,
        platform: session.platform,
        updated_at: new Date().toISOString(),
        ...(wantsAi != null ? { wants_ai: wantsAi as WantsAi } : {}),
        ...(cleanComment ? { comment: cleanComment } : {}),
      },
      { onConflict: "solo_session_id" },
    );
    if (soloErr) return apiError("INTERNAL_ERROR", "Geri bildirim kaydedilemedi.", 500);
    return apiOk({ saved: true }, 201);
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("id, status, expires_at, locale, game_mode, relationship_type")
    .eq("room_code", roomCode as string)
    .maybeSingle();

  if (!room) return apiError("ROOM_NOT_FOUND", "Oda bulunamadı.", 404);
  if (isRoomExpired(room.expires_at)) return apiError("ROOM_EXPIRED", "Bu odanın süresi dolmuş.");
  // Anket yalnızca sonuç görüldükten sonra anlamlı
  if (room.status !== "result_ready" && room.status !== "completed") {
    return apiError("RESULT_NOT_READY", "Sonuçlar henüz hazır değil.");
  }

  const { data: participants } = await supabase
    .from("participants")
    .select("id, token_hash")
    .eq("room_id", room.id);

  const me = (participants ?? []).find((p) => verifyToken(token, p.token_hash));
  if (!me) return apiError("INVALID_TOKEN", "Geçersiz token.", 403);

  // Yalnızca gönderilen alanlar yazılır; önceki değerler (ör. puan) korunur
  const { error } = await supabase.from("feedback").upsert(
    {
      room_id: room.id,
      participant_id: me.id,
      rating,
      locale: room.locale,
      game_mode: room.game_mode,
      relationship_type: room.relationship_type,
      platform: platform === "mobile" ? "mobile" : "web",
      updated_at: new Date().toISOString(),
      ...(wantsAi != null ? { wants_ai: wantsAi as WantsAi } : {}),
      ...(cleanComment ? { comment: cleanComment } : {}),
    },
    { onConflict: "room_id,participant_id" },
  );

  if (error) return apiError("INTERNAL_ERROR", "Geri bildirim kaydedilemedi.", 500);

  return apiOk({ saved: true }, 201);
}
