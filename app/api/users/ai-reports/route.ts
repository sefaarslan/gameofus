import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";

export function OPTIONS() {
  return corsOptions();
}

/**
 * Mobil: kullanıcının SATIN ALDIĞI AI yorum/analizlerin listesi (yeniden eskiye, düz dizi, en çok 100). İki tür:
 *  - `type: "room"`: iki kişilik oda yorumu `{ roomCode, partnerName, relationshipType, headline, createdAt }`
 *  - `type: "solo"`: solo oyun analizi `{ sessionId, gameType, pack, headline, createdAt }`
 * Listeden kaldırılanlar (`DELETE /api/users/ai-reports/{room|solo}/{id}`) çıkmaz; analiz silinmez.
 * Partnerin satın aldığı oda yorumları burada çıkmaz (onlara oda sonuç ekranından ulaşılır). Saklama süresi (90 gün) dolan
 * odaların/oturumların analizleri zaten silinmiştir.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);

  const supabase = createAdminClient();
  const [{ data: roomRows }, { data: soloRows }] = await Promise.all([
    supabase
      .from("ai_commentaries")
      .select("room_id, content, created_at")
      .eq("purchased_by", user.id)
      .eq("status", "ready")
      .is("hidden_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("ai_solo_analyses")
      .select("session_id, game, content, created_at")
      .eq("purchased_by", user.id)
      .eq("status", "ready")
      .is("hidden_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  const rooms = roomRows ?? [];
  const solos = soloRows ?? [];
  if (rooms.length === 0 && solos.length === 0) return apiOk([]);

  const roomIds = rooms.map((r) => r.room_id);
  const sessionIds = solos.map((r) => r.session_id);
  const [{ data: roomInfo }, { data: parts }, { data: sessions }] = await Promise.all([
    roomIds.length ? supabase.from("rooms").select("id, room_code, relationship_type").in("id", roomIds) : Promise.resolve({ data: [] }),
    roomIds.length ? supabase.from("participants").select("room_id, user_id, display_name").in("room_id", roomIds) : Promise.resolve({ data: [] }),
    sessionIds.length ? supabase.from("solo_sessions").select("id, pack_key").in("id", sessionIds) : Promise.resolve({ data: [] }),
  ]);
  const roomById = new Map((roomInfo ?? []).map((r) => [r.id, r]));
  const packById = new Map((sessions ?? []).map((s) => [s.id, s.pack_key]));
  const headlineOf = (c: unknown) => (c as { headline?: string } | null)?.headline ?? "";

  const items = [
    ...rooms.flatMap((r) => {
      const room = roomById.get(r.room_id);
      if (!room) return [];
      const partner = (parts ?? []).find((p) => p.room_id === r.room_id && p.user_id !== user.id);
      return [
        {
          type: "room" as const,
          roomCode: room.room_code,
          partnerName: partner?.display_name ?? null,
          relationshipType: room.relationship_type,
          headline: headlineOf(r.content),
          createdAt: r.created_at,
        },
      ];
    }),
    ...solos.map((r) => ({
      type: "solo" as const,
      sessionId: r.session_id,
      gameType: r.game,
      pack: packById.get(r.session_id) ?? null,
      headline: headlineOf(r.content),
      createdAt: r.created_at,
    })),
  ];
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return apiOk(items.slice(0, 100));
}
