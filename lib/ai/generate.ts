// Yorum üretimi: prompt kur → modeli çağır → JSON'u ayrıştır → şema + kalite kurallarıyla doğrula → gerekirse BİR kez düzelttir.
//
// Sağlayıcı hataları (429, zaman aşımı, yetki…) burada YAKALANMAZ: üst katman (endpoint) bunlara göre yedek sağlayıcıya
// geçer ya da coin'i iade eder. Burada yalnızca "model cevap verdi ama kullanılamaz" durumu ele alınır.

import { AiProviderError, chat } from "./provider.ts";
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

/**
 * Hız sınırında (429) sağlayıcının önerdiği bekleme bu süreden kısaysa (en fazla iki kez, toplam bekleme bütçesi içinde) bekleyip aynı modeli yeniden dener.
 * Süre bütçesi (fonksiyon sınırı 60 sn): 429 (~0.3 sn) + bekleme (≤ 25 sn) + ikinci deneme (≤ 12 sn) + olası yedek model (≤ 15 sn) < 60 sn.
 */
const MAX_RATE_LIMIT_WAIT_MS = 25_000;
const RETRY_TIMEOUT_MS = 12_000;

/**
 * Ücretsiz katmanda dakikalık token sınırı dar: iki yorum aynı dakikaya denk gelirse ikincisi 429 alır ve genelde ~10 sn sonra
 * geçer. Kullanıcıyı hataya düşürmek (ve coin iadesi yapmak) yerine kısa bir kez bekleyip yeniden deneriz. Uzun beklemeler
 * (> 25 sn) denenmez: üst katman yedek modele geçer ya da iade eder.
 */
async function chatWithBackoff(options: ChatOptions): Promise<ChatResult> {
  let waited = 0;
  for (let call = 0; ; call++) {
    try {
      // İlk çağrı normal zaman aşımıyla; bekleme sonrası denemeler kısaltılmış zaman aşımıyla (toplam süre bütçesi için)
      return await chat(call === 0 ? options : { ...options, timeoutMs: Math.min(options.timeoutMs ?? RETRY_TIMEOUT_MS, RETRY_TIMEOUT_MS) });
    } catch (err) {
      const wait = err instanceof AiProviderError && err.kind === "rate_limited" ? err.retryAfterMs : undefined;
      // En fazla iki bekleme, toplam bekleme bütçesi aşılırsa hata üst katmana (yedek model / iade) bırakılır
      if (wait === undefined || call >= 2 || waited + wait + 250 > MAX_RATE_LIMIT_WAIT_MS) throw err;
      waited += wait + 250;
      await new Promise((resolve) => setTimeout(resolve, wait + 250));
    }
  }
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
    const res: ChatResult = await chatWithBackoff({
      provider: options.provider,
      model: options.model,
      messages,
      maxTokens: options.maxTokens ?? 2000, // Groq dakikalık limitte girdi + bu değeri "istenen" sayar: gereğinden yüksek tutma
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
