/** Opsiyonel cinsiyet (çöp adam karakteri ve AI dili için). `null` = belirtilmedi (nötr). */
export const GENDERS = ["female", "male"] as const;
export type Gender = (typeof GENDERS)[number];

export function isGender(value: unknown): value is Gender {
  return typeof value === "string" && (GENDERS as readonly string[]).includes(value);
}

/** Geçersiz/boş değer "belirtilmedi" sayılır (hata vermez: alan tamamen opsiyoneldir). */
export function parseGender(value: unknown): Gender | null {
  return isGender(value) ? value : null;
}
