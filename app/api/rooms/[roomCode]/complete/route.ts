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
import { compareAnswers, calculateReadingScore } from "@/lib/scoring";
import { apiError, apiOk } from "@/lib/api";
import { normalizeRoomCode } from "@/lib/room-code-utils";
import { denyUnknownRoom, tokenDenied } from "@/lib/room-lookup";
import { countLies, lieFor } from "@/lib/bluff";
import { BLUFF_CONFIG } from "@/lib/bluff-config";
import type { Json } from "@/types/database.types";

type PredictionResult = "correct" | "near" | "miss";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> },
) {
  // Kod büyük/küçük harf, tire ve boşluk fark etmez (K7M-2PQ = k7m2pq)
  const roomCode = normalizeRoomCode((await params).roomCode);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_PAYLOAD", "Geçersiz istek gövdesi.");
  }

  const rawBodyToken = (body as Record<string, unknown>).participantToken;
  const participantToken = extractToken(req, typeof rawBodyToken === "string" ? rawBodyToken : null);
  // Kimlik: katılımcı token'ı ya da giriş yapmış (mobil) kullanıcının Supabase JWT'si (başka cihazdan devam etmek için)
  if (!participantToken && bearerJwt(req) === null) {
    return apiError("INVALID_TOKEN", "Token gereklidir.");
  }

  const supabase = createAdminClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, status, expires_at, question_count, game_mode")
    .eq("room_code", roomCode)
    .maybeSingle();

  // Oda yok ile token yanlış AYNI yanıtı verir (oda varlığı sızmaz); süresi dolmuş bilgisi kimlik doğrulandıktan sonra söylenir
  if (!room) return denyUnknownRoom(req, participantToken);

  const { data: allParticipants } = await supabase
    .from("participants")
    .select("id, role, status, token_hash, completed_at, user_id")
    .eq("room_id", room.id);

  const participants = allParticipants ?? [];
  const { participant: me, jwt } = await findParticipant(req, participantToken, participants, { requireUnique: true });
  if (!me && jwt === "invalid") return apiError("UNAUTHORIZED", "Oturum geçersiz, tekrar giriş yapın.", 401);
  if (!me) return tokenDenied(req);
  if (isRoomExpired(room.expires_at)) return apiError("ROOM_EXPIRED", "Bu odanın süresi dolmuş.");

  const isBluff = room.game_mode === "bluff";

  if (me.status === "completed") {
    // İki oyuncu da bitirmiş ama sonuç yazılmamışsa (yarıda kalan hesaplama) şimdi hesaplanır: oda takılı kalmaz
    const settled = room.status === "result_ready" || room.status === "completed";
    if (!settled && participants.length === 2 && participants.every((p) => p.status === "completed")) {
      const ok = await calculateResults(room.id, participants.map((p) => p.id), supabase, isBluff);
      return ok ? apiOk({ completed: true, resultReady: true }) : apiError("INTERNAL_ERROR", "Sonuç hesaplanamadı.", 500);
    }
    return apiOk({ completed: true, resultReady: room.status === "result_ready" });
  }

  // Blöf modu: tüm sorular cevaplanmış ve sette en az bir yalan olmalı (eksik yalan bu istekte `lieQuestionId` ile verilebilir)
  if (isBluff) {
    const problem = await enforceBluffRules(supabase, room, me.id, (body as Record<string, unknown>).lieQuestionId);
    if (problem) return problem;
  }

  // ÖNCE kendimizi tamamlandı işaretler, SONRA durumları yeniden okuruz: iki oyuncu aynı anda bitirse bile en az biri
  // diğerini "tamamlandı" görür. (Önce okuyup sonra yazmak, ikisinin de karşıyı "bitmedi" görüp sonucu hiç hesaplamamasına yol açıyordu.)
  const { error: markErr } = await supabase
    .from("participants")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", me.id);
  if (markErr) return apiError("INTERNAL_ERROR", "Oyun tamamlanamadı.", 500);

  const { data: fresh, error: freshErr } = await supabase.from("participants").select("id, status").eq("room_id", room.id);
  if (freshErr || !fresh) return apiError("INTERNAL_ERROR", "Oyun durumu okunamadı.", 500);

  // Partner henüz tamamlamadıysa — room status güncelle ve bekle
  if (fresh.length < 2 || fresh.some((p) => p.status !== "completed")) {
    const newRoomStatus = me.role === "owner" ? "owner_completed" : "guest_completed";
    // Koşullu yazma: bu arada diğer istek sonucu hazırladıysa `result_ready` geri alınmaz
    await supabase
      .from("rooms")
      .update({ status: newRoomStatus })
      .eq("id", room.id)
      .not("status", "in", "(result_ready,completed)");
    return apiOk({ completed: true, resultReady: false });
  }

  // Her iki oyuncu da tamamladı — sonuç hesapla
  const ok = await calculateResults(room.id, fresh.map((p) => p.id), supabase, isBluff);
  if (!ok) {
    return apiError("INTERNAL_ERROR", "Sonuç hesaplanamadı.", 500);
  }

  return apiOk({ completed: true, resultReady: true });
}

