import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyToken } from "@/lib/token";
import { isRoomExpired } from "@/lib/expire";
import { apiError, apiOk } from "@/lib/api";

const SCORE_LABELS = [
  { min: 90, label: "Sizi okumak kitap gibi!" },
  { min: 70, label: "Birbirinizi gerçekten iyi tanıyorsunuz." },
  { min: 50, label: "Birbirinizi oldukça iyi okuyorsunuz." },
  { min: 30, label: "Henüz birbirinizi keşfediyorsunuz." },
  { min: 0, label: "Birbirinizi tanımak için güzel bir başlangıç!" },
] as const;

function getScoreLabel(score: number): string {
  return SCORE_LABELS.find((s) => score >= s.min)?.label ?? SCORE_LABELS[SCORE_LABELS.length - 1].label;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> },
) {
  const { roomCode } = await params;
  const token = req.nextUrl.searchParams.get("participantToken");

  if (!token) return apiError("INVALID_TOKEN", "Token gereklidir.", 403);

  const supabase = createAdminClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, status, game_mode, question_count, expires_at")
    .eq("room_code", roomCode)
    .maybeSingle();

  if (!room) return apiError("ROOM_NOT_FOUND", "Oda bulunamadı.", 404);
  if (isRoomExpired(room.expires_at)) return apiError("ROOM_EXPIRED", "Bu odanın süresi dolmuş.");
  if (room.status !== "result_ready" && room.status !== "completed") {
    return apiError("RESULT_NOT_READY", "Sonuçlar henüz hazır değil.");
  }

  const { data: allParticipants } = await supabase
    .from("participants")
    .select("id, role, display_name, token_hash")
    .eq("room_id", room.id);

  const participants = allParticipants ?? [];
  const me = participants.find((p) => verifyToken(token, p.token_hash));
  if (!me) return apiError("INVALID_TOKEN", "Geçersiz token.", 403);

  const partner = participants.find((p) => p.id !== me.id);

  const { data: result } = await supabase
    .from("results")
    .select("reading_score, details_json")
    .eq("room_id", room.id)
    .maybeSingle();

  if (!result) return apiError("RESULT_NOT_READY", "Sonuçlar henüz hazır değil.");

  const { data: roomQuestions } = await supabase
    .from("room_questions")
    .select("question_id, round_order, questions(id, mode, question_text, question_options(id, option_text, sort_order))")
    .eq("room_id", room.id)
    .order("round_order");

  type QuestionRow = {
    id: string;
    mode: string;
    question_text: string;
    question_options: Array<{ id: string; option_text: string; sort_order: number }>;
  };

  const questionMap = new Map<string, QuestionRow>(
    (roomQuestions ?? []).map((rq) => [
      rq.question_id,
      rq.questions as QuestionRow,
    ]),
  );

  // details_json'dan per-question breakdown oluştur
  type DetailEntry = {
    questionId: string;
    mode: string;
    roundOrder: number;
    answers: Array<{ participantId: string; answerValue: unknown }>;
    predictions: Array<{
      predictorId: string;
      targetId: string;
      predictedValue: unknown;
      confidenceLevel: string;
      result: string | null;
    }>;
  };

  const details = (result.details_json as DetailEntry[] | null) ?? [];

  const questions = details.map((d) => {
    const q = questionMap.get(d.questionId);
    const myAnswer = d.answers.find((a) => a.participantId === me.id)?.answerValue ?? null;
    const partnerAnswer = partner
      ? d.answers.find((a) => a.participantId === partner.id)?.answerValue ?? null
      : null;

    const myPrediction = d.predictions.find(
      (p) => p.predictorId === me.id && p.targetId === partner?.id,
    );
    const partnerPredictionOfMe = d.predictions.find(
      (p) => p.predictorId === partner?.id && p.targetId === me.id,
    );

    return {
      questionId: d.questionId,
      roundOrder: d.roundOrder,
      mode: d.mode,
      questionText: q?.question_text ?? "",
      options: q?.question_options
        ? q.question_options
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((o) => ({ id: o.id, optionText: o.option_text }))
        : null,
      myAnswer,
      partnerAnswer,
      myPrediction: myPrediction
        ? {
            predictedValue: myPrediction.predictedValue,
            confidenceLevel: myPrediction.confidenceLevel,
            result: myPrediction.result,
          }
        : null,
      partnerPredictionOfMe: partnerPredictionOfMe
        ? {
            predictedValue: partnerPredictionOfMe.predictedValue,
            confidenceLevel: partnerPredictionOfMe.confidenceLevel,
            result: partnerPredictionOfMe.result,
          }
        : null,
    };
  });

  const myPredictions = details.flatMap((d) =>
    d.predictions.filter((p) => p.predictorId === me.id),
  );
  const myScore = myPredictions.length > 0
    ? Math.round(
        myPredictions.filter((p) => p.result === "correct" || p.result === "near").length /
        myPredictions.length * 100,
      )
    : 0;

  return apiOk({
    readingScore: result.reading_score,
    scoreLabel: getScoreLabel(result.reading_score),
    myScore,
    room: {
      roomCode,
      gameMode: room.game_mode,
      questionCount: room.question_count,
    },
    me: { id: me.id, role: me.role, displayName: me.display_name },
    partner: partner ? { role: partner.role, displayName: partner.display_name } : null,
    questions,
  });
}
