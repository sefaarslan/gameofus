// Sorulardaki gizli `insight_tag` → tema ve hassasiyet. Tema, yorumun tek tek cevaplar yerine ÖRÜNTÜ yakalamasını sağlar
// ("para konusunda hep aynısınız"); hassas etiketler için ton kuralı daha yumuşaktır (şaka/takılma yok, "uyumsuzluk" çerçevesi yok).
// Etiket → kategori eşlemesi seeds/v2'den üretilir (scripts/build-ai-tag-map.mjs → tag-themes.ts).

import { TAG_THEME } from "./tag-themes.ts";

/** Modele giden tema adları (İngilizce, talimat dili). */
export const THEME_LABEL: Record<string, string> = {
  communication: "communication and conflict style",
  first_date: "first-date habits",
  friend_test: "friendship style",
  future: "future plans and dreams",
  home_money: "home life and money",
  lifestyle: "daily rhythm and habits",
  romance: "romance and affection",
  social_life: "social life",
  values: "values and principles",
  wild_scenarios: "imagination and what-if scenarios",
  bold: "trust and intimacy",
};

/** Kategori bağımsız hassas etiketler (çatışma, para gerilimi, kıskançlık, güven, yakınlık, incinme). "bold" kategorisinin tamamı hassastır. */
const SENSITIVE_TAGS = new Set([
  "conflict_cooling", "conflict_style", "conflict_steps", "hurt_response", "harsh_words_reaction", "dissent_style",
  "carrying_hurt", "forgot_special_day", "making_up", "physical_closeness", "trust_in_love", "fear_of_losing",
  "money_disagreement", "budget_tension", "lending_money", "unexpected_expense", "budget_cuts", "spending_transparency",
  "intolerable_behaviors", "deal_breakers_bold", "taking_sides", "white_lies", "moral_dilemma", "holding_in",
]);

export function themeSlugOf(tag: string): string {
  return TAG_THEME[tag] ?? "general";
}

export function themeOf(tag: string): string {
  return THEME_LABEL[themeSlugOf(tag)] ?? "general topics";
}

export function isSensitiveTag(tag: string): boolean {
  return themeSlugOf(tag) === "bold" || SENSITIVE_TAGS.has(tag);
}
