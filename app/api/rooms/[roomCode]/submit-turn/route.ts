import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyToken, extractToken } from "@/lib/token";
import { isRoomExpired } from "@/lib/expire";
import { corsOptions } from "@/lib/cors";

export function OPTIONS() {
  return corsOptions();
}
import { compareAnswers } from "@/lib/scoring";
import { apiError, apiOk } from "@/lib/api";
import type { Json } from "@/types/database.types";

const CONFIDENCE_MULTIPLIERS = { guess: 1, think: 2, sure: 3 } as const;
type ConfidenceLevel = keyof typeof CONFIDENCE_MULTIPLIERS;

const REVEAL_MESSAGES = {
  correct: "Doğru bildin! Partnerini çok iyi okuyorsun.",
  near: "Yakındın! Birbirinize oldukça yakınsınız.",
  miss: "Iskaladın! Bu soruyu birlikte konuşabilirsiniz.",
} as const;

const REVEAL_LABELS = {
  correct: "Doğru tahmin",
  near: "Yakın tahmin",
  miss: "Iskaladı",
} as const;

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

  if (!participantToken) {
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

  // Token doğrulama
  const { data: allParticipants } = await supabase
    .from("participants")
    .select("id, role, status, token_hash")
    .eq("room_id", room.id);

  const participants = allParticipants ?? [];
  const me = participants.find((p) => verifyToken(participantToken, p.token_hash));
  if (!me) return apiError("INVALID_TOKEN", "Geçersiz token.", 403);

  const partner = participants.find((p) => p.id !== me.id);
  if (!partner) return apiError("ROOM_NOT_FOUND", "Partner henüz katılmadı.", 404);

  // Question bu odaya ait mi + mode al
  const { data: rq } = await supabase
    .from("room_questions")
    .select("question_id, questions(mode)")
    .eq("room_id", room.id)
    .eq("question_id", questionId)
    .maybeSingle();

  if (!rq) return apiError("QUESTION_NOT_FOUND", "Bu soru bu odaya ait değil.", 404);

  const questionMode = (rq.questions as { mode: string } | null)?.mode ?? "secret_choice";

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

  // Cevap + tahmin aynı anda yaz
  const [{ error: answerErr }, { error: predErr }] = await Promise.all([
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
  ]);

  if (answerErr || predErr) {
    return apiError("INTERNAL_ERROR", "Cevap kaydedilemedi.", 500);
  }

  // Participant status → playing
  if (me.status === "joined") {
    await supabase.from("participants").update({ status: "playing" }).eq("id", me.id);
    // Room status güncelle
    const newRoomStatus = me.role === "owner" ? "owner_playing" : "guest_playing";
    await supabase.from("rooms").update({ status: newRoomStatus }).eq("id", room.id);
  }

  // Mikro-reveal: partner bu soruya cevap verdiyse karşılaştır
  const { data: partnerAnswer } = await supabase
    .from("answers")
    .select("answer_value")
    .eq("room_id", room.id)
    .eq("question_id", questionId)
    .eq("participant_id", partner.id)
    .maybeSingle();

  if (!partnerAnswer) {
    return apiOk({
      saved: true,
      microReveal: {
        available: false,
        message: "Tahminin kaydedildi. Partner oynayınca birlikte göreceksiniz.",
      },
    });
  }

  // Partner cevabı var — karşılaştır (ham cevap dönme)
  const mode = questionMode as "secret_choice" | "prediction" | "orderline";
  const result = compareAnswers(mode, partnerAnswer.answer_value as Parameters<typeof compareAnswers>[1], predictedValue as Parameters<typeof compareAnswers>[2]);
  const multiplier = CONFIDENCE_MULTIPLIERS[confidence];
  const points = result === "correct" ? multiplier * 2 : result === "near" ? multiplier * 1 : 0;

  return apiOk({
    saved: true,
    microReveal: {
      available: true,
      result,
      label: REVEAL_LABELS[result],
      points,
      message: REVEAL_MESSAGES[result],
    },
  });
}
