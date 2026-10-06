import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { AD_REWARD_DAILY_LIMIT, COIN_REWARDS, CoinError, applyCoins } from "@/lib/coins";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";

export function OPTIONS() {
  return corsOptions();
}

/**
 * Coin kazanma: şimdilik yalnızca reklam ödülü (+100, günlük sınırlı). Kayıt bonusu (+500) Auth trigger'ıyla,
 * solo ödülü (+20) solo `complete` içinde, satın alma `iap/verify` ile verilir; bu endpoint onları vermez.
 * Not: AdMob sunucu doğrulaması (SSV) gelene kadar günlük sınır tek korumadır.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return apiError("INVALID_PAYLOAD", "Geçersiz istek gövdesi.");
  }
  const { reason, refId } = body;
  if (reason !== "ad_reward") return apiError("INVALID_PAYLOAD", "Geçersiz neden.");
  if (typeof refId !== "string" || refId.length === 0 || refId.length > 100) {
    return apiError("INVALID_PAYLOAD", "refId gereklidir.");
  }

  // Günlük sınır: son 24 saatte verilen reklam ödülü sayısı
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await createAdminClient()
    .from("credit_transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("reason", "ad_reward")
    .gte("created_at", since);
  if ((count ?? 0) >= AD_REWARD_DAILY_LIMIT) {
    return apiError("AD_LIMIT_REACHED", "Günlük reklam ödülü sınırına ulaşıldı.", 429);
  }

  try {
    const { balance, applied } = await applyCoins(user.id, COIN_REWARDS.ad_reward, "ad_reward", refId);
    return apiOk({ balance, applied, earned: applied ? COIN_REWARDS.ad_reward : 0 });
  } catch (e) {
    if (e instanceof CoinError && e.code === "USER_NOT_FOUND") return apiError("INTERNAL_ERROR", "Kullanıcı kaydı bulunamadı.", 500);
    return apiError("INTERNAL_ERROR", "Coin eklenemedi.", 500);
  }
}
