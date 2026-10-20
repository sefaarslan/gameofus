// Hangi sağlayıcı/model kullanılır? Kodda değil ortam değişkeninde:
//   AI_PRIMARY=groq:openai/gpt-oss-120b            (varsayılan)
//   AI_FALLBACK=openrouter:google/gemini-2.5-flash-lite   (isteğe bağlı yedek; yoksa yedek yok)
// Biçim: "<sağlayıcı>:<model>". Model değiştirmek = bu iki değişkeni güncellemek (yeniden dağıtım gerekir).

import type { ChatOptions, ProviderName } from "./provider.ts";

export interface ModelSpec {
  provider: ProviderName;
  model: string;
  reasoningEffort?: ChatOptions["reasoningEffort"];
  strictSchema: boolean;
  dataCollection: "allow" | "deny";
  timeoutMs: number;
  /** Günlük "yumuşak" istek sınırı: ücretsiz katman kotasını aşmadan önce coin düşmeden "yoğunluk" deriz. Infinity = sınırsız. */
  dailyRequestLimit: number;
}

const PROVIDERS: ProviderName[] = ["groq", "openrouter", "fake"];

export function parseSpec(value: string | undefined, role: "primary" | "fallback"): ModelSpec | null {
  if (!value || !value.trim()) return null;
  const i = value.indexOf(":");
  const provider = value.slice(0, i) as ProviderName;
  const model = value.slice(i + 1);
  if (i <= 0 || !model || !PROVIDERS.includes(provider)) throw new Error(`Geçersiz AI model tanımı (${role}): "${value}"`);

  const isGptOss = model.includes("gpt-oss");
  const isFree = model.endsWith(":free");
  return {
    provider,
    model,
    reasoningEffort: isGptOss ? "low" : undefined, // düşünme token'ı = maliyet/süre; yorum için düşük yeterli
    strictSchema: provider === "groq" && isGptOss, // sıkı şema yalnızca desteklendiği bilinen yerde
    dataCollection: "deny", // OpenRouter'da sağlayıcının veriyi kaydetmesine/eğitimde kullanmasına izin verme
    timeoutMs: role === "primary" ? 20_000 : 15_000,
    dailyRequestLimit:
      provider === "groq" ? Number(process.env.AI_DAILY_LIMIT_GROQ ?? 60) : isFree ? 40 : Number.POSITIVE_INFINITY,
  };
}

export function aiConfig(): { primary: ModelSpec; fallback: ModelSpec | null } {
  const primary = parseSpec(process.env.AI_PRIMARY ?? "groq:openai/gpt-oss-120b", "primary");
  return { primary: primary!, fallback: parseSpec(process.env.AI_FALLBACK, "fallback") };
}
