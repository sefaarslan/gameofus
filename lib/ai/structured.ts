// Oyundan/özellikten bağımsız "yapılandırılmış üretim" çekirdeği: modeli çağır → JSON'u ayrıştır → doğrula → gerekirse BİR kez düzelttir.
// Oda yorumu (generate.ts) ve solo analizi (solo/generate.ts) bu çekirdeği kullanır; yalnızca prompt, şema ve doğrulayıcı farklıdır.
//
// Sağlayıcı hataları (429, zaman aşımı, yetki…) burada YAKALANMAZ (yalnızca kısa 429 beklemesi hariç): üst katman (endpoint) bunlara göre
// yedek sağlayıcıya geçer ya da coin'i iade eder. Burada yalnızca "model cevap verdi ama kullanılamaz" durumu ele alınır.

import { AiProviderError, chat } from "./provider.ts";
import type { ChatMessage, ChatOptions, ChatResult, ProviderName } from "./provider.ts";

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

export interface GenerateMeta {
  provider: ProviderName;
  model: string;
  promptVersion: string;
  attempts: number;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface GenerateResult<T> {
  content: T;
  meta: GenerateMeta;
}

/** Model yanıt verdi ama (yeniden denemelerden sonra bile) kullanılabilir bir içerik çıkmadı. */
export class InvalidCommentaryError extends Error {
  issues: string[];
  constructor(issues: string[]) {
    super(`Geçersiz yorum: ${issues.join(" | ")}`);
    this.name = "InvalidCommentaryError";
    this.issues = issues;
  }
}

export type Validation<T> = { ok: true; content: T } | { ok: false; issues: string[]; content?: T };

export interface StructuredSpec<T> {
  messages: ChatMessage[];
  /** Sağlayıcıya verilen JSON şeması (strict modda çıktıyı bu yapıya zorlar) */
  jsonSchema: { name: string; schema: unknown };
  /** Ham metni doğrular: şema + kalite kuralları. `content` yalnızca "yumuşak" sorunlarda (kabul edilebilir) dolu olmalı. */
  validate: (text: string) => Validation<T>;
  promptVersion: string;
  /** Yumuşak sorun: düzeltme turundan sonra da sürerse içerik yine kabul edilir (üslup/biçim kuralları) */
  isSoft: (issue: string) => boolean;
  /** Yalnızca test sağlayıcısı: bu özelliğin GEÇERLİ örnek çıktısı (gerçek sağlayıcılar yok sayar) */
  fakeValid?: unknown;
}

/**
 * Hız sınırında (429) sağlayıcının önerdiği bekleme bu süreden kısaysa (en fazla iki kez, toplam bekleme bütçesi içinde) bekleyip aynı modeli yeniden dener.
 * Süre bütçesi (fonksiyon sınırı 60 sn): 429 (~0.3 sn) + bekleme (≤ 25 sn) + ikinci deneme (≤ 12 sn) + olası yedek model (≤ 15 sn) < 60 sn.
 */
const MAX_RATE_LIMIT_WAIT_MS = 25_000;
const RETRY_TIMEOUT_MS = 12_000;

/**
 * Ücretsiz katmanda dakikalık token sınırı dar: iki istek aynı dakikaya denk gelirse ikincisi 429 alır ve genelde ~10 sn sonra
 * geçer. Kullanıcıyı hataya düşürmek (ve coin iadesi yapmak) yerine kısa bir kez bekleyip yeniden deneriz. Uzun beklemeler
 * (> 25 sn) denenmez: üst katman yedek modele geçer ya da iade eder.
 */
export async function chatWithBackoff(options: ChatOptions): Promise<ChatResult> {
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

/** Modelin metin çıktısını JSON'a çevirir; ```json çitlerini ve etrafındaki gevezeliği tolere eder. */
export function parseJson(text: string): unknown {
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

export async function generateStructured<T>(spec: StructuredSpec<T>, options: GenerateOptions): Promise<GenerateResult<T>> {
  const maxRepairs = options.maxRepairs ?? 1;
  const messages: ChatMessage[] = [...spec.messages];
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
      ...(spec.fakeValid !== undefined ? { fakeValid: spec.fakeValid } : {}),
      ...(options.strictSchema ? { jsonSchema: spec.jsonSchema } : { jsonObject: true }),
    });
    totals.latencyMs += res.latencyMs;
    totals.promptTokens += res.usage.promptTokens;
    totals.completionTokens += res.usage.completionTokens;
    totals.totalTokens += res.usage.totalTokens;

    const meta = (): GenerateMeta => ({ provider: options.provider, model: res.model, promptVersion: spec.promptVersion, attempts: attempt, ...totals });

    // Çıktı yarıda kesildiyse (token sınırı) JSON bozuk olur; doğrulama bunu zaten yakalar.
    const checked = spec.validate(res.text);
    if (checked.ok) return { content: checked.content, meta: meta() };
    lastIssues = checked.issues;
    // Son denemede yalnızca "yumuşak" üslup sorunları kaldıysa içerik kabul edilir (sert sorunlarda asla)
    if (attempt === maxRepairs + 1 && checked.content && checked.issues.every(spec.isSoft)) return { content: checked.content, meta: meta() };
    // Düzeltme turu: modele kendi çıktısını ve neyin yanlış olduğunu göster, yalnızca düzeltilmiş JSON iste.
    messages.push(
      { role: "assistant", content: res.text },
      { role: "user", content: `Your previous answer was invalid:\n- ${checked.issues.join("\n- ")}\nReturn ONLY the corrected JSON object.` },
    );
  }
  throw new InvalidCommentaryError(lastIssues);
}
