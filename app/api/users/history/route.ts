import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiFailure, apiOkEtag } from "@/lib/api";
import { loadHistory } from "@/lib/user-data";

export function OPTIONS() {
  return corsOptions();
}

/**
 * Mobil: kullanıcının oda geçmişi (en yeni önce). Bearer Supabase JWT. Yanıt düz dizidir (sarmalayıcı yok); ETag/`If-None-Match` desteklenir.
 * Kapsam ve filtreler `loadHistory` içindedir (`lib/user-data.ts`; `GET /api/users/overview` ile ortak): `created_at` son 90 gün,
 * listeden kaldırılanlar (`DELETE /api/users/history/{roomCode}`, `participants.hidden_at`) çıkmaz. Sonuç ayrıntısı için
 * `GET /api/rooms/{roomCode}/results` aynı JWT ile açılır (süresi dolmuş odada da, bu pencerede).
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);
  try {
    return apiOkEtag(req, await loadHistory(user.id));
  } catch (err) {
    return apiFailure(err);
  }
}
