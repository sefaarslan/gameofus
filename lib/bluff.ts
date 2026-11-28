// Blöf modu: saf kurallar (yalan doğrulama, blöf avı puanı, unvanlar). Veritabanı/ağ yok; birim testi `scripts/test-bluff.mjs`.
// Sunucu tek doğruluk kaynağıdır: puan ve unvanlar yalnızca burada, sunucuda hesaplanır.

import { BLUFF_CONFIG } from "./bluff-config.ts";

/** Blöf modunda yalnızca Evet / Hayır vardır ("Kararsız" yok): yalan her zaman diğer seçenektir. */
export const CHOICES = ["yes", "no"] as const;
export type Choice = (typeof CHOICES)[number];

export const BLUFF_CALLS = ["believe", "bluff"] as const;
export type BluffCall = (typeof BLUFF_CALLS)[number];

export const BLUFF_TITLES = ["lie_detector", "poker_face", "too_skeptical", "pure_heart"] as const;
export type BluffTitle = (typeof BLUFF_TITLES)[number];

export const isBluffCall = (v: unknown): v is BluffCall => typeof v === "string" && (BLUFF_CALLS as readonly string[]).includes(v);

/** `{ value: "yes" | "no" }` biçimindeki JSON'dan seçimi okur; geçersizse null. */
export function readChoice(v: unknown): Choice | null {
  if (!v || typeof v !== "object") return null;
  const value = (v as { value?: unknown }).value;
  return typeof value === "string" && (CHOICES as readonly string[]).includes(value) ? (value as Choice) : null;
}

export const oppositeChoice = (c: Choice): Choice => (c === "yes" ? "no" : "yes");

/** Yalan söylenince karşı tarafa gösterilecek JSON (gerçek cevabın tersi); cevap geçersizse null. */
export function lieFor(answerValue: unknown): { value: Choice } | null {
  const truth = readChoice(answerValue);
  return truth ? { value: oppositeChoice(truth) } : null;
}

/** Bir sette kullanılabilecek Yalan Kartı sayısı (blöf avındaki "Blöf!" hakkı da budur; en az 1 kullanılır). */
export const lieCardsFor = (questionCount: number): number =>
  BLUFF_CONFIG.lieCards[questionCount] ?? Math.max(BLUFF_CONFIG.minLies, Math.floor(questionCount * 0.3));

/** Karşı tarafın gördüğü değer: yalan varsa o, yoksa gerçek cevap. */
export const shownChoice = (answerValue: unknown, shownValue: unknown): Choice | null => readChoice(shownValue ?? answerValue);

export const countLies = (answers: Array<{ shownValue: unknown }>): number => answers.filter((a) => a.shownValue != null).length;

/** Bir oyuncunun bir cevap için verdiği karar: `isLie` cevabın yalan olup olmadığı, `call` kararı. */
export interface CalledAnswer {
  isLie: boolean;
  call: BluffCall;
}

export interface CallStats {
  /** Av puanı: yakalanan yalan / karşı tarafın toplam yalanı */
  liesCaught: number;
  liesTotal: number;
  /** "Blöf" denen doğru cevap sayısı */
  doubtedTruths: number;
}

export function callStats(calls: CalledAnswer[]): CallStats {
  return {
    liesCaught: calls.filter((c) => c.isLie && c.call === "bluff").length,
    liesTotal: calls.filter((c) => c.isLie).length,
    doubtedTruths: calls.filter((c) => !c.isLie && c.call === "bluff").length,
  };
}

/** Kandırma puanı: karşı tarafın İNANDIĞI yalan sayısı. */
export const fooledCount = (partnerCallsOnMe: CalledAnswer[]): number =>
  partnerCallsOnMe.filter((c) => c.isLie && c.call === "believe").length;

/**
 * Bir oyuncunun unvanları (birden fazla olabilir, `BLUFF_TITLES` sırasıyla).
 * `myCalls`: oyuncunun karşı tarafın cevaplarına verdiği kararlar. `callsOnMe`: karşı tarafın bu oyuncunun cevaplarına verdiği
 * kararlar; henüz verilmediyse `null` (o zaman "Poker Face" belirlenemez ve eklenmez).
 */
export function titlesFor(myCalls: CalledAnswer[] | null, callsOnMe: CalledAnswer[] | null): BluffTitle[] {
  const rules = BLUFF_CONFIG.titles;
  const earned = new Set<BluffTitle>();
  if (myCalls && myCalls.length > 0) {
    const s = callStats(myCalls);
    if (s.liesTotal >= rules.lieDetectorMinLies && s.liesCaught === s.liesTotal) earned.add("lie_detector");
    const skeptical = s.doubtedTruths >= rules.skepticalMinDoubtedTruths;
    if (skeptical) earned.add("too_skeptical");
    if (!skeptical && s.liesTotal >= rules.pureHeartMinLies && s.liesCaught === 0) earned.add("pure_heart");
  }
  if (callsOnMe) {
    const s = callStats(callsOnMe);
    if (s.liesTotal >= rules.pokerFaceMinLies && s.liesCaught === 0) earned.add("poker_face");
  }
  return BLUFF_TITLES.filter((t) => earned.has(t));
}
