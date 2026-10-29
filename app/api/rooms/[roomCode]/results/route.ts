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

export function OPTIONS() {
  return corsOptions();
}

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
  // Kod büyük/küçük harf, tire ve boşluk fark etmez (K7M-2PQ = k7m2pq)
  const roomCode = normalizeRoomCode((await params).roomCode);
  // Token `Authorization: Bearer` başlığında gelir. `?participantToken=` yalnızca eski istemciler için geçici yedektir (bkz. state/route.ts).
  const token = extractToken(req, req.nextUrl.searchParams.get("participantToken"));

  // Kimlik: katılımcı token'ı ya da giriş yapmış (mobil) kullanıcının Supabase JWT'si (geçmiş sonuçlar için)
  const hasJwt = bearerJwt(req) !== null;
  if (!token && !hasJwt) return apiError("INVALID_TOKEN", "Token gereklidir.", 403);

  const supabase = createAdminClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, status, game_mode, question_count, expires_at, relationship_type")
    .eq("room_code", roomCode)
    .maybeSingle();

  // Oda yok ile token yanlış AYNI yanıtı verir (oda varlığı sızmaz); oda durumları (süresi dolmuş, hazır değil) kimlik doğrulandıktan sonra söylenir
  if (!room) return denyUnknownRoom(req, token);
  const expired = isRoomExpired(room.expires_at);

  // Üçü de yalnızca room.id'ye bağlı — paralel okunur (sıralı 3 round-trip yerine 1)
  const [{ data: allParticipants }, { data: result }, { data: roomQuestions }] = await Promise.all([
    supabase
      .from("participants")
      .select("id, role, display_name, token_hash, user_id")
      .eq("room_id", room.id),
    supabase
      .from("results")
      .select("reading_score, details_json")
      .eq("room_id", room.id)
      .maybeSingle(),
    supabase
      .from("room_questions")
      .select("question_id, round_order, questions(id, mode, question_text, question_options(id, option_text, sort_order))")
      .eq("room_id", room.id)
      .order("round_order"),
  ]);

  const participants = allParticipants ?? [];
  const { participant: me, viaUser, jwt } = await findParticipant(req, token, participants);
  // Geçersiz/süresi dolmuş JWT → 401 (istemci oturumu yenileyebilir); geçerli JWT ama odada katılımcı değil / geçersiz token → 403
  if (!me && jwt === "invalid") return apiError("UNAUTHORIZED", "Oturum geçersiz, tekrar giriş yapın.", 401);
  if (!me) return tokenDenied(req);
  // Süresi dolmuş oda yalnızca hesabıyla (JWT) giren oyuncuya açıktır (geçmiş, saklama süresi boyunca); token ile açılmaz
  if (expired && !viaUser) return apiError("ROOM_EXPIRED", "Bu odanın süresi dolmuş.");
  if (room.status !== "result_ready" && room.status !== "completed") {
    return apiError("RESULT_NOT_READY", "Sonuçlar henüz hazır değil.");
  }

  const partner = participants.find((p) => p.id !== me.id);

  if (!result) return apiError("RESULT_NOT_READY", "Sonuçlar henüz hazır değil.");

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
      relationshipType: room.relationship_type ?? null,
    },
    me: { id: me.id, role: me.role, displayName: me.display_name },
    partner: partner ? { role: partner.role, displayName: partner.display_name } : null,
    questions,
  });
}
