import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiFailure, apiOkEtag } from "@/lib/api";
import { loadSoloHistory } from "@/lib/user-data";

export function OPTIONS() {
  return corsOptions();
}

/**
 * Mobil: kullanıcının tamamlanmış solo oyunları `{ items }` (en yeni önce; listeden kaldırılanlar çıkmaz). Bearer Supabase JWT.
 * ETag/`If-None-Match` desteklenir. Mantık `loadSoloHistory` içindedir (`lib/user-data.ts`; `GET /api/users/overview` ile ortak).
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);
  try {
    return apiOkEtag(req, await loadSoloHistory(user.id));
  } catch (err) {
    return apiFailure(err);
  }
}
