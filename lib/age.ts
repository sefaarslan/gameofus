/** Uygulamayı kullanabilmek için asgari yaş (Gizlilik Politikası/Kullanım Koşulları ile aynı tutulur). */
export const MIN_APP_AGE = 13;

/** `YYYY-MM-DD` ve gerçek bir takvim günü ise Date (UTC gece yarısı), değilse null. Gelecek tarih ve 1900 öncesi reddedilir. */
export function parseBirthDate(v: unknown, now: Date = new Date()): Date | null {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) return null;
  if (d.getTime() > now.getTime() || d.getUTCFullYear() < 1900) return null;
  return d;
}

/** Doğum tarihine göre tam yaş (bugün itibarıyla). */
export function ageOn(birth: Date, now: Date = new Date()): number {
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}
