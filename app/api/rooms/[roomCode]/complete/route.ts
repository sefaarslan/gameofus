import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyToken } from "@/lib/token";
import { isRoomExpired } from "@/lib/expire";
import { compareAnswers, calculateReadingScore } from "@/lib/scoring";
import { apiError, apiOk } from "@/lib/api";
import type { Json } from "@/types/database.types";

type PredictionResult = "correct" | "near" | "miss";

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

  const { participantToken } = body as Record<string, unknown>;
  if (!participantToken || typeof participantToken !== "string") {
    return apiError("INVALID_TOKEN", "Token gereklidir.");
  }

  const supabase = createAdminClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, status, expires_at, question_count")
    .eq("room_code", roomCode)
    .maybeSingle();

  if (!room) return apiError("ROOM_NOT_FOUND", "Oda bulunamadı.", 404);
  if (isRoomExpired(room.expires_at)) return apiError("ROOM_EXPIRED", "Bu odanın süresi dolmuş.");

  const { data: allParticipants } = await supabase
    .from("participants")
    .select("id, role, status, token_hash, completed_at")
    .eq("room_id", room.id);

  const participants = allParticipants ?? [];
  const me = participants.find((p) => verifyToken(participantToken, p.token_hash));
  if (!me) return apiError("INVALID_TOKEN", "Geçersiz token.", 403);

  if (me.status === "completed") {
    return apiOk({ completed: true, resultReady: room.status === "result_ready" });
  }

  const now = new Date().toISOString();
  await supabase
    .from("participants")
    .update({ status: "completed", completed_at: now })
    .eq("id", me.id);

  const partner = participants.find((p) => p.id !== me.id);

  // Partner henüz tamamlamadıysa — room status güncelle ve bekle
  if (!partner || partner.status !== "completed") {
    const newRoomStatus = me.role === "owner" ? "owner_completed" : "guest_completed";
    await supabase.from("rooms").update({ status: newRoomStatus }).eq("id", room.id);
    return apiOk({ completed: true, resultReady: false });
  }

  // Her iki oyuncu da tamamladı — sonuç hesapla
  const result = await calculateResults(room.id, participants.map((p) => p.id), supabase);
  if (!result) {
    return apiError("INTERNAL_ERROR", "Sonuç hesaplanamadı.", 500);
  }

  return apiOk({ completed: true, resultReady: true });
}

type SupabaseClient = ReturnType<typeof createAdminClient>;

async function calculateResults(
  roomId: string,
  participantIds: string[],
  supabase: SupabaseClient,
) {
  // Duplicate result kontrolü
  const { data: existingResult } = await supabase
    .from("results")
    .select("id")
    .eq("room_id", roomId)
    .maybeSingle();

  if (existingResult) {
    await supabase.from("rooms").update({ status: "result_ready" }).eq("id", roomId);
    return existingResult;
  }

  // Tüm cevap ve tahminleri çek
  const [{ data: answers }, { data: predictions }, { data: roomQuestions }] = await Promise.all([
    supabase
      .from("answers")
      .select("participant_id, question_id, answer_value")
      .eq("room_id", roomId),
    supabase
      .from("predictions")
      .select("predictor_participant_id, target_participant_id, question_id, predicted_value, confidence_level, confidence_multiplier")
      .eq("room_id", roomId),
    supabase
      .from("room_questions")
      .select("question_id, round_order, questions(mode)")
      .eq("room_id", roomId)
      .order("round_order"),
  ]);

  if (!answers || !predictions || !roomQuestions) return null;

  // question_id → mode map
  const questionModeMap = new Map<string, string>(
    roomQuestions.map((rq) => [
      rq.question_id,
      (rq.questions as { mode: string } | null)?.mode ?? "secret_choice",
    ]),
  );

  // answer map: participantId_questionId → answer_value
  const answerMap = new Map<string, Json>(
    answers.map((a) => [`${a.participant_id}:${a.question_id}`, a.answer_value]),
  );

  // Her participant için okuma skoru hesapla
  const participantScores: Record<string, { results: PredictionResult[]; score: number }> = {};

  for (const pred of predictions) {
    const mode = questionModeMap.get(pred.question_id) ?? "secret_choice";
    const targetAnswer = answerMap.get(`${pred.target_participant_id}:${pred.question_id}`);
    if (!targetAnswer) continue;

    const result = compareAnswers(
      mode as "secret_choice" | "prediction" | "orderline",
      targetAnswer as Parameters<typeof compareAnswers>[1],
      pred.predicted_value as Parameters<typeof compareAnswers>[2],
    );

    if (!participantScores[pred.predictor_participant_id]) {
      participantScores[pred.predictor_participant_id] = { results: [], score: 0 };
    }
    participantScores[pred.predictor_participant_id].results.push(result);
  }

  for (const pid of Object.keys(participantScores)) {
    participantScores[pid].score = calculateReadingScore(participantScores[pid].results);
  }

  // Genel okuma skoru (ortalama)
  const allResults = Object.values(participantScores).flatMap((s) => s.results);
  const overallScore = calculateReadingScore(allResults);

  // details_json: per-question breakdown
  const detailsJson: Json = roomQuestions.map((rq) => {
    const questionId = rq.question_id;
    const mode = questionModeMap.get(questionId) ?? "secret_choice";

    return {
      questionId,
      mode,
      roundOrder: rq.round_order,
      answers: participantIds.map((pid) => ({
        participantId: pid,
        answerValue: answerMap.get(`${pid}:${questionId}`) ?? null,
      })),
      predictions: predictions
        .filter((p) => p.question_id === questionId)
        .map((p) => {
          const targetAnswer = answerMap.get(`${p.target_participant_id}:${questionId}`);
          const result = targetAnswer
            ? compareAnswers(
                mode as "secret_choice" | "prediction" | "orderline",
                targetAnswer as Parameters<typeof compareAnswers>[1],
                p.predicted_value as Parameters<typeof compareAnswers>[2],
              )
            : null;
          return {
            predictorId: p.predictor_participant_id,
            targetId: p.target_participant_id,
            predictedValue: p.predicted_value,
            confidenceLevel: p.confidence_level,
            result,
          };
        }),
    };
  });

  const { data: resultRow, error } = await supabase
    .from("results")
    .insert({
      room_id: roomId,
      reading_score: overallScore,
      details_json: detailsJson,
    })
    .select("id")
    .single();

  if (error || !resultRow) return null;

  await supabase.from("rooms").update({ status: "result_ready" }).eq("id", roomId);

  return resultRow;
}
