import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { COIN_PRICES, CoinError, applyCoins, type SpendReason } from "@/lib/coins";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";

export function OPTIONS() {
  return corsOptions();
}

const isSpendReason = (v: unknown): v is SpendReason => typeof v === "string" && v in COIN_PRICES;

/**
 * Coin harcama. Miktar sunucuda sabittir (istemci miktar gönderemez); `refId` aynı kalırsa tekrar düşmez.
 * Not: oda oluşturma `POST /api/rooms/create` içinde kendi coin düşümünü yapar; bu endpoint AI yorum / solo AI içindir.
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
  if (!isSpendReason(reason) || reason === "room_create") {
    return apiError("INVALID_PAYLOAD", "Geçersiz neden.");
  }
  if (typeof refId !== "string" || refId.length === 0 || refId.length > 100) {
    return apiError("INVALID_PAYLOAD", "refId gereklidir.");
  }

  try {
    const { balance, applied } = await applyCoins(user.id, -COIN_PRICES[reason], reason, refId);
    return apiOk({ balance, applied, spent: applied ? COIN_PRICES[reason] : 0 });
  } catch (e) {
    if (e instanceof CoinError && e.code === "INSUFFICIENT_COINS") return apiError("INSUFFICIENT_COINS", "Yeterli coin yok.", 402);
    return apiError("INTERNAL_ERROR", "Coin düşülemedi.", 500);
  }
}
