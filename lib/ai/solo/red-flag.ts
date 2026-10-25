// Red Flag Mayın Tarlası adaptörü: 9 sabit senaryo, her birine Green / Yellow / Red. DOĞRU CEVAP YOKTUR; analiz bir tolerans profilidir.
//
// Modele giden veri: set kategorisi (arkadaşlık / sevgili), her kartın senaryo metni + tema + seçilen bayrak, kodda hesaplanmış sayılar.
// Ad, cinsiyet, doğum tarihi, e-posta, kimlikler GİTMEZ. Senaryo metinleri herkese açık, cinsiyetsiz içeriktir.

import { computeProfile, getPack, isFlag } from "../../solo.ts";
import type { Flag } from "../../solo.ts";
import type { Locale } from "../digest.ts";
import type { ModelOutput, SoloAdapter, SoloSessionRow } from "./types.ts";

export const RED_FLAG_GAME_TYPE = "red_flag";

/** Tema (insight_tag) → modele giden İngilizce ad */
const THEME_LABEL: Record<string, string> = {
  boundaries: "personal boundaries",
  trust: "trust",
  communication: "communication",
  jealousy: "jealousy and possessiveness",
  money_lifestyle: "money and lifestyle",
  respect: "respect",
};

export interface RedFlagInput {
  scenarios: Array<{ id: string; scenario_text: string; insight_tag: string }>;
}

export type ProfileKind =
  | "all_green"
  | "green_with_single_red"
  | "mostly_green"
  | "all_red"
  | "mostly_red"
  | "all_yellow"
  | "mostly_yellow"
  | "mixed";

export interface RedFlagDigest {
  locale: Locale;
  /** Set kategorisi = ilişki bağlamı */
  context: "friends" | "romantic";
  counts: Record<Flag, number>;
  /** 0-100 tolerans (modele hazır verilir; metinde sayı olarak YAZILMAZ) */
  tolerance: number;
  profile: ProfileKind;
  /** Kart sırasıyla: senaryo metni (oturum dilinde), tema, seçilen bayrak */
  cards: Array<{ theme: string; scenario: string; flag: Flag }>;
  /** Tema başına bayrak sayıları */
  themes: Array<{ theme: string; green: number; yellow: number; red: number }>;
  /** Hem Green hem Red içeren temalar: en ilginç karşıtlıklar */
  mixedThemes: string[];
}

export function profileKindOf(c: Record<Flag, number>): ProfileKind {
  const n = c.green + c.yellow + c.red;
  if (c.green === n) return "all_green";
  if (c.red === n) return "all_red";
  if (c.yellow === n) return "all_yellow";
  if (c.green === n - 1 && c.red === 1) return "green_with_single_red";
  if (c.red >= 6) return "mostly_red";
  if (c.yellow >= 6) return "mostly_yellow";
  if (c.green >= 7) return "mostly_green";
  return "mixed";
}

/** Profile göre oyuna özel ton ve bölüm yönergesi (İngilizce) */
const PROFILE_NOTES: Record<ProfileKind, string> = {
  all_green:
    "PROFILE: the player marked EVERY card green. Be warm and appreciative of how easygoing and open they are, then get curious: where does their line begin? Leave \"red_lines\" and \"gray_areas\" EMPTY. The self-questions probe where a line might start, without suggesting they are naive.",
  green_with_single_red:
    "PROFILE: almost everything green and exactly ONE red card. Put that single red card in the spotlight: it is where the player's line is crystal clear. Describe the contrast between the relaxed rest and that one firm line. Leave \"gray_areas\" EMPTY.",
  mostly_green:
    "PROFILE: mostly green, with a few yellow or red cards. Easygoing overall; name the few exceptions concretely.",
  all_red:
    "PROFILE: the player marked EVERY card red. Be clear and protective of those standards: firm, never paranoid, rigid, closed-off or difficult, and no exaggeration. Leave \"green_zone\" and \"gray_areas\" EMPTY. The self-questions ask what each red protects and whether any situation could ever be 'it depends'.",
  mostly_red:
    "PROFILE: mostly red. Clear and protective standards, no exaggeration, never paranoid or rigid. Use the few green or yellow cards as the contrast: where the player is willing to be flexible.",
  all_yellow:
    "PROFILE: EVERY card yellow ('it depends'). Contextual and thoughtful, not wishy-washy. Leave \"green_zone\" and \"red_lines\" EMPTY. The self-questions explore what would tip a yellow to green or to red.",
  mostly_yellow:
    "PROFILE: mostly 'it depends'. Contextual and thoughtful; use the few green or red cards as anchors and ask what tips the rest.",
  mixed:
    "PROFILE: a mix. Say in which themes the player is relaxed and in which firm (use the theme summary). Themes that contain BOTH a green and a red card are the most interesting contrast: build the self-questions around them and around the yellow cards.",
};

function isCompleted(session: SoloSessionRow): boolean {
  if (session.status !== "completed" || !session.answers || typeof session.answers !== "object") return false;
  const saved = session.answers as Record<string, unknown>;
  return session.scenario_ids.length > 0 && session.scenario_ids.every((id) => isFlag(saved[id]));
}

