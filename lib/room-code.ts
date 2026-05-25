import crypto from "crypto";

// Kısa, ambiguous olmayan alfanümerik set (0, O, I, 1, l çıkarıldı)
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/** Tahmin edilmesi güç 8 karakterli oda kodu üretir. */
export function generateRoomCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  return Array.from(bytes)
    .map((b) => CHARSET[b % CHARSET.length])
    .join("");
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
