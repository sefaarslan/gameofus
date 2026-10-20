// Batı burcu: doğum tarihinden KODDA hesaplanır (model hesaplamaz; sınır tarihlerinde yanılmaz).
// Modele yalnızca burç adı gider, doğum tarihi asla. Yorumda burç/astroloji sözcüğü geçmesi yasaktır (schema.ts → qualityIssues).

export type ZodiacSign =
  | "Aries" | "Taurus" | "Gemini" | "Cancer" | "Leo" | "Virgo"
  | "Libra" | "Scorpio" | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

/** [ay, gün]: burcun BAŞLADIĞI tarih (standart tropikal tarihler). */
const STARTS: Array<[number, number, ZodiacSign]> = [
  [1, 20, "Aquarius"], [2, 19, "Pisces"], [3, 21, "Aries"], [4, 20, "Taurus"], [5, 21, "Gemini"], [6, 21, "Cancer"],
  [7, 23, "Leo"], [8, 23, "Virgo"], [9, 23, "Libra"], [10, 23, "Scorpio"], [11, 22, "Sagittarius"], [12, 22, "Capricorn"],
];

/** "YYYY-AA-GG" → burç; geçersiz tarihte null. */
export function zodiacSignFor(birthDate: string | null | undefined): ZodiacSign | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate ?? "");
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  let sign: ZodiacSign = "Capricorn"; // 1 Ocak – 19 Ocak
  for (const [sm, sd, name] of STARTS) {
    if (month > sm || (month === sm && day >= sd)) sign = name;
  }
  return sign;
}
