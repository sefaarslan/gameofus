// Oda yorumu üretimi: prompt kur → modeli çağır → JSON'u ayrıştır → şema + kalite kurallarıyla doğrula → gerekirse BİR kez düzelttir.
// Çekirdek (structured.ts) solo analizle paylaşılır; burada yalnızca odaya özel prompt/şema/doğrulama bağlanır.

import { buildMessages, PROMPT_VERSION } from "./prompt.ts";
import type { CommentaryDigest } from "./digest.ts";
import { COMMENTARY_JSON_SCHEMA, commentarySchema, isSoftIssue, qualityIssues } from "./schema.ts";
import type { Commentary } from "./schema.ts";
import { InvalidCommentaryError, generateStructured, parseJson } from "./structured.ts";
import type { GenerateOptions, GenerateResult as StructuredResult, Validation } from "./structured.ts";

export { InvalidCommentaryError };
export type { GenerateOptions };
export type GenerateResult = StructuredResult<Commentary>;

function validate(text: string, digest: CommentaryDigest): Validation<Commentary> {
  let json: unknown;
  try {
    json = parseJson(text);
  } catch {
    return { ok: false, issues: ["The output is not valid JSON. Return ONLY one JSON object."] };
  }
  const parsed = commentarySchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, issues: parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
  }
  const issues = qualityIssues(parsed.data, [...digest.players], digest.locale, { band: digest.summary.scoreBand, quotable: digest.quotable });
  return issues.length ? { ok: false, issues, content: parsed.data } : { ok: true, content: parsed.data };
}

export async function generateCommentary(digest: CommentaryDigest, options: GenerateOptions): Promise<GenerateResult> {
  return generateStructured<Commentary>(
    {
      messages: buildMessages(digest),
      jsonSchema: COMMENTARY_JSON_SCHEMA,
      validate: (text) => validate(text, digest),
      promptVersion: PROMPT_VERSION,
      isSoft: isSoftIssue,
    },
    options,
  );
}
