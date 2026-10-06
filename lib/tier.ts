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
