// Doğum tarihi girişi için basit GG.AA.YYYY maskeleme (mobil uygulamadaki `src/lib/date.ts` ile aynı biçim).

/** Kullanıcı yazarken ham girdiyi "GG.AA.YYYY" biçimine maskeler. */
export function maskBirthDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join(".");
}

/** "GG.AA.YYYY" → "YYYY-AA-GG" (sunucu biçimi). Geçersiz/gelecek tarih için null. */
export function parseBirthDateInput(display: string): string | null {
  const digits = display.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  if (year < 1900 || year > new Date().getFullYear()) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > new Date(year, month, 0).getDate()) return null;
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  if (new Date(`${iso}T00:00:00Z`).getTime() > Date.now()) return null;
  return iso;
}

/** Tam yaş (bugün itibarıyla); `iso` "YYYY-AA-GG". */
export function ageFromIso(iso: string, now: Date = new Date()): number {
  const [y, m, d] = iso.split("-").map(Number);
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
  return age;
}
