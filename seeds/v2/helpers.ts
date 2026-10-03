import type { SeedQuestion } from "./types.ts";

type Opts = [text: string, options: string[]];

/** Secret Choice: Evet / Kararsız / Hayır ile cevaplanan soru. */
export const sc = (tag: string, tr: string, en: string, es: string): SeedQuestion => ({
  mode: "secret_choice",
  tag,
  tr: { text: tr },
  en: { text: en },
  es: { text: es },
});

/** Prediction: tek soru + 4 birbirinden ayrışan seçenek. */
export const pr = (tag: string, tr: Opts, en: Opts, es: Opts): SeedQuestion => ({
  mode: "prediction",
  tag,
  tr: { text: tr[0], options: tr[1] },
  en: { text: en[0], options: en[1] },
  es: { text: es[0], options: es[1] },
});

/** Orderline: 4 kart; sıralamada 1. eleman "en çok / en önemli" demektir. */
export const ol = (tag: string, tr: Opts, en: Opts, es: Opts): SeedQuestion => ({
  mode: "orderline",
  tag,
  tr: { text: tr[0], options: tr[1] },
  en: { text: en[0], options: en[1] },
  es: { text: es[0], options: es[1] },
});
