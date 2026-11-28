import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { extractToken } from "@/lib/token";
import { bearerJwt } from "@/lib/auth";
import { findParticipant } from "@/lib/participant-auth";
import { isRoomExpired } from "@/lib/expire";
import { apiError, apiOk } from "@/lib/api";
import { normalizeRoomCode } from "@/lib/room-code-utils";
import { denyUnknownRoom, tokenDenied } from "@/lib/room-lookup";
import { corsOptions } from "@/lib/cors";
import { lieCardsFor, type BluffCall } from "@/lib/bluff";

export function OPTIONS() {
  return corsOptions();
}

/**
 * Blöf avı: oyuncu, karşı tarafın yalan söylediğini düşündüğü soruları (`suspects`) gönderir. En az 1, en çok Yalan Kartı sayısı kadar.
 * Seçilenler "bluff", kalanlar "believe" olarak yazılır. Tek istekte ve yalnızca bir kez; yanıt doğruluk bilgisi taşımaz.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const roomCode = normalizeRoomCode((await params).roomCode);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_PAYLOAD", "Geçersiz istek gövdesi.");
  }
  const { suspects, participantToken: rawBodyToken } = (body ?? {}) as Record<string, unknown>;
  const token = extractToken(req, typeof rawBodyToken === "string" ? rawBodyToken : null);
  if (!token && bearerJwt(req) === null) return apiError("INVALID_TOKEN", "Token gereklidir.", 403);

  const supabase = createAdminClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("id, status, expires_at, game_mode, question_count")
    .eq("room_code", roomCode)
    .maybeSingle();

  // Oda yok ile token yanlış AYNI yanıtı verir; oda durumları kimlik doğrulandıktan sonra söylenir
  if (!room) return denyUnknownRoom(req, token);

  const { data: participants } = await supabase.from("participants").select("id, role, token_hash, user_id").eq("room_id", room.id);
  const { participant: me, viaUser, jwt } = await findParticipant(req, token, participants ?? [], { requireUnique: true });
  if (!me && jwt === "invalid") return apiError("UNAUTHORIZED", "Oturum geçersiz, tekrar giriş yapın.", 401);
  if (!me) return tokenDenied(req);
  // Sonuçlarla aynı kural: süresi dolmuş oda yalnızca hesabıyla (JWT) giren oyuncuya açıktır (geçmişten blöf avı tamamlanabilir)
  if (isRoomExpired(room.expires_at) && !viaUser) return apiError("ROOM_EXPIRED", "Bu odanın süresi dolmuş.");
  if (room.game_mode !== "bluff") return apiError("INVALID_PAYLOAD", "Bu oda blöf modunda değil.");
  if (room.status !== "result_ready" && room.status !== "completed") {
    return apiError("RESULT_NOT_READY", "Blöf avı için iki oyuncu da oyunu bitirmeli.");
  }

  const { data: mine, error: mineErr } = await supabase
    .from("predictions")
    .select("question_id, bluff_call")
    .eq("room_id", room.id)
    .eq("predictor_participant_id", me.id);
  if (mineErr || !mine) return apiError("INTERNAL_ERROR", "Kararlar okunamadı.", 500);
  if (mine.length > 0 && mine.every((p) => p.bluff_call !== null)) {
    return apiError("ALREADY_SUBMITTED", "Blöf avını zaten tamamladın.");
  }

  // Şüpheliler: bu oyuncunun tahmin ettiği sorulardan, tekrarsız, 1..hak kadar
  const rights = lieCardsFor(room.question_count);
  const list = Array.isArray(suspects) ? (suspects as unknown[]) : [];
  const chosen = new Set(list.filter((id): id is string => typeof id === "string"));
  const valid =
    mine.length > 0 &&
    list.length >= 1 &&
    list.length <= rights &&
    chosen.size === list.length &&
    [...chosen].every((id) => mine.some((p) => p.question_id === id));
  if (!valid) return apiError("INVALID_PAYLOAD", `En az 1, en çok ${rights} farklı soru seçmelisin.`);
  const calls: Record<string, BluffCall> = Object.fromEntries(mine.map((p) => [p.question_id, chosen.has(p.question_id) ? "bluff" : "believe"]));

  const { data: written, error: writeErr } = await supabase.rpc("submit_bluff_calls", {
    p_room: room.id,
    p_caller: me.id,
    p_calls: calls,
  });
  if (writeErr) return apiError("INTERNAL_ERROR", "Kararlar kaydedilemedi.", 500);
  // 0: eşzamanlı ikinci istek (kararlar az önce yazıldı)
  if (!written) return apiError("ALREADY_SUBMITTED", "Blöf avını zaten tamamladın.");

  // Mobil Realtime yalnızca `rooms` UPDATE olaylarını dinler: karşı tarafın sonuç ekranı yenilenebilsin
  await supabase.from("rooms").update({ status: room.status }).eq("id", room.id);

  return apiOk({ saved: true });
}