export const redFlagAdapter: SoloAdapter<RedFlagInput, RedFlagDigest> = {
  gameType: RED_FLAG_GAME_TYPE,

  sections: [
    {
      id: "green_zone",
      kind: "bullets",
      min: 0,
      max: 4,
      titles: { tr: "Rahat bölgen", en: "Your comfort zone", es: "Tu zona de confort" },
      instruction:
        "Based ONLY on the GREEN cards: what kinds of situations the player is relaxed about. One bullet per theme or notable card (group cards of the same theme in one bullet). Empty array if there are no green cards.",
    },
    {
      id: "red_lines",
      kind: "bullets",
      min: 0,
      max: 4,
      titles: { tr: "Kırmızı çizgilerin", en: "Your red lines", es: "Tus líneas rojas" },
      instruction:
        "Based ONLY on the RED cards: where the player's line is clear. One bullet per theme or notable card. Empty array if there are no red cards.",
    },
    {
      id: "gray_areas",
      kind: "bullets",
      min: 0,
      max: 4,
      titles: { tr: "Gri alanların", en: "Your gray areas", es: "Tus zonas grises" },
      instruction:
        "Based ONLY on the YELLOW cards ('it depends'): what the player could not decide on at a glance. Describe the situation; do not invent what tips it either way. Empty array if there are no yellow cards.",
    },
    {
      id: "self_questions",
      kind: "questions",
      min: 2,
      max: 4,
      titles: { tr: "Kendine sor", en: "Ask yourself", es: "Pregúntate" },
      instruction:
        "Open questions the player can ask THEMSELVES, derived from their own choices (especially the yellow cards and surprising contrasts such as a green and a red card in the same theme). They must not steer the answer or contain a verdict.",
    },
  ],

  isEligible: isCompleted,

  async loadInput(session, db) {
    const { data } = await db.from("solo_scenarios").select("id, scenario_text, insight_tag").in("id", session.scenario_ids);
    if (!data || data.length !== session.scenario_ids.length) return null;
    return { scenarios: data };
  },

  buildDigest(session, input) {
    if (!isCompleted(session)) return null;
    const saved = session.answers as Record<string, Flag>;
    const byId = new Map(input.scenarios.map((s) => [s.id, s]));
    const cards: RedFlagDigest["cards"] = [];
    for (const id of session.scenario_ids) {
      const s = byId.get(id);
      if (!s) return null;
      cards.push({ theme: THEME_LABEL[s.insight_tag] ?? s.insight_tag, scenario: s.scenario_text, flag: saved[id] });
    }
    const profile = computeProfile(cards.map((c) => c.flag));
    const themes = new Map<string, { theme: string; green: number; yellow: number; red: number }>();
    for (const c of cards) {
      const t = themes.get(c.theme) ?? { theme: c.theme, green: 0, yellow: 0, red: 0 };
      t[c.flag]++;
      themes.set(c.theme, t);
    }
    const locale = (["tr", "en", "es"] as const).includes(session.locale as Locale) ? (session.locale as Locale) : "tr";
    return {
      locale,
      context: getPack(session.pack_key)?.category === "romantic" ? "romantic" : "friends",
      counts: profile.counts,
      tolerance: profile.tolerance,
      profile: profileKindOf(profile.counts),
      cards,
      themes: [...themes.values()],
      mixedThemes: [...themes.values()].filter((t) => t.green > 0 && t.red > 0).map((t) => t.theme),
    };
  },

  payload(d) {
    return {
      context: d.context,
      counts: d.counts,
      tolerance: d.tolerance,
      profile: d.profile,
      cards: d.cards,
      themes: d.themes,
      ...(d.mixedThemes.length ? { mixedThemes: d.mixedThemes } : {}),
    };
  },

  promptNotes(d) {
    const context =
      d.context === "friends"
        ? "The card set is about FRIENDSHIPS (the scenarios talk about friends): no romantic wording at all."
        : "The card set is about ROMANTIC relationships (the scenarios talk about a partner).";
    return [
      "GAME: \"Red Flag Minefield\". The player saw 9 situations and marked each one as GREEN (fine with me), YELLOW (it depends) or RED (red flag). There is NO right answer: the result is only a tolerance profile built from these choices.",
      context,
      'The payload has "cards" (scenario text, theme, the player\'s flag), "counts", "tolerance" (0-100, for you only: never write it as a number) and "profile".',
      PROFILE_NOTES[d.profile],
      "SENSITIVE: some scenarios touch control, humiliation, pressure, harassment or violence. Never joke about them. If the player marked such a situation GREEN, you may add at most one gentle, non-judgmental line (in \"gray_areas\" or in a self-question) saying it can be worth a second look, perhaps with someone they trust. Never alarm, never judge, never diagnose.",
    ].join("\n");
  },

  quotable: (d) => d.cards.map((c) => c.scenario),

  normalize(out, d) {
    const next: ModelOutput = { ...out };
    if (d.counts.green === 0) next.green_zone = [];
    if (d.counts.red === 0) next.red_lines = [];
    if (d.counts.yellow === 0) next.gray_areas = [];
    return next;
  },
};
