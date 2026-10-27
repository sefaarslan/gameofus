// Günlük Red Flag seti birim testleri (lib/solo-daily.ts; veritabanı yok):  node --no-warnings scripts/test-solo-daily.mjs
import { DAILY_ANCHOR_DATE, addDays, dayIndex, localDate, nextSetAt, normalizeTimezone, pickDailyPack, setNumber } from "../lib/solo-daily.ts";

let fails = 0;
const ok = (c, m) => { console.log((c ? "✔ " : "✗ ") + m); if (!c) fails++; };

// ── Set günü: yerel takvim günü ─────────────────────────────────────────────
const t = new Date("2026-10-26T22:30:00Z");
ok(localDate(t, "Europe/Istanbul") === "2026-10-27", "22:30Z → İstanbul'da (UTC+3) ertesi gün");
ok(localDate(t, "America/New_York") === "2026-10-26", "22:30Z → New York'ta hâlâ aynı gün");
ok(localDate(new Date("2026-10-26T20:59:59Z"), "Europe/Istanbul") === "2026-10-26", "İstanbul 23:59:59 → hâlâ dünün seti");
ok(localDate(new Date("2026-10-26T21:00:00Z"), "Europe/Istanbul") === "2026-10-27", "İstanbul 00:00 → yeni set günü");
ok(localDate(new Date("2026-12-31T23:30:00Z"), "Asia/Tokyo") === "2027-01-01", "yıl sonu sınırı (Tokyo)");

// ── Saat dilimi doğrulama ───────────────────────────────────────────────────
ok(normalizeTimezone("Europe/Berlin") === "Europe/Berlin", "geçerli saat dilimi korunur");
ok(normalizeTimezone("Mars/Olympus") === "Europe/Istanbul" && normalizeTimezone(undefined) === "Europe/Istanbul" && normalizeTimezone("") === "Europe/Istanbul" && normalizeTimezone(42) === "Europe/Istanbul", "geçersiz/eksik saat dilimi → Europe/Istanbul");
ok(normalizeTimezone("x".repeat(200)) === "Europe/Istanbul", "aşırı uzun değer reddedilir");

// ── Bir sonraki set (yerel gece yarısı) ─────────────────────────────────────
ok(nextSetAt(t, "Europe/Istanbul") === "2026-10-27T21:00:00.000Z", "İstanbul: bir sonraki 00:00 = 21:00Z");
ok(nextSetAt(t, "America/New_York") === "2026-10-27T04:00:00.000Z", "New York (EDT): bir sonraki 00:00 = 04:00Z");
ok(nextSetAt(t, "Asia/Kolkata") === "2026-10-27T18:30:00.000Z", "Hindistan (+5:30): yarım saatlik fark");
ok(nextSetAt(new Date("2026-03-28T12:00:00Z"), "Europe/Berlin") === "2026-03-28T23:00:00.000Z", "Berlin, yaz saatinden önceki gece (CET)");
ok(nextSetAt(new Date("2026-03-29T00:30:00Z"), "Europe/Berlin") === "2026-03-29T22:00:00.000Z", "Berlin, yaz saati geçiş günü: gece yarısı CEST'e göre (23 saatlik gün)");
ok(nextSetAt(new Date("2026-10-25T10:00:00Z"), "Europe/Berlin") === "2026-10-25T23:00:00.000Z", "Berlin, kış saatine dönüş günü (25 saatlik gün)");
for (const tz of ["Europe/Istanbul", "America/Los_Angeles", "Pacific/Kiritimati", "Pacific/Pago_Pago", "Australia/Lord_Howe"]) {
  const n = new Date("2026-06-15T09:17:00Z");
  const next = new Date(nextSetAt(n, tz));
  ok(next > n && next.getTime() - n.getTime() <= 25 * 3600_000 && localDate(next, tz) === addDays(localDate(n, tz), 1) && localDate(new Date(next.getTime() - 1000), tz) === localDate(n, tz), `${tz}: sınır tam gece yarısı (1 sn önce eski gün, tam anında yeni gün)`);
}

// ── Set numarası ────────────────────────────────────────────────────────────
ok(setNumber(DAILY_ANCHOR_DATE) === 1 && setNumber(addDays(DAILY_ANCHOR_DATE, 41)) === 42, "çıpa günü #1, 41 gün sonrası #42");
ok(setNumber("2020-01-01") === 1, "çıpadan önce numara 1'de kalır");
ok(dayIndex("2026-03-29") - dayIndex("2026-03-28") === 1 && dayIndex("2026-11-01") - dayIndex("2026-10-31") === 1, "gün sayısı yaz saatinden etkilenmez");

// ── Günün seti ──────────────────────────────────────────────────────────────
for (const n of [2, 3, 7]) {
  const pool = Array.from({ length: n }, (_, i) => `friend-${101 + i}`);
  let prev = null, repeats = 0; const seen = new Set();
  for (let d = 0; d < 60; d++) {
    const pick = pickDailyPack(pool, addDays("2026-11-01", d), prev);
    if (pick === prev) repeats++;
    seen.add(pick); prev = pick;
  }
  ok(repeats === 0 && seen.size === n, `havuz ${n}: 60 günde ardışık tekrar yok, hepsi kullanılıyor`);
}
const pool3 = ["friend-101", "friend-102", "friend-103"];
ok(pickDailyPack(pool3, "2026-11-05", null) === pickDailyPack(pool3, "2026-11-05", null), "aynı gün + aynı havuz = aynı set (herkes aynı seti görür)");
// Havuz büyüyünce (3 → 7) dünün seti yine de tekrar etmez
const pool7 = [...pool3, "friend-104", "friend-105", "friend-106", "friend-107"];
let bad = 0;
for (let d = 0; d < 30; d++) {
  const date = addDays("2026-11-01", d);
  const yesterday = pickDailyPack(pool3, addDays(date, -1), null);
  if (pickDailyPack(pool7, date, yesterday) === yesterday) bad++;
}
ok(bad === 0, "havuz büyürken (3 → 7) dünün seti bugün çıkmaz");
ok(pickDailyPack([], "2026-11-05", null) === null, "boş havuz → null");
ok(pickDailyPack(["friend-101"], "2026-11-05", "friend-101") === "friend-101", "tek setli havuz: tekrar kaçınılmaz, hata vermez");

console.log(fails ? `\n${fails} test BAŞARISIZ` : "\nTüm testler geçti");
process.exit(fails ? 1 : 0);
