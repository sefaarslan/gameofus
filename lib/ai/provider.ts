// Sağlayıcıdan bağımsız LLM çağrısı.
//
// Groq ve OpenRouter aynı "OpenAI uyumlu" sohbet API'sini (POST /chat/completions) konuşur;
// yalnızca adres, anahtar ve model adı değişir. Yeni bir sağlayıcı eklemek = PROVIDERS'a bir satır.
// (Node'un tür soyma özelliği ile doğrudan çalışsın diye göreli içe aktarma + .ts uzantısı kullanılır.)

import { fakeChat } from "./fake-provider.ts";

export type ProviderName = "groq" | "openrouter" | "fake";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  provider: ProviderName;
  model: string;
  messages: ChatMessage[];
  /** Üretilecek en fazla token (düşünme token'ları dahil). Kesilirse finishReason "length" olur. */
  maxTokens?: number;
  temperature?: number;
  /** Yalnızca akıl yürütme modelleri (ör. gpt-oss) için; düşük = daha az düşünme token'ı = daha ucuz/hızlı. */
  reasoningEffort?: "low" | "medium" | "high";
  /** Yanıtın geçerli bir JSON nesnesi olmasını iste (şema garantisi değil; şema doğrulaması ayrıca yapılır). */
  jsonObject?: boolean;
  /** Yanıtı bu JSON şemasına uydurmaya zorla (strict; destekleyen modellerde). Doğrulama yine ayrıca yapılmalıdır. */
  jsonSchema?: { name: string; schema: unknown };
  timeoutMs?: number;
  /**
   * Yalnızca OpenRouter: sağlayıcının istemi kaydedip eğitimde kullanmasına izin ver.
   * VARSAYILAN "deny". Sadece uydurma verilerle denerken (ör. ücretsiz `:free` modeller) "allow" yapılır.
   */
  dataCollection?: "allow" | "deny";
}

export interface ChatResult {
  text: string;
  model: string;
  finishReason: string | null;
  latencyMs: number;
  usage: {
    promptTokens: number;
    completionTokens: number;
    reasoningTokens: number;
    totalTokens: number;
  };
  /** Sağlayıcının yanıt başlıklarından kalan kapasite (varsa; Groq verir). */
  rateLimit: {
    remainingRequests?: number;
    remainingTokens?: number;
    resetTokensInMs?: number;
  };
}

export type AiErrorKind = "rate_limited" | "timeout" | "auth" | "bad_response" | "upstream" | "not_configured";

export class AiProviderError extends Error {
  kind: AiErrorKind;
  status?: number;
  retryAfterMs?: number;
  constructor(kind: AiErrorKind, message: string, extra: { status?: number; retryAfterMs?: number } = {}) {
    super(message);
    this.name = "AiProviderError";
    this.kind = kind;
    this.status = extra.status;
    this.retryAfterMs = extra.retryAfterMs;
  }
}

const PROVIDERS: Record<Exclude<ProviderName, "fake">, { baseUrl: string; keyEnv: string }> = {
  groq: { baseUrl: "https://api.groq.com/openai/v1", keyEnv: "GROQ_API_KEY" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", keyEnv: "OPENROUTER_API_KEY" },
};

/** "1m26.4s", "2.114s", "350ms" biçimli süreyi milisaniyeye çevirir. */
function parseDurationMs(value: string | null): number | undefined {
  if (!value) return undefined;
  let total = 0;
  let matched = false;
  for (const m of value.matchAll(/(\d+(?:\.\d+)?)(ms|h|m|s)/g)) {
    matched = true;
    const n = parseFloat(m[1]);
    total += m[2] === "ms" ? n : m[2] === "s" ? n * 1000 : m[2] === "m" ? n * 60_000 : n * 3_600_000;
  }
  return matched ? Math.round(total) : undefined;
}

function toNumber(value: string | null): number | undefined {
  if (value === null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function chat(options: ChatOptions): Promise<ChatResult> {
  // Test sağlayıcısı: ağa çıkmaz; üretimde (NODE_ENV=production) kapalıdır (bkz. fake-provider.ts).
  if (options.provider === "fake") return fakeChat(options);
  const cfg = PROVIDERS[options.provider];
  const apiKey = process.env[cfg.keyEnv];
  if (!apiKey) throw new AiProviderError("not_configured", `${cfg.keyEnv} tanımlı değil.`);

  const body: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
    max_completion_tokens: options.maxTokens ?? 1500,
  };
  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (options.jsonSchema) {
    body.response_format = { type: "json_schema", json_schema: { name: options.jsonSchema.name, strict: true, schema: options.jsonSchema.schema } };
  } else if (options.jsonObject) {
    body.response_format = { type: "json_object" };
  }
  if (options.reasoningEffort) {
    // Groq: reasoning_effort, OpenRouter: reasoning.effort
    if (options.provider === "groq") body.reasoning_effort = options.reasoningEffort;
    else body.reasoning = { effort: options.reasoningEffort };
  }
  if (options.provider === "openrouter") {
    body.provider = { data_collection: options.dataCollection ?? "deny" };
  }

  const started = Date.now();
  let res: Response;
  try {
    res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeoutMs ?? 20_000),
    });
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === "TimeoutError" || name === "AbortError") {
      throw new AiProviderError("timeout", "Sağlayıcı zaman aşımına uğradı.");
    }
    throw new AiProviderError("upstream", "Sağlayıcıya ulaşılamadı.");
  }
  const latencyMs = Date.now() - started;

  if (!res.ok) {
    // Hata gövdesi kullanıcı verisi içermez ama yine de loglamak için kısaltıp mesaja koyuyoruz.
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    const retryAfterHeader = res.headers.get("retry-after");
    const retryAfterMs = retryAfterHeader ? Math.round(parseFloat(retryAfterHeader) * 1000) : undefined;
    if (res.status === 429) {
      throw new AiProviderError("rate_limited", `Hız sınırı (429): ${detail}`, { status: 429, retryAfterMs });
    }
    if (res.status === 401 || res.status === 403) {
      throw new AiProviderError("auth", `Yetkilendirme hatası (${res.status}): ${detail}`, { status: res.status });
    }
    throw new AiProviderError("upstream", `Sağlayıcı hatası (${res.status}): ${detail}`, { status: res.status });
  }

  let data: {
    model?: string;
    choices?: Array<{ message?: { content?: string | null }; finish_reason?: string | null }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
      completion_tokens_details?: { reasoning_tokens?: number };
    };
  };
  try {
    data = await res.json();
  } catch {
    throw new AiProviderError("bad_response", "Sağlayıcı geçersiz JSON döndürdü.");
  }

  const choice = data.choices?.[0];
  const text = choice?.message?.content;
  if (typeof text !== "string" || text.length === 0) {
    throw new AiProviderError("bad_response", "Sağlayıcı boş yanıt döndürdü.");
  }

  return {
    text,
    model: data.model ?? options.model,
    finishReason: choice?.finish_reason ?? null,
    latencyMs,
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      reasoningTokens: data.usage?.completion_tokens_details?.reasoning_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    },
    rateLimit: {
      remainingRequests: toNumber(res.headers.get("x-ratelimit-remaining-requests")),
      remainingTokens: toNumber(res.headers.get("x-ratelimit-remaining-tokens")),
      resetTokensInMs: parseDurationMs(res.headers.get("x-ratelimit-reset-tokens")),
    },
  };
}
