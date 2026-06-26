import { NextResponse } from "next/server";
import { CORS_HEADERS } from "./cors";

export type ApiErrorCode =
  | "ROOM_NOT_FOUND"
  | "ROOM_EXPIRED"
  | "ROOM_FULL"
  | "INVALID_TOKEN"
  | "ALREADY_SUBMITTED"
  | "QUESTION_NOT_FOUND"
  | "RESULT_NOT_READY"
  | "RATE_LIMITED"
  | "INVALID_PAYLOAD"
  | "INTERNAL_ERROR";

export function apiError(code: ApiErrorCode, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status, headers: CORS_HEADERS });
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS });
}
