import crypto from "crypto";
import { ROOM_CODE_CHARSET, ROOM_CODE_LENGTH } from "./room-code-utils.ts";

export { normalizeRoomCode } from "./room-code-utils.ts";

/**
 * 6 karakterli oda kodu üretir (31^6 ≈ 887 milyon). Rastgelelikte modulo yanlılığı olmasın diye 248 ve üzeri baytlar atılır
 * (256 mod 31 = 8). Kısa olduğu için kötüye kullanım sınırları (hız limiti, bulunamayan kod sayacı) zorunludur.
 */
export function generateRoomCode(): string {
  const limit = 256 - (256 % ROOM_CODE_CHARSET.length);
  let out = "";
  while (out.length < ROOM_CODE_LENGTH) {
    for (const b of crypto.randomBytes(ROOM_CODE_LENGTH * 2)) {
      if (b >= limit) continue;
      out += ROOM_CODE_CHARSET[b % ROOM_CODE_CHARSET.length];
      if (out.length === ROOM_CODE_LENGTH) break;
    }
  }
  return out;
}

/**
 * Verilen oda kodu DB'de mevcut mu kontrol eder.
 * Collision varsa yeni kod üretip tekrar dener (max 5 deneme).
 */
export async function generateUniqueRoomCode(
  checkExists: (code: string) => Promise<boolean>,
): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateRoomCode();
    if (!(await checkExists(code))) return code;
  }
  throw new Error("Benzersiz oda kodu üretilemedi. Lütfen tekrar deneyin.");
}
