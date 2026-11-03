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
