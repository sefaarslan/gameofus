import { createAdminClient } from "@/lib/supabase/server";

/** Sunucuda sabit fiyatlar: istemci miktar göndermez, yalnızca neden (reason) bildirir. */
export const COIN_PRICES = {
  room_create: 250,
  ai_commentary: 100,
  solo_ai: 100,
} as const;
export type SpendReason = keyof typeof COIN_PRICES;

export const COIN_REWARDS = {
  signup_bonus: 500,
  ad_reward: 100,
  solo_reward: 20,
} as const;
export type EarnReason = "ad_reward";

/** Solo oyun ödülü: aynı kullanıcı için her set yalnızca BİR kez ödül verir (tekrar oynama ödülsüz); günde en fazla 3 ödüllü oyun */
export const SOLO_REWARD_DAILY_LIMIT = 3;

/** Reklam ödülü günlük üst sınırı (AdMob sunucu doğrulaması gelene kadar kötüye kullanımı sınırlar) */
export const AD_REWARD_DAILY_LIMIT = 5;

export type CoinReason =
  | "signup_bonus"
  | "ad_reward"
  | "room_create"
  | "room_create_refund"
  | "ai_commentary"
  | "ai_commentary_refund"
  | "solo_reward"
  | "solo_ai"
  | "solo_ai_refund"
  | "purchase"
  | "admin_adjust";

export class CoinError extends Error {
  constructor(public code: "INSUFFICIENT_COINS" | "USER_NOT_FOUND" | "INTERNAL") {
    super(code);
  }
}

/**
 * Atomik ve idempotent coin değişimi (SQL: apply_coins). `ref` aynı kalırsa ikinci çağrı bakiyeyi değiştirmez
 * (`applied: false`). Yalnızca sunucuda (service role) çağrılır.
 */
export async function applyCoins(
  userId: string,
  delta: number,
  reason: CoinReason,
  ref?: string,
): Promise<{ balance: number; applied: boolean }> {
  const { data, error } = await createAdminClient().rpc("apply_coins", {
    p_user: userId,
    p_delta: delta,
    p_reason: reason,
    ...(ref ? { p_ref: ref } : {}),
  });
  if (error) {
    if (error.message.includes("INSUFFICIENT_COINS")) throw new CoinError("INSUFFICIENT_COINS");
    if (error.message.includes("USER_NOT_FOUND")) throw new CoinError("USER_NOT_FOUND");
    throw new CoinError("INTERNAL");
  }
  const row = data?.[0];
  if (!row) throw new CoinError("INTERNAL");
  return { balance: row.balance, applied: row.applied };
}
