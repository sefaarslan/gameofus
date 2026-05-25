const FREE_HOURS = 24;
const PREMIUM_HOURS = 72;

/** Oda bitiş zamanını döner (şimdiden +24h veya +72h). */
export function getRoomExpiry(isPremium: boolean): Date {
  const hours = isPremium ? PREMIUM_HOURS : FREE_HOURS;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/** Oda süresi dolmuş mu kontrol eder. */
export function isRoomExpired(expiresAt: string | Date): boolean {
  return new Date(expiresAt) < new Date();
}
