// Oda kodu yardımcıları — Node'a bağımlı değildir (hem sunucu hem istemci kullanır).
// Linkteki kod (`/game/room/{roomCode}`) ile kullanıcının elle yazdığı kod AYNI değerdir; ayrı bir takma ad/kısa kod yoktur.

/** Karışabilecek karakterler çıkarıldı: 0, O, 1, I, L. */
export const ROOM_CODE_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Yeni odalar için kod uzunluğu (elle yazması kolay). Eski odalar 8 karakterlidir ve geçerli kalır. */
export const ROOM_CODE_LENGTH = 6;

/** Eski (8) ve olası daha uzun kodları da kapsayan makul aralık; yalnızca arayüz doğrulaması için. */
export const ROOM_CODE_MIN_INPUT = 6;
export const ROOM_CODE_MAX_INPUT = 10;

/**
 * Kullanıcının yazdığı/yapıştırdığı kodu kanonik biçime getirir: büyük/küçük harf, tire, boşluk ve diğer işaretler fark etmez.
 * "k7m-2pq", "K7M 2PQ" ve "K7M2PQ" aynı oda: "K7M2PQ". Roomcode alan tüm uçlar ve sayfalar bunu kullanır.
 */
export function normalizeRoomCode(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/** Arayüzde girilen kod makul bir uzunlukta mı (ağa gitmeden önce hızlı kontrol). */
export function isPlausibleRoomCode(code: string): boolean {
  return code.length >= ROOM_CODE_MIN_INPUT && code.length <= ROOM_CODE_MAX_INPUT && /^[A-Z0-9]+$/.test(code);
}

/** Gösterim için gruplar: 6 karakter → "K7M-2PQ", 8 karakter (eski) → "K7M2-PQ34"; diğerleri olduğu gibi. */
export function formatRoomCode(code: string): string {
  const c = normalizeRoomCode(code);
  if (c.length === 6) return `${c.slice(0, 3)}-${c.slice(3)}`;
  if (c.length === 8) return `${c.slice(0, 4)}-${c.slice(4)}`;
  return c;
}

/** URL parametresini (kodlu olabilir: "K7M%2D2PQ") çözüp döndürür; bozuksa olduğu gibi. */
export function decodeRoomCodeParam(param: string): string {
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}
