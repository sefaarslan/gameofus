// UYDURMA solo oturumu üretici (yalnızca geliştirme/değerlendirme için): gerçek senaryo metinleri (seeds/solo) + istenen bayrak profili.
// Çıktı: Red Flag adaptörünün beklediği { session, input } (veritabanı yok, kişisel veri yok).
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { redFlagScenarios } = await import(pathToFileURL(resolve("seeds/solo/red-flag.ts")).href);

/** Test profilleri: 9 kartın bayrakları (kart sırasıyla). Karışık profil, aynı temada hem Green hem Red içerir (friend-101: trust, boundaries). */
export const PROFILES = {
  all_green: "GGGGGGGGG",
  all_red: "RRRRRRRRR",
  all_yellow: "YYYYYYYYY",
  mixed: "GRGYGYRYR",
  single_red: "GGGGGGGGR",
};
const NAME = { G: "green", Y: "yellow", R: "red" };

export function buildFakeSolo({ pack = "friend-101", locale = "tr", profile = "mixed", flags } = {}) {
  const code = flags ?? PROFILES[profile];
  if (!code || code.length !== 9) throw new Error(`Bilinmeyen profil: ${profile}`);
  const cards = redFlagScenarios.filter((s) => s.pack === pack && !s.inactive).sort((a, b) => a.pos - b.pos);
  if (cards.length !== 9) throw new Error(`Set bulunamadı: ${pack}`);
  const ids = cards.map((c) => `fake-${c.tag}-${c.n}`);
  return {
    session: {
      id: "00000000-0000-4000-8000-000000000000",
      game: "red_flag",
      locale,
      pack_key: pack,
      status: "completed",
      user_id: "fake-user",
      scenario_ids: ids,
      answers: Object.fromEntries(ids.map((id, i) => [id, NAME[code[i]]])),
    },
    input: { scenarios: cards.map((c, i) => ({ id: ids[i], scenario_text: c[locale], insight_tag: c.tag })) },
  };
}
