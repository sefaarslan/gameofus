import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { COIN_REWARDS, CoinError, applyCoins, dailyEarnStatus, type EarnReason } from "@/lib/coins";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk, type ApiErrorCode } from "@/lib/api";

export function OPTIONS() {
  return corsOptions();
}

const LIMIT_ERRORS: Record<EarnReason, { code: ApiErrorCode; message: string }> = {
  ad_reward: { code: "AD_LIMIT_REACHED", message: "Günlük reklam ödülü sınırına ulaşıldı." },
  story_share: { code: "STORY_LIMIT_REACHED", message: "Günlük story ödülü sınırına ulaşıldı." },
};

const isEarnReason = (v: unknown): v is EarnReason => typeof v === "string" && v in LIMIT_ERRORS;

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
  if ((await dailyEarnStatus(user.id))[reason].remaining === 0) {
    return apiError(LIMIT_ERRORS[reason].code, LIMIT_ERRORS[reason].message, 429);
  }

  try {
    const { balance, applied } = await applyCoins(user.id, COIN_REWARDS[reason], reason, refId);
    return apiOk({ balance, applied, earned: applied ? COIN_REWARDS[reason] : 0, daily: (await dailyEarnStatus(user.id))[reason] });
  } catch (e) {
    if (e instanceof CoinError && e.code === "USER_NOT_FOUND") return apiError("INTERNAL_ERROR", "Kullanıcı kaydı bulunamadı.", 500);
    return apiError("INTERNAL_ERROR", "Coin eklenemedi.", 500);
  }
}
