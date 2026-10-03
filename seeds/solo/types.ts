export type Lang = "tr" | "en" | "es";

export type RedFlagTag =
  | "boundaries"
  | "trust"
  | "communication"
  | "jealousy"
  | "money_lifestyle"
  | "respect";

/** Tek bir Red Flag senaryosu. Doğru cevap YOKTUR: skor yalnızca Green/Yellow/Red dağılımıdır. */
export interface RedFlagScenario {
  tag: RedFlagTag;
  /** Aynı tag içindeki sıra (1-10); belirlenimci kimlik için kullanılır */
  n: number;
  tr: string;
  en: string;
  es: string;
  /** Pasife alınmış (silinmez; DB'de `is_active=false`). Yeni oyunlarda seçilmez. */
  inactive?: boolean;
}
