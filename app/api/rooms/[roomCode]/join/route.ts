import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateToken, hashToken, verifyToken, extractToken } from "@/lib/token";
import { isRoomExpired } from "@/lib/expire";
import { apiError, apiOk } from "@/lib/api";
import { normalizeRoomCode } from "@/lib/room-code-utils";
import { roomNotFound } from "@/lib/room-lookup";
import { checkRateLimitWindow, ipHashFor } from "@/lib/rate-limit";
import { corsOptions } from "@/lib/cors";
import { getAuthUser } from "@/lib/auth";
import { parseGender } from "@/lib/gender";
import { MIN_APP_AGE, ageOn, parseBirthDate } from "@/lib/age";
import { WEB_AI_CONSENT_VERSION } from "@/lib/ai/consent";

export function OPTIONS() {
  return corsOptions();
}

/** Katılma denemesi sınırı: IP başına ve (giriş yapmışsa) kullanıcı başına dakikada 10 deneme. Kod 6 karaktere indiği için tahmini yavaşlatır. */
const JOIN_ATTEMPT_LIMIT = { limit: 10, windowMs: 60_000 };

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

  const { displayName, platform, gender, birthDate, aiConsent } = body as Record<string, unknown>;
  const rawBodyToken = (body as Record<string, unknown>).participantToken;
  const participantToken = extractToken(req, typeof rawBodyToken === "string" ? rawBodyToken : null);

  if (!displayName || typeof displayName !== "string" || displayName.trim().length === 0) {
    return apiError("INVALID_PAYLOAD", "İsim zorunludur.");
  }

  // Katılanın KENDİ doğum tarihi (isteğe bağlı; yorum kişiselleştirme): geçerli olmalı ve asgari yaş (13) sağlanmalı
  const guestBirth = birthDate == null || birthDate === "" ? null : parseBirthDate(birthDate);
  if (birthDate != null && birthDate !== "" && !guestBirth) {
    return apiError("INVALID_PAYLOAD", "Geçersiz doğum tarihi (YYYY-AA-GG).");
  }
  if (guestBirth && ageOn(guestBirth) < MIN_APP_AGE) {
    return apiError("AGE_RESTRICTED", `Game of Us'ı kullanmak için en az ${MIN_APP_AGE} yaşında olmalısın.`, 403);
  }

  // Mobil (giriş zorunlu): misafir de giriş yapmış olmalı; katılımcı kullanıcıya bağlanır (geçmiş, hesap silme). Web anonimdir.
  const authUser = await getAuthUser(req);
  if (platform === "mobile" && !authUser) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);

  // Hız limiti: her deneme sayılır (başarılı ya da değil); aşılırsa 429 RATE_LIMITED
  const [ipAllowed, userAllowed] = await Promise.all([
    checkRateLimitWindow(ipHashFor(req), "join_attempt", JOIN_ATTEMPT_LIMIT),
    authUser ? checkRateLimitWindow(`u:${authUser.id}`, "join_attempt", JOIN_ATTEMPT_LIMIT) : Promise.resolve(true),
  ]);
  if (!ipAllowed || !userAllowed) {
    return apiError("RATE_LIMITED", "Çok fazla katılma denemesi. Biraz sonra tekrar dene.", 429);
  }

  const supabase = createAdminClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, status, join_locked, expires_at, game_mode, question_count, category_id, user_id")
    .eq("room_code", roomCode)
    .maybeSingle();

  if (!room) return roomNotFound(req);
  if (isRoomExpired(room.expires_at)) return apiError("ROOM_EXPIRED", "Bu odanın süresi dolmuş.");

  // Webden kurulan oda (kurucusu hesapsız: `rooms.user_id` boş) yalnızca deneme amaçlıdır ve yalnızca webden oynanır:
  // mobil kimlikle (platform "mobile" + JWT) katılma reddedilir. Mobilden kurulan odaya hem mobil hem web katılabilir.
  if (platform === "mobile" && authUser && !room.user_id) {
    return apiError("ROOM_WEB_ONLY", "Bu oda web'de kurulmuş ve yalnızca web'den oynanabilir.", 403);
  }

  const { data: existingParticipants } = await supabase
    .from("participants")
    .select("id, role, display_name, status, token_hash")
    .eq("room_id", room.id);

  const participants = existingParticipants ?? [];

  // Mevcut token varsa doğrula
  if (typeof participantToken === "string" && participantToken.length > 0) {
    const match = participants.find((p) => verifyToken(participantToken, p.token_hash));
    if (match) {
      return apiOk({
        roomCode,
        participant: {
          id: match.id,
          role: match.role,
          displayName: match.display_name,
          token: participantToken,
        },
        roomStatus: room.status,
      });
    }
  }

  // Yeni guest oluştur
  if (room.join_locked || participants.length >= 2) {
    return apiError("ROOM_FULL", "Bu odada iki kişi zaten var.");
  }

  // Yaş koşullu kategori (Cesur 18+): katılan da yaşını kendi hesabından kanıtlamalı. Mobilde profildeki doğum tarihi okunur;
  // web anonim olduğu için doğum tarihi yoktur → bu odaya web'den katılınamaz (mobil uygulamaya yönlendirilir).
  if (room.category_id) {
    const { data: cat } = await supabase.from("categories").select("min_age").eq("id", room.category_id).maybeSingle();
    if (cat && cat.min_age > 0) {
      if (!authUser) {
        return apiError("AGE_VERIFICATION_REQUIRED", `Bu oyun ${cat.min_age}+ oyunculara özeldir ve yalnızca mobil uygulamada oynanır.`);
      }
      const { data: profile } = await supabase.from("users").select("birth_date").eq("id", authUser.id).maybeSingle();
      const birth = parseBirthDate(profile?.birth_date ?? null);
      if (!birth) return apiError("AGE_VERIFICATION_REQUIRED", "Bu oyun için doğum tarihini profilinde girmelisin.");
      if (ageOn(birth) < cat.min_age) {
        return apiError("AGE_RESTRICTED", `Bu oyun yalnızca ${cat.min_age}+ oyuncular içindir.`, 403);
      }
    }
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const guestGender = parseGender(gender);
  // Hesapsız (web) misafirin isteğe bağlı AI rızası: yalnızca mobilden kurulmuş odada anlamlıdır (web odalarında AI yoktur) ve yalnızca
  // kesin `true` kabul edilir. Hesaplı oyuncunun rızası `users` tablosundadır, buradaki alan yok sayılır.
  const guestAiConsent = aiConsent === true && !authUser && !!room.user_id;
  // Rıza veren oyuncunun yaş aralığı ve burcu yoruma girer: doğum tarihi rızayla birlikte zorunludur (rıza yoksa isteğe bağlı).
  if (guestAiConsent && !guestBirth) {
    return apiError("INVALID_PAYLOAD", "Yapay zekâ yorumuna izin vermek için doğum tarihi gereklidir.");
  }

  const { data: guest, error: guestErr } = await supabase
    .from("participants")
    .insert({
      room_id: room.id,
      role: "guest",
      display_name: displayName.trim(),
      status: "joined",
      token_hash: tokenHash,
      // Cinsiyet opsiyoneldir ve yalnızca katılanın kendi beyanıdır (gerektiğinde istemci gönderir)
      ...(guestGender ? { gender: guestGender } : {}),
      // Katılanın kendi doğum tarihi (isteğe bağlı; yalnızca bu odada, oda silinince gider)
      ...(guestBirth && typeof birthDate === "string" ? { birth_date: birthDate } : {}),
      ...(authUser ? { user_id: authUser.id } : {}),
      ...(guestAiConsent ? { ai_consent_at: new Date().toISOString(), ai_consent_version: WEB_AI_CONSENT_VERSION } : {}),
    })
    .select("id")
    .single();

  if (guestErr || !guest) {
    return apiError("INTERNAL_ERROR", "Odaya katılınamadı.", 500);
  }

  // Oda doldu, kilitle ve status güncelle
  await supabase
    .from("rooms")
    .update({ join_locked: true, status: "guest_joined" })
    .eq("id", room.id);

  return apiOk({
    roomCode,
    participant: {
      id: guest.id,
      role: "guest",
      displayName: displayName.trim(),
      token: rawToken,
    },
    roomStatus: "guest_joined",
  });
}
