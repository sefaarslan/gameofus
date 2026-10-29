import crypto from "crypto";
import { NextRequest } from "next/server";

/** 64-char hex token üretir (256-bit entropi). Client'ta saklanır, DB'ye yazılmaz. */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Token'ın SHA-256 hash'ini döner. DB'ye yalnızca bu değer yazılır. */
export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Authorization: Bearer <token> header → fallback sıralamasıyla token çıkarır.
 * Web ve mobil token'ı Bearer başlığıyla (okuma uçları) ya da gövdeyle (yazma uçları) gönderir; `fallback` gövde ya da
 * (eski istemciler için, kullanımdan kalkıyor) query parametresidir. Token yeni kodda asla URL'de taşınmaz.
 */
export function extractToken(req: NextRequest, fallback?: string | null): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    // Supabase JWT (3 parça) katılımcı token'ı değildir (64 hex, nokta içermez): mobil kullanıcı kimliği için ayrılmıştır
    if (token && token.split(".").length !== 3) return token;
  }
  return fallback ?? null;
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
