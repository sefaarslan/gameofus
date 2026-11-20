import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiFailure, apiOkEtag } from "@/lib/api";
import { loadAiReports } from "@/lib/user-data";

export function OPTIONS() {
  return corsOptions();
}

/**
 * Mobil: kullanıcının SATIN ALDIĞI AI yorum/analizlerin listesi (yeniden eskiye, düz dizi, en çok 100). İki tür:
 *  - `type: "room"`: iki kişilik oda yorumu `{ roomCode, partnerName, relationshipType, headline, createdAt }`
 *  - `type: "solo"`: solo oyun analizi `{ sessionId, gameType, pack, headline, createdAt }`
 * Listeden kaldırılanlar (`DELETE /api/users/ai-reports/{room|solo}/{id}`) çıkmaz; analiz silinmez. Partnerin satın aldığı oda yorumları
 * burada çıkmaz (onlara oda sonuç ekranından ulaşılır). ETag/`If-None-Match` desteklenir. Mantık `loadAiReports` içindedir
 * (`lib/user-data.ts`; `GET /api/users/overview` ile ortak).
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);
  try {
    return apiOkEtag(req, await loadAiReports(user.id));
  } catch (err) {
    return apiFailure(err);
  }
}
