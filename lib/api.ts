import { NextResponse } from "next/server";
import { CORS_HEADERS } from "./cors";

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
