// AI yorum çıktısının şeması ve doğrulaması.
//
// İki katman var ve ikisi de gerekli:
//  1) Sağlayıcıya verdiğimiz JSON şeması (COMMENTARY_JSON_SCHEMA): destekleyen modellerde (ör. Groq gpt-oss, strict mod)
//     çıktı bu yapıya uymaya ZORLANIR. Dizi uzunluğu gibi kısıtlar bu katmanda garanti değildir.
//  2) Zod doğrulaması (commentarySchema + qualityIssues): model/sağlayıcı ne derse desin, kabul etmeden önce SİZİN
//     kurallarınız denetlenir. Model değiştirilince bile çıktı sözleşmesi bozulmaz.

import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);

export const commentarySchema = z
  .object({
    headline: text(180),
    summary: text(1400),
    strengths: z.array(text(420)).length(3),
    blindSpots: z.array(text(460)).min(2).max(3),
    conversationStarters: z.array(text(300)).length(3),
    /** Eğlenceli "ödül" kartları (v2.0'da eklendi; eski kayıtlarda yoktur, istemci alanın eksikliğini tolere etmeli) */
    awards: z.array(z.object({ title: text(60), text: text(300) }).strict()).min(3).max(4),
  })
  .strict();

export type Commentary = z.infer<typeof commentarySchema>;

/** Sağlayıcıya verilen şema (strict mod: tüm alanlar zorunlu, ek alan yok). Uzunluk kısıtları Zod'dadır. */
export const COMMENTARY_JSON_SCHEMA = {
  name: "relationship_commentary",
  schema: {
    type: "object",
    properties: {
      headline: { type: "string" },
      summary: { type: "string" },
      strengths: { type: "array", items: { type: "string" } },
      blindSpots: { type: "array", items: { type: "string" } },
      conversationStarters: { type: "array", items: { type: "string" } },
      awards: {
        type: "array",
        items: {
          type: "object",
          properties: { title: { type: "string" }, text: { type: "string" } },
          required: ["title", "text"],
          additionalProperties: false,
        },
      },
    },
    required: ["headline", "summary", "strengths", "blindSpots", "conversationStarters", "awards"],
    additionalProperties: false,
  },
} as const;

/**
 * Burç/astroloji sözcükleri: modele burç sessiz arka plan olarak verilir ve yorumda ASLA anılmaz (ürün kararı). Bu desen modelin
 * kurala uymadığı durumu yakalar (çıktı reddedilir → bir kez düzeltme turu). Burç adları İngilizce/İspanyolca'da ayırt edici olduğu için
 * listede; Türkçedeki adlar ("Aslan", "Başak"…) sıradan sözcük/özel ad olduğundan yalnızca "burç" sözcüğü üzerinden yakalanır.
 */
const ASTROLOGY = new RegExp(
  [
    "bur[çc]\\p{L}*", "astrolo\\p{L}*", "horoskop\\p{L}*", "yıldız\\s+falı", "zodyak\\p{L}*",
    "zodiac\\p{L}*", "horoscop\\p{L}*", "astrolog\\p{L}*", "star\\s+sign", "birth\\s+chart",
    "hor[óo]scopo\\p{L}*", "zod[ií]aco", "astrolog[íi]\\p{L}*", "signo\\s+zodiacal",
    "\\b(?:Aries|Taurus|Gemini|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces|Tauro|G[ée]minis|Escorpio|Sagitario|Capricornio|Acuario|Piscis)\\b",
  ].join("|"),
  "iu",
);

/** Boş "ahlak dersi" kalıpları: yorumun genel ve politik kalmasının tipik işaretleri (tr/en/es). */
const CLICHES = /ortak zemin|iletişim(?:iniz)?i güçlendir|bağınızı güçlendir|common ground|strengthens? your bond|communication is key|terreno común|fortalece(?:n)? (?:su|el) v[ií]nculo/iu;

/** Şemanın yakalayamadığı içerik kuralları (yüzde yok, soru numarası yok, tag/JSON sızıntısı yok, burç/astroloji yok). */
export function qualityIssues(c: Commentary, playerNames: string[] = [], locale: "tr" | "en" | "es" = "en"): string[] {
  let all = [c.headline, c.summary, ...c.strengths, ...c.blindSpots, ...c.conversationStarters, ...c.awards.flatMap((a) => [a.title, a.text])].join("\n");
  // Oyuncu adları kullanıcı metnidir ve kurallarla çakışabilir (ör. "Burcu" adı "burç" desenine uyar): denetimden önce çıkarılır.
  for (const name of playerNames) {
    const n = name.trim();
    if (n) all = all.replace(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gu"), " ");
  }
  const issues: string[] = [];
  if (/\d+\s?%|%\s?\d+/.test(all)) issues.push("Do not use percentages.");
  if (/(question|fact|soru|pregunta|hecho|olgu)\s*#?\d+/i.test(all)) issues.push("Do not mention question or fact numbers.");
  if (/[{}]|"\s*:\s*"/.test(all)) issues.push("Do not output JSON-like fragments inside the text.");
  // Dil sızıntısı: olgu cümleleri İngilizce gelir; model bunları çevirmeden kopyalarsa (tr/es çıktıda İngilizce işlev sözcükleri) reddedilir.
  if (locale !== "en" && (all.match(/\b(?:was|were|would|actually|answered|that|the|and|but|both|very|fairly|sure)\b/gi) ?? []).length >= 4) {
    issues.push(`The text must be written ONLY in ${locale === "tr" ? "Turkish" : "Spanish"}; do not copy the English fact sentences.`);
  }
  if (CLICHES.test(all)) issues.push("Avoid empty filler phrases such as 'common ground' or 'strengthens your bond'; use concrete details instead.");
  if (ASTROLOGY.test(all)) issues.push("Do not mention zodiac, signs, horoscopes or astrology in any way.");
  return issues;
}
