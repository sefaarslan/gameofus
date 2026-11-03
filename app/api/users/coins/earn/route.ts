import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { AD_REWARD_DAILY_LIMIT, COIN_REWARDS, CoinError, STORY_SHARE_DAILY_LIMIT, applyCoins, type EarnReason } from "@/lib/coins";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk, type ApiErrorCode } from "@/lib/api";

export function OPTIONS() {
  return corsOptions();
}

const DAILY_LIMITS: Record<EarnReason, { limit: number; code: ApiErrorCode; message: string }> = {
  ad_reward: { limit: AD_REWARD_DAILY_LIMIT, code: "AD_LIMIT_REACHED", message: "Günlük reklam ödülü sınırına ulaşıldı." },
  story_share: { limit: STORY_SHARE_DAILY_LIMIT, code: "STORY_LIMIT_REACHED", message: "Günlük story ödülü sınırına ulaşıldı." },
};

const isEarnReason = (v: unknown): v is EarnReason => typeof v === "string" && v in DAILY_LIMITS;

/**
 * Coin kazanma: reklam ödülü (+50, günde 3) ve story paylaşımı (+25, günde 1; paylaşım doğrulanmaz, yalnızca günlük sınır korur).
 * Kayıt bonusu (+500) Auth trigger'ıyla, solo ödülü (+50) solo `complete` içinde, satın alma `iap/verify` ile verilir; bu endpoint onları vermez.
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
  if (!isEarnReason(reason)) return apiError("INVALID_PAYLOAD", "Geçersiz neden.");
  if (typeof refId !== "string" || refId.length === 0 || refId.length > 100) {
    return apiError("INVALID_PAYLOAD", "refId gereklidir.");
  }

  // Günlük sınır: son 24 saatte aynı nedenle verilen ödül sayısı
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await createAdminClient()
    .from("credit_transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("reason", reason)
    .gte("created_at", since);
  const daily = DAILY_LIMITS[reason];
  if ((count ?? 0) >= daily.limit) {
    return apiError(daily.code, daily.message, 429);
  }

  try {
    const { balance, applied } = await applyCoins(user.id, COIN_REWARDS[reason], reason, refId);
    return apiOk({ balance, applied, earned: applied ? COIN_REWARDS[reason] : 0 });
  } catch (e) {
    if (e instanceof CoinError && e.code === "USER_NOT_FOUND") return apiError("INTERNAL_ERROR", "Kullanıcı kaydı bulunamadı.", 500);
    return apiError("INTERNAL_ERROR", "Coin eklenemedi.", 500);
  }
}