type SupabaseClient = ReturnType<typeof createAdminClient>;

/** Blöf modunda bitirme kuralları. Sorun yoksa null; varsa istemciye dönecek hata yanıtı. */
async function enforceBluffRules(
  supabase: SupabaseClient,
  room: { id: string; question_count: number },
  participantId: string,
  lieQuestionId: unknown,
) {
  const { data, error } = await supabase
    .from("answers")
    .select("question_id, answer_value, shown_value")
    .eq("room_id", room.id)
    .eq("participant_id", participantId);
  if (error || !data) return apiError("INTERNAL_ERROR", "Cevaplar okunamadı.", 500);
  if (data.length < room.question_count) return apiError("INVALID_PAYLOAD", "Tüm sorular cevaplanmadan oyun bitirilemez.");
  if (countLies(data.map((a) => ({ shownValue: a.shown_value }))) >= BLUFF_CONFIG.minLies) return null;

  if (lieQuestionId == null) return apiError("LIE_REQUIRED", "En az bir kez yalan söylemelisin.");
  const target = data.find((a) => a.question_id === lieQuestionId);
  const lie = target ? lieFor(target.answer_value) : null;
  if (!target || !lie) return apiError("INVALID_PAYLOAD", "Yalan Kartı bu oyundaki bir cevabında kullanılmalı.");
  const { error: writeErr } = await supabase
    .from("answers")
    .update({ shown_value: lie })
    .eq("room_id", room.id)
    .eq("participant_id", participantId)
    .eq("question_id", target.question_id)
    .is("shown_value", null);
  return writeErr ? apiError("INTERNAL_ERROR", "Yalan kaydedilemedi.", 500) : null;
}

/** Sonucu bir kez hesaplayıp yazar (`results.room_id` benzersiz). Başarılıysa (ya da başka istek yazdıysa) true. */
async function calculateResults(
  roomId: string,
  participantIds: string[],
  supabase: SupabaseClient,
  isBluff: boolean,
): Promise<boolean> {
  // Duplicate result kontrolü ve veri okuma birbirinden bağımsız — hepsi paralel
  const [{ data: existingResult }, { data: answers }, { data: predictions }, { data: roomQuestions }, shown] = await Promise.all([
    supabase
      .from("results")
      .select("id")
      .eq("room_id", roomId)
      .maybeSingle(),
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
    // Gösterilen (sahte) cevaplar yalnızca blöf modunda okunur
    isBluff
      ? supabase.from("answers").select("participant_id, question_id, shown_value").eq("room_id", roomId)
      : Promise.resolve(null),
  ]);

  // Duplicate result oluşturma (unique(room_id))
  if (existingResult) {
    await supabase.from("rooms").update({ status: "result_ready" }).eq("id", roomId);
    return true;
  }

  if (!answers || !predictions || !roomQuestions) return false;
  if (isBluff && !shown?.data) return false;

  const shownMap = new Map<string, Json>(
    (shown?.data ?? []).map((a) => [`${a.participant_id}:${a.question_id}`, a.shown_value]),
  );

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
        ...(isBluff ? { shownValue: shownMap.get(`${pid}:${questionId}`) ?? null } : {}),
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

  const { error } = await supabase.from("results").insert({
    room_id: roomId,
    reading_score: overallScore,
    details_json: detailsJson,
  });

  // 23505: aynı anda biten diğer istek sonucu bizden önce yazdı — sorun değil
  if (error && error.code !== "23505") return false;

  await supabase.from("rooms").update({ status: "result_ready" }).eq("id", roomId);

  return true;
}
