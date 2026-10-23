// AI yorum çıktısının şeması ve doğrulaması.
//
// İki katman var ve ikisi de gerekli:
//  1) Sağlayıcıya verdiğimiz JSON şeması (COMMENTARY_JSON_SCHEMA): destekleyen modellerde (ör. Groq gpt-oss, strict mod)
//     çıktı bu yapıya uymaya ZORLANIR. Dizi uzunluğu gibi kısıtlar bu katmanda garanti değildir.
//  2) Zod doğrulaması (commentarySchema + qualityIssues): model/sağlayıcı ne derse desin, kabul etmeden önce SİZİN
//     kurallarınız denetlenir. Model değiştirilince bile çıktı sözleşmesi bozulmaz.

import { z } from "zod";
import type { ScoreBand } from "./digest.ts";

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

/**
 * Uydurma "gizli anlaşma / ortak strateji" dili: iki oyuncu aynı cevabı verdi diye bilinçli bir uyum, plan ya da strateji iddia edilemez
 * (gerçek bir odada "ortak gizli anlaşma" çıktı). Yumuşak sorun: bir düzeltme turu sonra yine de kalırsa içerik kabul edilir.
 */
const INVENTED = /gizli (?:anlaşma|ortaklık|strateji|ekip|işbirliği)|ortak strateji|ortak oyun planı|shared strategy|secret(?:ly)? (?:pact|deal|agreement|strategy|team|alliance)|hidden (?:pact|agreement|alliance)|(?:perfect|total|complete) sync|same playbook|estrategia (?:compartida|secreta)|pacto secreto|acuerdo secreto|sincron[íi]a perfecta|equipo secreto/iu;

/** İlişki hükmü ve teşhis/terapi dili: ürün ilkesi gereği yorumda yok (tr/en/es). */
const VERDICTS = /uyumsuz|toksik|ayrılık|terapi|terapist|psikolog|incompatib|toxic|breakup|break up|therap|incompatible|tóxic[oa]|incompatib|terapia|psicólog/iu;

/**
 * Düşük skor bandında başlık/özette YASAK dil: "aynı dalgada", "tam uyum", "birkaç komik yanılgı" (gerçek bir odada skor 45 iken çıktı bunu
 * söylüyordu). Prompt kuralı tek başına yetmediği için kodda da reddedilir.
 */
const LOW_BAND_BANNED = new RegExp(
  [
    "aynı dalga", "tam uyum", "mükemmel uyum", "senkron", "bir kitap gibi", "avucunuzun içi", "birbirinizi (?:çok )?iyi (?:okuyor|tanıyor)",
    "birkaç\\s+(?:komik\\s+)?(?:yanılgı|yanlış|ters köşe)",
    "same wavelength", "in sync", "perfect(?:ly)? (?:harmony|match|sync)", "know each other (?:inside out|perfectly|so well)", "a few (?:funny )?(?:mix-?ups|misses|slips)",
    "misma onda", "sincroniz", "armon[íi]a perfecta", "se conocen (?:perfectamente|a la perfecci[oó]n|muy bien)", "(?:unos|algunos) (?:pocos )?(?:errores|fallos|desaciertos)(?: graciosos)?",
  ].join("|"),
  "iu",
);

