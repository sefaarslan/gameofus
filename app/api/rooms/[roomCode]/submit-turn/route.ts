import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { extractToken } from "@/lib/token";
import { bearerJwt } from "@/lib/auth";
import { findParticipant } from "@/lib/participant-auth";
import { isRoomExpired } from "@/lib/expire";
import { corsOptions } from "@/lib/cors";

export function OPTIONS() {
  return corsOptions();
}
import { apiError, apiOk } from "@/lib/api";
import type { Json } from "@/types/database.types";

const CONFIDENCE_MULTIPLIERS = { guess: 1, think: 2, sure: 3 } as const;
type ConfidenceLevel = keyof typeof CONFIDENCE_MULTIPLIERS;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> },
) {
  const { roomCode } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_PAYLOAD", "Geçersiz istek gövdesi.");
  }

  const { questionId, answerValue, predictedValue, confidenceLevel } =
    body as Record<string, unknown>;
  const rawBodyToken = (body as Record<string, unknown>).participantToken;
  const participantToken = extractToken(req, typeof rawBodyToken === "string" ? rawBodyToken : null);

  // Kimlik: katılımcı token'ı ya da giriş yapmış (mobil) kullanıcının Supabase JWT'si (başka cihazdan devam etmek için)
  if (!participantToken && bearerJwt(req) === null) {
    return apiError("INVALID_TOKEN", "Token gereklidir.");
  }
  if (!questionId || typeof questionId !== "string") {
    return apiError("INVALID_PAYLOAD", "questionId gereklidir.");
  }
  if (!answerValue || !predictedValue) {
    return apiError("INVALID_PAYLOAD", "Cevap ve tahmin gereklidir.");
  }

  const confidence: ConfidenceLevel =
    typeof confidenceLevel === "string" && confidenceLevel in CONFIDENCE_MULTIPLIERS
      ? (confidenceLevel as ConfidenceLevel)
      : "guess";

  const supabase = createAdminClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, status, expires_at, game_mode")
    .eq("room_code", roomCode)
    .maybeSingle();

  if (!room) return apiError("ROOM_NOT_FOUND", "Oda bulunamadı.", 404);
  if (isRoomExpired(room.expires_at)) return apiError("ROOM_EXPIRED", "Bu odanın süresi dolmuş.");

  // Token doğrulama + soru kontrolü — ikisi de yalnızca room.id'ye bağlı, paralel çalışır
  const [{ data: allParticipants }, { data: rq }] = await Promise.all([
    supabase
      .from("participants")
      .select("id, role, status, token_hash, user_id")
      .eq("room_id", room.id),
    supabase
      .from("room_questions")
      .select("question_id")
      .eq("room_id", room.id)
      .eq("question_id", questionId)
      .maybeSingle(),
  ]);

  const participants = allParticipants ?? [];
  const { participant: me, jwt } = await findParticipant(req, participantToken, participants, { requireUnique: true });
  // Geçersiz/süresi dolmuş JWT → 401 (istemci oturumu yenileyebilir); geçerli JWT ama bu odanın katılımcısı değil / geçersiz token → 403
  if (!me && jwt === "invalid") return apiError("UNAUTHORIZED", "Oturum geçersiz, tekrar giriş yapın.", 401);
  if (!me) return apiError("INVALID_TOKEN", "Geçersiz token.", 403);

  const partner = participants.find((p) => p.id !== me.id);
  if (!partner) return apiError("ROOM_NOT_FOUND", "Partner henüz katılmadı.", 404);

  if (!rq) return apiError("QUESTION_NOT_FOUND", "Bu soru bu odaya ait değil.", 404);

  // Duplicate submit kontrolü
  const { data: existingAnswer } = await supabase
    .from("answers")
    .select("id")
    .eq("room_id", room.id)
    .eq("question_id", questionId)
    .eq("participant_id", me.id)
    .maybeSingle();

  if (existingAnswer) {
    return apiError("ALREADY_SUBMITTED", "Bu soruya zaten cevap verdiniz.");
  }

  const now = new Date().toISOString();

  // Cevap + tahmin yazma ve katılımcı/oda durum güncellemesi — birbirine bağlı değil, paralel çalışır.
  // Partnerin cevabı burada OKUNMAZ ve doğru/yakın/ıskaladı gibi anlık sonuç dönülmez: sonuçlar yalnızca iki taraf da
  // bitirince sonuç endpoint'inde açılır (reveal öncesi partner verisi hiçbir biçimde sızmaz).
  const newRoomStatus = me.role === "owner" ? "owner_playing" : "guest_playing";
  const [
    { error: answerErr },
    { error: predErr },
    ,
  ] = await Promise.all([
    supabase.from("answers").insert({
      room_id: room.id,
      question_id: questionId,
      participant_id: me.id,
      answer_value: answerValue as Json,
      locked_at: now,
    }),
    supabase.from("predictions").insert({
      room_id: room.id,
      question_id: questionId,
      predictor_participant_id: me.id,
      target_participant_id: partner.id,
      predicted_value: predictedValue as Json,
      confidence_level: confidence,
      confidence_multiplier: CONFIDENCE_MULTIPLIERS[confidence],
      locked_at: now,
    }),
    me.status === "joined"
      ? supabase.from("participants").update({ status: "playing" }).eq("id", me.id)
      : Promise.resolve(null),
    me.status === "joined"
      ? supabase.from("rooms").update({ status: newRoomStatus }).eq("id", room.id)
      : Promise.resolve(null),
  ]);

  if (answerErr || predErr) {
    return apiError("INTERNAL_ERROR", "Cevap kaydedilemedi.", 500);
  }

  // `microReveal` yalnızca eski istemcilerin yanıt şeklini bozmamak için kalır (her zaman available:false); yeni istemciler yok sayar.
  return apiOk({
    saved: true,
    microReveal: {
      available: false,
      message: "Tahminin kaydedildi. Yanıtlar, tüm sorular bitince birlikte görünecek.",
    },
  });
}
