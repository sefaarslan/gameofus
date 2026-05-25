import crypto from "crypto";

/** 64-char hex token üretir (256-bit entropi). Client'ta saklanır, DB'ye yazılmaz. */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Token'ın SHA-256 hash'ini döner. DB'ye yalnızca bu değer yazılır. */
export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Raw token ile DB'deki hash'i güvenli biçimde karşılaştırır (timing-safe).
 * Token doğrulaması için kullanılır; true ise geçerli participant.
 */
export function verifyToken(raw: string, storedHash: string): boolean {
  const computedHash = hashToken(raw);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, "hex"),
      Buffer.from(storedHash, "hex"),
    );
  } catch {
    return false;
  }
}
