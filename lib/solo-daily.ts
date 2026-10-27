// Günlük Red Flag seti için saf (veritabanından bağımsız) mantık: saat dilimine göre "set günü", set numarası,
// bir sonraki set zamanı ve günün setinin seçimi. Node'un tür soyma özelliğiyle test edilebilsin diye hiçbir içe aktarma yok.

/** Set numarası bu tarihten sayılır (#1). Çıkış tarihine göre ayarlanır; öncesinde numara 1'de kalır. */
export const DAILY_ANCHOR_DATE = "2026-11-01";
export const DEFAULT_TIMEZONE = "Europe/Istanbul";

/** Geçerli bir IANA saat dilimi değilse varsayılana döner. */
export function normalizeTimezone(tz: unknown): string {
  if (typeof tz !== "string" || tz.length === 0 || tz.length > 64) return DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/** Anın verilen saat dilimindeki takvim günü ("YYYY-MM-DD"): set günü. */
export function localDate(now: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" için gün sayısı (UTC gece yarısından). */
export function dayIndex(date: string): number {
  return Math.round(new Date(`${date}T00:00:00Z`).getTime() / 86_400_000);
}

/** Paylaşım kartındaki "#42": çıpa tarihinden bu yana geçen gün + 1 (en az 1). */
export function setNumber(date: string): number {
  return Math.max(1, dayIndex(date) - dayIndex(DAILY_ANCHOR_DATE) + 1);
}

/** Saat diliminin o andaki UTC'den farkı (ms). */
function offsetMs(instant: number, tz: string): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(instant))
      .map((x) => [x.type, x.value]),
  );
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** Kullanıcının bir sonraki yerel gece yarısı (UTC ISO): yeni setin açıldığı an. Yaz saati geçişlerine dayanıklıdır. */
export function nextSetAt(now: Date, tz: string): string {
  const next = addDays(localDate(now, tz), 1);
  const wall = new Date(`${next}T00:00:00Z`).getTime();
  let instant = wall - offsetMs(wall, tz);
  instant = wall - offsetMs(instant, tz);
  return new Date(instant).toISOString();
}

/**
 * Günün seti: havuz (sıralı) içinde `gün sayısı mod N`; dünün setiyle aynıysa bir sonrakine kayar.
 * Havuz boşsa null. Aynı kategori ve aynı gün için herkes aynı sonucu alır.
 */
export function pickDailyPack(pool: string[], setDate: string, yesterdayPack: string | null): string | null {
  if (pool.length === 0) return null;
  const i = ((dayIndex(setDate) % pool.length) + pool.length) % pool.length;
  if (pool.length > 1 && pool[i] === yesterdayPack) return pool[(i + 1) % pool.length];
  return pool[i];
}
