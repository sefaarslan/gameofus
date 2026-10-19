import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { findParticipant } from "@/lib/participant-auth";
import { checkRateLimitWindow, ipHashFor } from "@/lib/rate-limit";

/** Aynı IP'den dakikada izin verilen "bulunamayan oda kodu" sayısı (kod tahminini yavaşlatır). */
export const ROOM_MISS_LIMIT = { limit: 10, windowMs: 60_000 };

/**
 * Oda bulunamadığında TÜM oda uçları aynı yanıtı döner (`404 ROOM_NOT_FOUND`, ipucu yok). Kod 6 karaktere indiği için
 * (≈887 milyon) tahmin denemeleri sayılır: aynı IP dakikada {@link ROOM_MISS_LIMIT} bulunamayan kodu geçerse `429 RATE_LIMITED`.
 * Normal kullanımda (nadiren yanlış yazılmış kod) sınıra ulaşılmaz; başarılı aramalar sayılmaz, ek sorgu yapılmaz.
 */
export async function roomNotFound(req: NextRequest) {
  const allowed = await checkRateLimitWindow(ipHashFor(req), "room_miss", ROOM_MISS_LIMIT);
  if (!allowed) return apiError("RATE_LIMITED", "Çok fazla geçersiz kod denemesi. Biraz sonra tekrar dene.", 429);
  return apiError("ROOM_NOT_FOUND", "Oda bulunamadı.", 404);
}

/**
 * Token gerektiren uçlarda (results, submit-turn, complete, feedback) **"oda yok" ile "token yanlış" AYNI yanıtı verir**:
 * `403 INVALID_TOKEN` — böylece kod tahmin edilirken oda varlığı sızmaz. Her başarısız deneme sayılır
 * ({@link ROOM_MISS_LIMIT}); aşılırsa `429 RATE_LIMITED`. (Süresi dolmuş/sonuç hazır değil gibi oda durumları da yalnızca
 * kimlik doğrulandıktan SONRA söylenir.)
 */
export async function tokenDenied(req: NextRequest) {
  const allowed = await checkRateLimitWindow(ipHashFor(req), "room_miss", ROOM_MISS_LIMIT);
  if (!allowed) return apiError("RATE_LIMITED", "Çok fazla geçersiz deneme. Biraz sonra tekrar dene.", 429);
  return apiError("INVALID_TOKEN", "Geçersiz token.", 403);
}

/** Token uçlarında oda hiç yoksa: geçersiz JWT hep `401` (odadan bağımsız), aksi halde {@link tokenDenied}. */
export async function denyUnknownRoom(req: NextRequest, token: string | null) {
  const { jwt } = await findParticipant(req, token, []);
  if (jwt === "invalid") return apiError("UNAUTHORIZED", "Oturum geçersiz, tekrar giriş yapın.", 401);
  return tokenDenied(req);
}
