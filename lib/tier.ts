export const TIERS = ["free", "lite", "premium"] as const;
export type Tier = (typeof TIERS)[number];

export function isTier(v: unknown): v is Tier {
  return typeof v === "string" && (TIERS as readonly string[]).includes(v);
}

export const tierRank = (t: Tier): number => TIERS.indexOf(t);

/** Kullanıcının tier'ı kategorinin gerektirdiği tier'a eşit ya da üstünde mi? (Per-kategori takip yok; yalnızca tier.) */
export function canAccessTier(userTier: Tier, minTier: Tier): boolean {
  return tierRank(userTier) >= tierRank(minTier);
}

/** Mobilde 10 soruluk setler `lite` ve üstünü gerektirir (5 soruluk setler ücretsiz). Web'de 5 ve 10 soru ücretsizdir. */
export const LONG_SET_QUESTION_COUNT = 10;
export const LONG_SET_MIN_TIER: Tier = "lite";

/** Mobilde "Karma Tur" oyun modu (`gameMode: "mixed"`) `lite` ve üstünü gerektirir. Web'de anonim oda kurmada kısıt yoktur (web arayüzü modu kapalı gösterir). */
export const MIXED_MODE_MIN_TIER: Tier = "lite";

/** Oda kurma bu tier ve üstü için ücretsiz ve sınırsızdır (coin düşülmez, oda oluşturma hız sınırı uygulanmaz). */
export const FREE_ROOMS_MIN_TIER: Tier = "lite";

/**
 * `premium` tier şu anda satılmıyor (2026-11-27): `min_tier = premium` kategoriler (Cesur Sorular) web'de ve mobilde GİZLİDİR —
 * kategori listesinde dönmez, oda kurmada reddedilir. Veritabanında kalır; satış açılınca `true` yapılır. Mevcut odalar oynanır.
 */
export const PREMIUM_TIER_ON_SALE = false;
export const isCategoryOffered = (minTier: string | null | undefined): boolean => PREMIUM_TIER_ON_SALE || minTier !== "premium";
