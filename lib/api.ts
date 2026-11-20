import { NextResponse } from "next/server";
import { CORS_HEADERS } from "./cors";
import { ifNoneMatchHit, weakEtag } from "./etag";
import { SectionError } from "./overview";

export type ApiErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_EXPIRED"
  | "ROOM_FULL"
  | "ROOM_WEB_ONLY"
  | "INVALID_TOKEN"
  | "ALREADY_SUBMITTED"
  | "QUESTION_NOT_FOUND"
  | "SESSION_NOT_FOUND"
  | "PACK_UNAVAILABLE"
  | "DAILY_MOBILE_ONLY"
  | "ALREADY_PLAYED_TODAY"
  | "UNAUTHORIZED"
  | "INSUFFICIENT_COINS"
  | "AD_LIMIT_REACHED"
  | "STORY_LIMIT_REACHED"
  | "TIER_REQUIRED"
  | "AGE_VERIFICATION_REQUIRED"
  | "AGE_RESTRICTED"
  | "RESULT_NOT_READY"
  | "RATE_LIMITED"
  | "AI_MOBILE_ONLY"
  | "AI_CONSENT_REQUIRED"
  | "AI_PARTNER_CONSENT_REQUIRED"
  | "AI_UNAVAILABLE"
  | "INVALID_PAYLOAD"
  | "INTERNAL_ERROR";

export function apiError(code: ApiErrorCode, message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: { code, message, ...extra } }, { status, headers: CORS_HEADERS });
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS });
}

/**
 * Koşullu GET yanıtı: gövdeden zayıf ETag + `Cache-Control: private, no-cache` (istemci her seferinde doğrular, veri kullanıcıya özeldir).
 * İstemci `If-None-Match` gönderdiyse ve değişmediyse `304 Not Modified` (gövdesiz). `etagSource`, ETag'in hesaplandığı veridir:
 * her istekte değişen alanları (ör. `generatedAt`) içermemelidir, aksi halde 304 hiç oluşmaz.
 */
export function apiOkEtag(req: { headers: Headers }, data: unknown, etagSource: unknown = data) {
  const etag = weakEtag(etagSource);
  const headers = { ...CORS_HEADERS, ETag: etag, "Cache-Control": "private, no-cache", Vary: "Authorization" };
  if (ifNoneMatchHit(req.headers.get("if-none-match"), etag)) return new NextResponse(null, { status: 304, headers });
  return new NextResponse(JSON.stringify(data), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
}

/** Yükleyici (`lib/user-data.ts`) hatasını yanıta çevirir: bilinen hata kodu korunur, diğerleri `500 INTERNAL_ERROR` (ayrıntı loga yalnızca tür). */
export function apiFailure(err: unknown) {
  if (err instanceof SectionError) return apiError(err.code as ApiErrorCode, err.message, err.status);
  console.error("api: beklenmeyen hata:", err instanceof Error ? err.name : "unknown");
  return apiError("INTERNAL_ERROR", "Beklenmeyen bir hata oluştu.", 500);
}

