// Test sağlayıcısı: gerçek bir modele gitmeden belirlenimci davranış üretir (birim ve entegrasyon testleri için).
// Model adı davranışı seçer: "ok" | "repairable" | "invalid" | "rate_limit" | "rate_limit_once" | "rate_limit_twice" | "rate_limit_long" | "cliche" | "percent" | "timeout" | "slow" | "down".
// Güvenlik: üretimde (NODE_ENV=production) çalışmaz; yanlışlıkla `fake:ok` yapılandırılırsa istek reddedilir.

import { AiProviderError } from "./provider.ts";
import type { ChatOptions, ChatResult } from "./provider.ts";

const VALID = {
  headline: "Birlikte keşfedecek çok şeyiniz var.",
  summary: "İkiniz de birçok soruda benzer düşünüyorsunuz, birkaçında ise farklı yönlere gidiyorsunuz. Bu farklar merak uyandırıcı.",
  strengths: ["Ortak tercihleriniz sohbeti kolaylaştırıyor.", "Birbirinizin cevaplarını dikkatle okuyorsunuz.", "Farklılıkları konuşmaya açıksınız."],
  blindSpots: ["Bazı tahminlerde beklentiler biraz farklı çıktı.", "Sıralama sorularında öncelikler ayrışıyor."],
  conversationStarters: ["Hangi konuda en çok aynı düşünüyorsunuz?", "Sizi en çok şaşırtan cevap hangisiydi?", "Bir sonraki sefer neyi farklı tahmin ederdiniz?"],
  awards: [
    { title: "🏆 Aynı Dalga Ödülü", text: "Birçok soruda aynı yöne baktınız." },
    { title: "🎭 Sürpriz Ödülü", text: "Birkaç tahmin tam ters çıktı." },
    { title: "🔍 Dedektif Ödülü", text: "Bazı cevapları gözünüz kapalı bildiniz." },
  ],
};

/** "rate_limit_once": tek sayaç; çift çağrılar (0., 2., …) kısa bir 429 verir, tek çağrılar başarılı olur (bekle-yeniden-dene testi için). */
let onceCounter = 0;
let twiceCounter = 0;

export async function fakeChat(options: ChatOptions): Promise<ChatResult> {
  if (process.env.NODE_ENV === "production") throw new AiProviderError("not_configured", "Test sağlayıcısı üretimde kapalıdır.");
  const mode = options.model;
  const repairing = options.messages.length > 2; // generate.ts düzeltme turunda mesaj ekler

  if (mode === "rate_limit") throw new AiProviderError("rate_limited", "Hız sınırı (test)", { status: 429, retryAfterMs: 1000 });
  if (mode === "rate_limit_long") throw new AiProviderError("rate_limited", "Hız sınırı (test, uzun)", { status: 429, retryAfterMs: 40_000 });
  if (mode === "rate_limit_twice" && twiceCounter++ % 3 < 2) throw new AiProviderError("rate_limited", "Hız sınırı (test, iki kez)", { status: 429, retryAfterMs: 30 });
  if (mode === "rate_limit_once" && onceCounter++ % 2 === 0) throw new AiProviderError("rate_limited", "Hız sınırı (test, kısa)", { status: 429, retryAfterMs: 50 });
  if (mode === "timeout") throw new AiProviderError("timeout", "Zaman aşımı (test)");
  if (mode === "down") throw new AiProviderError("upstream", "Sağlayıcı hatası (test)", { status: 503 });
  if (mode === "slow") await new Promise((r) => setTimeout(r, 1500));

  const invalid = mode === "invalid" || (mode === "repairable" && !repairing);
  // "cliche": yumuşak üslup sorunu (hep klişe kullanır); "percent": sert sorun (hep yüzde kullanır)
  const valid = (options.fakeValid ?? VALID) as Record<string, unknown>;
  const body =
    mode === "cliche"
      ? "strengths" in valid
        ? { ...valid, strengths: ["Ortak zemin bulmanız harika.", ...(valid.strengths as string[]).slice(1)] }
        : { ...valid, summary: "Ortak zemin bulmanız harika." } // solo şekli: summary yumuşak sorunu taşır
      : mode === "percent"
        ? { ...valid, summary: "Yüzde 70 uyumlusunuz, yani %70." }
        : valid;
  const text = invalid ? '{"headline": "eksik alanlar"}' : JSON.stringify(body);
  return {
    text,
    model: `fake:${mode}`,
    finishReason: "stop",
    latencyMs: mode === "slow" ? 1500 : 5,
    usage: { promptTokens: 1000, completionTokens: 400, reasoningTokens: 0, totalTokens: 1400 },
    rateLimit: {},
  };
}
