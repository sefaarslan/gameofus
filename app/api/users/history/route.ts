import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";
import { RETENTION } from "@/lib/retention";

export function OPTIONS() {
  return corsOptions();
}

/**
 * Mobil: kullanıcının oda geçmişi (en yeni önce). Bearer Supabase JWT.
 * Kapsam: `participants.user_id = kullanıcı` olan odalar (kurucu ya da katılımcı olarak); yalnızca son 90 gün
 * (saklama süresiyle aynı: `expires_at` + userHistoryDays sonra silinir). Sonuç ayrıntısı için
 * `GET /api/rooms/{roomCode}/results` aynı JWT ile açılır (süresi dolmuş odada da, bu pencerede).
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);

  const supabase = createAdminClient();
  const since = new Date(Date.now() - RETENTION.userHistoryDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: mine } = await supabase
    .from("participants")
    .select("id, room_id, role")
    .eq("user_id", user.id);
  const myRows = mine ?? [];
  if (myRows.length === 0) return apiOk({ items: [] });

  const roomIds = myRows.map((p) => p.room_id);
  const [{ data: rooms }, { data: everyone }, { data: results }] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, room_code, locale, relationship_type, status, game_mode, question_count, created_at, expires_at")
      .in("id", roomIds)
      .gte("expires_at", since)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("participants").select("id, room_id, role, display_name").in("room_id", roomIds),
    supabase.from("results").select("room_id, reading_score, created_at").in("room_id", roomIds),
  ]);

  const myByRoom = new Map(myRows.map((p) => [p.room_id, p]));
  const resultByRoom = new Map((results ?? []).map((r) => [r.room_id, r]));
  const now = Date.now();

  const items = (rooms ?? []).flatMap((room) => {
    const me = myByRoom.get(room.id);
    if (!me) return [];
    const partner = (everyone ?? []).find((p) => p.room_id === room.id && p.id !== me.id);
    const result = resultByRoom.get(room.id);
    return [
      {
        roomCode: room.room_code,
        locale: room.locale,
        relationshipType: room.relationship_type ?? null,
        gameMode: room.game_mode,
        questionCount: room.question_count,
        status: room.status,
        role: me.role,
        // Partner hesabını sildiyse ad boşalır (null)
        partnerName: partner?.display_name ?? null,
        createdAt: room.created_at,
        expiresAt: room.expires_at,
        expired: new Date(room.expires_at).getTime() < now,
        resultReady: !!result,
        readingScore: result?.reading_score ?? null,
        completedAt: result?.created_at ?? null,
      },
    ];
  });

  return apiOk({ items });
}
