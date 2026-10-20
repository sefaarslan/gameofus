import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";

export function OPTIONS() {
  return corsOptions();
}

/**
 * Mobil: kullanıcının SATIN ALDIĞI AI yorumların listesi (yeniden eskiye, düz dizi). Partnerin satın aldıkları burada çıkmaz
 * (onlara oda sonuç ekranından ulaşılır). Saklama süresi (90 gün) dolan odaların yorumları zaten silinmiştir.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);

  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from("ai_commentaries")
    .select("room_id, content, created_at")
    .eq("purchased_by", user.id)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(100);
  const list = rows ?? [];
  if (list.length === 0) return apiOk([]);

  const roomIds = list.map((r) => r.room_id);
  const [{ data: rooms }, { data: parts }] = await Promise.all([
    supabase.from("rooms").select("id, room_code, relationship_type").in("id", roomIds),
    supabase.from("participants").select("room_id, user_id, display_name").in("room_id", roomIds),
  ]);
  const roomById = new Map((rooms ?? []).map((r) => [r.id, r]));

  return apiOk(
    list.flatMap((r) => {
      const room = roomById.get(r.room_id);
      if (!room) return [];
      const partner = (parts ?? []).find((p) => p.room_id === r.room_id && p.user_id !== user.id);
      const content = r.content as { headline?: string } | null;
      return [
        {
          roomCode: room.room_code,
          partnerName: partner?.display_name ?? null,
          relationshipType: room.relationship_type,
          headline: content?.headline ?? "",
          createdAt: r.created_at,
        },
      ];
    }),
  );
}
