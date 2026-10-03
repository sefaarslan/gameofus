// Solo oyunlar (şimdilik: Red Flag Mayın Tarlası) için paylaşılan mantık.
// Doğru cevap YOKTUR: sonuç yalnızca Green/Yellow/Red dağılımından türeyen tolerans profilidir.

export const FLAGS = ["green", "yellow", "red"] as const;
export type Flag = (typeof FLAGS)[number];

export const RED_FLAG_GAME = "red_flag";
export const RED_FLAG_CARD_COUNT = 9;

export interface SoloProfile {
  counts: Record<Flag, number>;
  /** 0-100: (green×2 + yellow) / (2 × kart sayısı) */
  tolerance: number;
}

export function isFlag(v: unknown): v is Flag {
  return typeof v === "string" && (FLAGS as readonly string[]).includes(v);
}

/** Kart sırasıyla seçimlerden profil üretir. Karnedeki sabit cümle yalnızca Red sayısına (0-9) göre seçilir: `solo.verdicts.<red>`. */
export function computeProfile(flags: Flag[]): SoloProfile {
  const counts: Record<Flag, number> = { green: 0, yellow: 0, red: 0 };
  for (const f of flags) counts[f]++;
  const total = flags.length || 1;
  const tolerance = Math.round(((counts.green * 2 + counts.yellow) / (2 * total)) * 100);
  return { counts, tolerance };
}

const LETTER: Record<Flag, string> = { green: "G", yellow: "Y", red: "R" };
const FROM_LETTER: Record<string, Flag> = { G: "green", Y: "yellow", R: "red" };

/** Kart sırasıyla seçimleri 9 harfli kısa koda çevirir (paylaşım linki / görsel için), ör. "GYRGGYRYG". */
export function encodeGrid(flags: Flag[]): string {
  return flags.map((f) => LETTER[f]).join("");
}

export function decodeGrid(code: unknown): Flag[] | null {
  if (typeof code !== "string" || !new RegExp(`^[GYR]{${RED_FLAG_CARD_COUNT}}$`).test(code)) return null;
  return code.split("").map((c) => FROM_LETTER[c]);
}

/** Bayrak renkleri: marka kırmızısından (CTA) ayrışsın diye ayrı bir üçlü. */
export const FLAG_HEX: Record<Flag, string> = { green: "#3f9d6b", yellow: "#d9a21b", red: "#e0524a" };

export const GRID_EMOJI: Record<Flag, string> = { green: "🟢", yellow: "🟡", red: "🔴" };

/** Emoji ızgara metni (3×3), "Sonucumu kopyala" için. */
export function gridToEmojiText(flags: Flag[]): string {
  const rows: string[] = [];
  for (let i = 0; i < flags.length; i += 3) rows.push(flags.slice(i, i + 3).map((f) => GRID_EMOJI[f]).join(""));
  return rows.join("\n");
}
