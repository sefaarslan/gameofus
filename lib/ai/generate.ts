// Yorum üretimi: prompt kur → modeli çağır → JSON'u ayrıştır → şema + kalite kurallarıyla doğrula → gerekirse BİR kez düzelttir.
//
// Sağlayıcı hataları (429, zaman aşımı, yetki…) burada YAKALANMAZ: üst katman (endpoint) bunlara göre yedek sağlayıcıya
// geçer ya da coin'i iade eder. Burada yalnızca "model cevap verdi ama kullanılamaz" durumu ele alınır.

import { chat } from "./provider.ts";
import type { ChatMessage, ChatOptions, ChatResult, ProviderName } from "./provider.ts";
import { buildMessages, PROMPT_VERSION } from "./prompt.ts";
import type { CommentaryDigest } from "./digest.ts";
import { COMMENTARY_JSON_SCHEMA, commentarySchema, qualityIssues } from "./schema.ts";
import type { Commentary } from "./schema.ts";

export interface GenerateOptions {
  provider: ProviderName;
  model: string;
  reasoningEffort?: ChatOptions["reasoningEffort"];
  maxTokens?: number;
  timeoutMs?: number;
  dataCollection?: ChatOptions["dataCollection"];
  /** Şemaya zorlama (strict) destekleyen modeller için; desteklemeyenlerde false bırak, doğrulama yine çalışır. */
  strictSchema?: boolean;
  /** Geçersiz çıktıda kaç kez yeniden denensin (varsayılan 1) */
  maxRepairs?: number;
}

export interface GenerateResult {
  content: Commentary;
  meta: {
    provider: ProviderName;
    model: string;
    promptVersion: string;
    attempts: number;
    latencyMs: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** Model yanıt verdi ama (yeniden denemelerden sonra bile) kullanılabilir bir yorum çıkmadı. */
export class InvalidCommentaryError extends Error {
  issues: string[];
  constructor(issues: string[]) {
    super(`Geçersiz yorum: ${issues.join(" | ")}`);
    this.name = "InvalidCommentaryError";
    this.issues = issues;
  }
}

/** Modelin metin çıktısını JSON'a çevirir; ```json çitlerini ve etrafındaki gevezeliği tolere eder. */
function parseJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error("Çıktı JSON değil.");
  }
}

function validate(text: string, playerNames: string[], locale: "tr" | "en" | "es"): { ok: true; content: Commentary } | { ok: false; issues: string[] } {
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
  const issues = qualityIssues(parsed.data, playerNames, locale);
  return issues.length ? { ok: false, issues } : { ok: true, content: parsed.data };
}

export async function generateCommentary(digest: CommentaryDigest, options: GenerateOptions): Promise<GenerateResult> {
  const maxRepairs = options.maxRepairs ?? 1;
  const messages: ChatMessage[] = buildMessages(digest);
  const totals = { latencyMs: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  let lastIssues: string[] = [];

  for (let attempt = 1; attempt <= maxRepairs + 1; attempt++) {
    const res: ChatResult = await chat({
      provider: options.provider,
      model: options.model,
      messages,
      maxTokens: options.maxTokens ?? 2600,
      temperature: 0.8,
      reasoningEffort: options.reasoningEffort,
      timeoutMs: options.timeoutMs ?? 20_000,
      dataCollection: options.dataCollection,
      ...(options.strictSchema ? { jsonSchema: COMMENTARY_JSON_SCHEMA } : { jsonObject: true }),
    });
    totals.latencyMs += res.latencyMs;
    totals.promptTokens += res.usage.promptTokens;
    totals.completionTokens += res.usage.completionTokens;
    totals.totalTokens += res.usage.totalTokens;

    // Çıktı yarıda kesildiyse (token sınırı) JSON bozuk olur; doğrulama bunu zaten yakalar.
    const checked = validate(res.text, digest.players, digest.locale);
    if (checked.ok) {
      return {
        content: checked.content,
        meta: {
          provider: options.provider,
          model: res.model,
          promptVersion: PROMPT_VERSION,
          attempts: attempt,
          ...totals,
        },
      };
    }
    lastIssues = checked.issues;
    // Düzeltme turu: modele kendi çıktısını ve neyin yanlış olduğunu göster, yalnızca düzeltilmiş JSON iste.
    messages.push(
      { role: "assistant", content: res.text },
      { role: "user", content: `Your previous answer was invalid:\n- ${checked.issues.join("\n- ")}\nReturn ONLY the corrected JSON object.` },
    );
  }
  throw new InvalidCommentaryError(lastIssues);
}
