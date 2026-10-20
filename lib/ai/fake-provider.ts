// Test sağlayıcısı: gerçek bir modele gitmeden belirlenimci davranış üretir (birim ve entegrasyon testleri için).
// Model adı davranışı seçer: "ok" | "repairable" | "invalid" | "rate_limit" | "timeout" | "slow" | "down".
// Güvenlik: üretimde (NODE_ENV=production) çalışmaz; yanlışlıkla `fake:ok` yapılandırılırsa istek reddedilir.

import { AiProviderError } from "./provider.ts";
import type { ChatOptions, ChatResult } from "./provider.ts";

const VALID = {
  headline: "Birlikte keşfedecek çok şeyiniz var.",
  summary: "İkiniz de birçok soruda benzer düşünüyorsunuz, birkaçında ise farklı yönlere gidiyorsunuz. Bu farklar merak uyandırıcı.",
  strengths: ["Ortak tercihleriniz sohbeti kolaylaştırıyor.", "Birbirinizin cevaplarını dikkatle okuyorsunuz.", "Farklılıkları konuşmaya açıksınız."],
  blindSpots: ["Bazı tahminlerde beklentiler biraz farklı çıktı.", "Sıralama sorularında öncelikler ayrışıyor."],
  conversationStarters: ["Hangi konuda en çok aynı düşünüyorsunuz?", "Sizi en çok şaşırtan cevap hangisiydi?", "Bir sonraki sefer neyi farklı tahmin ederdiniz?"],
};

export async function fakeChat(options: ChatOptions): Promise<ChatResult> {
  if (process.env.NODE_ENV === "production") throw new AiProviderError("not_configured", "Test sağlayıcısı üretimde kapalıdır.");
  const mode = options.model;
  const repairing = options.messages.length > 2; // generate.ts düzeltme turunda mesaj ekler

  if (mode === "rate_limit") throw new AiProviderError("rate_limited", "Hız sınırı (test)", { status: 429, retryAfterMs: 1000 });
  if (mode === "timeout") throw new AiProviderError("timeout", "Zaman aşımı (test)");
  if (mode === "down") throw new AiProviderError("upstream", "Sağlayıcı hatası (test)", { status: 503 });
  if (mode === "slow") await new Promise((r) => setTimeout(r, 1500));

  const invalid = mode === "invalid" || (mode === "repairable" && !repairing);
  const text = invalid ? '{"headline": "eksik alanlar"}' : JSON.stringify(VALID);
  return {
    text,
    model: `fake:${mode}`,
    finishReason: "stop",
    latencyMs: mode === "slow" ? 1500 : 5,
    usage: { promptTokens: 1000, completionTokens: 400, reasoningTokens: 0, totalTokens: 1400 },
    rateLimit: {},
  };
}