/** Tırnak içindeki metni karşılaştırmak için sadeleştirir: küçük harf, noktalama ve fazla boşluk yok. */
const normalizeQuote = (t: string) => t.toLowerCase().replace(/[.,;:!?…"“”«»'’‘`]/g, "").replace(/\s+/g, " ").trim();

/** Çıktıdaki çift tırnaklı parçalar. */
function quotedSegments(text: string): string[] {
  return [...text.matchAll(/[“"«]([^”"»\n]{4,160})[”"»]/gu)].map((m) => m[1]);
}

/**
 * "Yumuşak" sorunlar: üslup/biçim kuralları (klişe, bozuk alıntı, hitap, İngilizce ödül başlığı). Düzeltme turundan sonra HÂLÂ yalnızca bunlar
 * kalıyorsa yorum reddedilmez (kullanıcı parasını iade edip yorumsuz bırakmak, "ortak zemin" gibi bir kalıp yüzünden fazla pahalı);
 * "sert" sorunlar (yüzde, burç, hüküm, düşük skor dili, dil sızıntısı, JSON kırıntısı) her zaman reddedilir.
 */
export function isSoftIssue(issue: string): boolean {
  return /^(Avoid empty filler|Avoid invented secrets|The quoted text|Never refer to the pair|Award titles must be)/.test(issue);
}

export interface QualityContext {
  /** Skor bandı: "low" ise "aynı dalgada/tam uyum" dili reddedilir */
  band?: ScoreBand;
  /** Tırnak içinde alıntılanabilecek metinler (oyuncuların cevap/seçenek metinleri); uzun alıntılar bunlardan birinde AYNEN geçmeli */
  quotable?: string[];
}

/** Şemanın yakalayamadığı içerik kuralları (yüzde yok, soru numarası yok, tag/JSON sızıntısı yok, burç/astroloji yok, alıntı/hitap/ton). */
export function qualityIssues(
  c: Commentary,
  playerNames: string[] = [],
  locale: "tr" | "en" | "es" = "en",
  ctx: QualityContext = {},
): string[] {
  const texts = [c.headline, c.summary, ...c.strengths, ...c.blindSpots, ...c.conversationStarters, ...c.awards.flatMap((a) => [a.title, a.text])];
  const original = texts.join("\n");
  let all = original;
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
  if (VERDICTS.test(all)) issues.push("Do not give verdicts about the relationship or use diagnosis/therapy language.");
  if (INVENTED.test(all)) issues.push("Avoid invented secrets: never present a shared answer as a secret pact, a shared strategy or perfect sync; they did not know it.");
  if (CLICHES.test(all)) issues.push("Avoid empty filler phrases such as 'common ground' or 'strengthens your bond'; use concrete details instead.");
  if (ASTROLOGY.test(all)) issues.push("Do not mention zodiac, signs, horoscopes or astrology in any way.");

  // Ödül başlıkları oda dilinde olmalı: "awardBases" İngilizce notlardır; model etiketi ("Plot-twist Award") kopyalamasın.
  if (locale !== "en" && c.awards.some((x) => /\b(?:award|plot.?twist|more.?alike|pattern|sharp.?eyed|boldest|finishers?)\b/i.test(x.title))) {
    issues.push(`Award titles must be written in ${locale === "tr" ? "Turkish" : "Spanish"}; do not copy the English award notes.`);
  }

  // Hitap tutarlılığı: çift üçüncü kişi olarak anılmaz ("Deniz ve Elif ..."); çift her zaman "siz"dir.
  if (playerNames.length === 2 && playerNames[0].trim() && playerNames[1].trim()) {
    const esc = (t: string) => t.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const [a, b] = [esc(playerNames[0]), esc(playerNames[1])];
    if (new RegExp(`${a}\\s*(?:ve|ile|and|y|e|&)\\s+${b}|${b}\\s*(?:ve|ile|and|y|e|&)\\s+${a}`, "u").test(original)) {
      issues.push(`Never refer to the pair in the third person ("${playerNames[0]} and ${playerNames[1]}"); address them as "you". Use a name only as the subject when contrasting what each one answered.`);
    }
  }

  // Düşük skor bandı: başlık ve özette "aynı dalgada / tam uyum / birkaç komik yanılgı" yok.
  if (ctx.band === "low" && LOW_BAND_BANNED.test(`${c.headline}\n${c.summary}`)) {
    issues.push("The score band is LOW: the headline and summary must not say or imply 'same wavelength', 'in sync' or 'perfect harmony', and must not shrink the many misses to 'a few funny mix-ups'. Be honest and warm: they have a lot to discover about each other.");
  }

  // Alıntı denetimi: tırnak içindeki uzun parçalar bir seçenek/cevap metninde AYNEN geçmeli (ör. "biliyordum" yerine "biliyorum" yazılmamalı).
  if (ctx.quotable && ctx.quotable.length > 0) {
    const allowed = ctx.quotable.map(normalizeQuote);
    for (const seg of texts.flatMap(quotedSegments)) {
      const n = normalizeQuote(seg);
      if (n.length >= 14 && n.split(" ").length >= 3 && !allowed.some((q) => q.includes(n))) {
        issues.push(`The quoted text "${seg}" is not an exact option text. Copy option texts exactly as written, or paraphrase WITHOUT quotation marks.`);
        break;
      }
    }
  }
  return issues;
}
