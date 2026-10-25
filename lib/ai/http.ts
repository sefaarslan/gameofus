// AI uçlarının (oda yorumu + solo analiz) ortak HTTP yardımcıları.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CORS_HEADERS } from "@/lib/cors";
import { aiConfig, parseSpec } from "./config.ts";
import type { ModelSpec } from "./config.ts";

/** Kullanılacak modeller (ortam değişkenleri). Yalnızca geliştirmede, açıkça izin verilirse başlıkla geçersiz kılınabilir (testler). */
export function modelSpecs(req: NextRequest): ModelSpec[] {
  if (process.env.NODE_ENV !== "production" && process.env.AI_ALLOW_TEST_OVERRIDE === "1") {
    const override = req.headers.get("x-ai-test-specs");
    if (override) return override.split(",").map((s) => parseSpec(s.trim(), "primary")!);
  }
  const cfg = aiConfig();
  return cfg.fallback ? [cfg.primary, cfg.fallback] : [cfg.primary];
}

/** 503 AI_UNAVAILABLE + `refunded` (coin iade edildi mi / hiç düşülmedi mi). */
export function unavailable(refunded: boolean, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    { error: { code: "AI_UNAVAILABLE", message: "Şu an yorum üretilemiyor. Lütfen biraz sonra tekrar dene." }, refunded, ...extra },
    { status: 503, headers: CORS_HEADERS },
  );
}
