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
import { normalizeRoomCode } from "@/lib/room-code-utils";
import { denyUnknownRoom, tokenDenied } from "@/lib/room-lookup";
import { lieCardsFor, lieFor, readChoice } from "@/lib/bluff";
import type { Json } from "@/types/database.types";

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

  // Eski istemcilerin gönderdiği `confidenceLevel` yok sayılır (güven seviyesi kaldırıldı; sütunlar varsayılanda kalır)
  const { questionId, answerValue, predictedValue, isLie } =
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

  const supabase = createAdminClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, status, expires_at, game_mode, question_count")
    .eq("room_code", roomCode)
    .maybeSingle();

  // Oda yok ile token yanlış AYNI yanıtı verir (oda varlığı sızmaz); süresi dolmuş bilgisi kimlik doğrulandıktan sonra söylenir
  if (!room) return denyUnknownRoom(req, participantToken);

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
  if (!me) return tokenDenied(req);
  if (isRoomExpired(room.expires_at)) return apiError("ROOM_EXPIRED", "Bu odanın süresi dolmuş.");

  const partner = participants.find((p) => p.id !== me.id);
  if (!partner) return apiError("ROOM_NOT_FOUND", "Partner henüz katılmadı.", 404);

  if (!rq) return apiError("QUESTION_NOT_FOUND", "Bu soru bu odaya ait değil.", 404);

  // Blöf modu: yalnızca Evet / Hayır. `isLie: true` → karşı tarafa cevabın TERSİ gösterilir (Yalan Kartı; sette sınırlı sayıda).
  // Diğer modlarda `isLie` yok sayılır.
  let lie: Json | null = null;
  const lieCards = lieCardsFor(room.question_count);
  const countMyLies = async () => {
    const { count, error } = await supabase
      .from("answers")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id)
      .eq("participant_id", me.id)
      .not("shown_value", "is", null);
    return error ? null : (count ?? 0);
  };
  if (room.game_mode === "bluff") {
    if (!readChoice(answerValue) || !readChoice(predictedValue)) {
      return apiError("INVALID_PAYLOAD", "Cevap ve tahmin Evet ya da Hayır olmalı.");
    }
    if (isLie === true) lie = lieFor(answerValue);
  }

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

  // Yalan Kartı kalmamışsa hiçbir şey yazılmaz (oyuncu aynı soruyu kartsız gönderebilir)
  if (lie) {
    const used = await countMyLies();
    if (used === null) return apiError("INTERNAL_ERROR", "Cevap kaydedilemedi.", 500);
    if (used >= lieCards) return apiError("LIE_LIMIT", "Yalan Kartların bitti.");
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
      // Sütun yalnızca yalan varken yazılır (diğer modların kaydı değişmez)
      ...(lie ? { shown_value: lie } : {}),
    }),
    supabase.from("predictions").insert({
      room_id: room.id,
      question_id: questionId,
      predictor_participant_id: me.id,
      target_participant_id: partner.id,
      predicted_value: predictedValue as Json,
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

  // Eşzamanlı istekler sınırı aşmasın: yazdıktan sonra tekrar sayılır; aşan istek kendi yalanını geri alır (cevap dürüst kalır)
  if (lie) {
    const used = await countMyLies();
    if (used !== null && used > lieCards) {
      await supabase.from("answers").update({ shown_value: null }).eq("room_id", room.id).eq("participant_id", me.id).eq("question_id", questionId);
      return apiError("LIE_LIMIT", "Yalan Kartların bitti.");
    }
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
