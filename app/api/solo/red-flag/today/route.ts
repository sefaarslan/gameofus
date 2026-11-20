import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiFailure, apiOkEtag } from "@/lib/api";
import { normalizeTimezone } from "@/lib/solo-daily";
import { loadSoloToday } from "@/lib/user-data";

export function OPTIONS() {
  return corsOptions();
}

/**
 * Mobil: bugünün Red Flag setleri (kategori başına bir set) ve kullanıcının durumu. Bearer Supabase JWT. ETag/`If-None-Match` desteklenir.
 * `?timezone=Europe/Istanbul` (IANA; yoksa/geçersizse Europe/Istanbul). Kartlar burada DÖNMEZ: oyun `POST /api/solo/red-flag/start`
 * ile `{ category, timezone }` gönderilerek başlatılır. Oynanmış kategori için `sessionId` + özet gelir (tam sonuç: `solo-history/{sessionId}`).
 * Mantık `loadSoloToday` içindedir (`lib/user-data.ts`; `GET /api/users/overview` ile ortak).
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);
  try {
    return apiOkEtag(req, await loadSoloToday(user.id, normalizeTimezone(req.nextUrl.searchParams.get("timezone"))));
  } catch (err) {
    return apiFailure(err);
  }
}
