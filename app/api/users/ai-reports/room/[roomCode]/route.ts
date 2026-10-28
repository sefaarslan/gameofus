import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";
import { normalizeRoomCode } from "@/lib/room-code-utils";

export function OPTIONS() {
  return corsOptions();
}

/**
 * Mobil: oda AI yorumunu "Analizlerim" listesinden kaldırır (yumuşak silme: `ai_commentaries.hidden_at`; yorum silinmez,
 * coin iade edilmez, oda sonuç ekranından yine okunur). Yalnızca çağıranın SATIN ALDIĞI hazır yorum etkilenir. Idempotenttir.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);
  const roomCode = normalizeRoomCode((await params).roomCode);

  const supabase = createAdminClient();
  const { data: room } = await supabase.from("rooms").select("id").eq("room_code", roomCode).maybeSingle();
  if (!room) return apiError("ROOM_NOT_FOUND", "Analiz bulunamadı.", 404);

  const { data: updated } = await supabase
    .from("ai_commentaries")
    .update({ hidden_at: new Date().toISOString() })
    .eq("room_id", room.id)
    .eq("purchased_by", user.id)
    .eq("status", "ready")
    .select("id");
  if (!updated || updated.length === 0) return apiError("ROOM_NOT_FOUND", "Analiz bulunamadı.", 404);

  return apiOk({ hidden: true });
}
