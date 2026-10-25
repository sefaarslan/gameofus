// Solo analiz üretimi (oyundan bağımsız): adaptörden prompt/şema/ton al → modeli çağır → doğrula (+1 düzeltme) → zarfa çevir.
// Çekirdek oda yorumuyla ortaktır (structured.ts); yalnızca adaptörün sağladığı parçalar farklıdır.

import { commonTextIssues } from "../schema.ts";
import { generateStructured, parseJson } from "../structured.ts";
import type { GenerateOptions, GenerateResult, Validation } from "../structured.ts";
import type { Locale } from "../digest.ts";
import { allTexts, assembleEnvelope, fakeValidOutput, outputJsonSchema, outputSchema } from "./envelope.ts";
import { SOLO_PROMPT_VERSION, buildSoloMessages } from "./prompt.ts";
import type { ModelOutput, SoloAdapter, SoloEnvelope } from "./types.ts";

/** Başkalarıyla/ortalamayla kıyas (elimizde böyle veri yok) ve "sağlıklı/sağlıksız" etiketleri: SERT sorun, asla kabul edilmez. */
const COMPARISON = new RegExp(
  [
    "çoğu (?:insan|kişi)", "(?:diğer|başka) insanlar", "insanların çoğu", "birçok insan", "ortalama(?:nın|ya| insan)", "genellikle insanlar",
    "most people", "other people", "the average", "on average", "many people", "typical(?:ly)? (?:person|people)", "compared to others",
    "la mayor[íi]a de (?:las )?personas", "otras personas", "el promedio", "mucha gente", "la mayor[íi]a de la gente",
  ].join("|"),
  "iu",
);
const LABELS = /sağlıksız|anormal|normal değil|saf biri|aşırı katı|çok katı|paranoyak|unhealthy|abnormal|not normal|naive|too rigid|so rigid|paranoid|poco saludable|anormal|ingenu[oa]|demasiado r[íi]gid[oa]|paranoic[oa]/iu;
/** Yazıya sızmaması gereken sayı/ızgara: rakam ve bayrak emojileri (uygulama bunları kendisi çizer) */
const GRID_OR_NUMBER = /[\d🟢🟡🔴]/u;

/** "Yumuşak" sorun: düzeltme turundan sonra da sürerse içerik yine kabul edilir (üslup/biçim). Sert sorunlar asla. */
const SOFT = /^(Avoid empty filler|The quoted text|Put no numbers)/;
export const isSoloSoftIssue = (issue: string) => SOFT.test(issue);

/** Alıntı içindeki rakamlar serbest (senaryo metninde olabilir); alıntı DIŞINDAKİ rakam/emoji yasak. */
function numberIssue(texts: string[]): string | null {
  const outside = texts.map((t) => t.replace(/[“"«][^”"»\n]*[”"»]/gu, " "));
  return outside.some((t) => GRID_OR_NUMBER.test(t)) ? "Put no numbers, counts or emoji flags in the text; the app draws those. Use words for scale." : null;
}

export function validateSolo<D>(adapter: SoloAdapter<unknown, D>, digest: D, locale: Locale, text: string): Validation<ModelOutput> {
  let json: unknown;
  try {
    json = parseJson(text);
  } catch {
    return { ok: false, issues: ["The output is not valid JSON. Return ONLY one JSON object."] };
  }
  // Üst sınırı aşan listeler (ör. 9 sarı kart → 9 madde) düzeltme turu harcamadan ilk `max` elemana kırpılır (deterministik ve ucuz).
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    for (const sec of adapter.sections) {
      const v = obj[sec.id];
      if (sec.kind !== "text" && Array.isArray(v) && v.length > sec.max) obj[sec.id] = v.slice(0, sec.max);
    }
  }
  const parsed = outputSchema(adapter.sections).safeParse(json);
  if (!parsed.success) return { ok: false, issues: parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };

  const out = parsed.data as ModelOutput;
  const texts = allTexts(out, adapter.sections);
  const all = texts.join("\n");
  // Oda yorumundaki ortak kurallar (yüzde, JSON kırıntısı, dil sızıntısı, klişe, burç, birebir alıntı). "Gizli anlaşma" dili solo'da anlamsız.
  const issues = commonTextIssues(texts, locale, { quotable: adapter.quotable(digest), invented: false });
  if (COMPARISON.test(all)) issues.push("Never compare the player with other people or averages; you have no such data.");
  if (LABELS.test(all)) issues.push("Do not label choices or the player as healthy/unhealthy, normal/abnormal or naive; there are no right answers.");
  const num = numberIssue(texts);
  if (num) issues.push(num);
  return issues.length ? { ok: false, issues, content: out } : { ok: true, content: out };
}

export async function generateSoloAnalysis<D>(
  adapter: SoloAdapter<unknown, D>,
  digest: D,
  locale: Locale,
  options: GenerateOptions,
): Promise<GenerateResult<SoloEnvelope>> {
  const res = await generateStructured<ModelOutput>(
    {
      messages: buildSoloMessages(adapter, digest, locale),
      jsonSchema: outputJsonSchema(adapter.sections),
      validate: (text) => validateSolo(adapter, digest, locale, text),
      promptVersion: SOLO_PROMPT_VERSION,
      isSoft: isSoloSoftIssue,
      fakeValid: fakeValidOutput(adapter.sections),
    },
    options,
  );
  const out = adapter.normalize ? adapter.normalize(res.content, digest) : res.content;
  return { content: assembleEnvelope(adapter, locale, out), meta: res.meta };
}
