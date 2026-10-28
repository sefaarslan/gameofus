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
 * Mobil: odayı "Oyunlarım" listesinden kaldırır (yumuşak silme: `participants.hidden_at`; oda, cevaplar ve sonuç silinmez).
 * Yalnızca çağıranın kendi katılımcı satırı etkilenir, partnerin listesi aynen kalır. Idempotenttir (zaten kaldırılmışsa 200).
 * Kullanıcının katılımcısı olmadığı / var olmayan oda aynı `404 ROOM_NOT_FOUND`'u verir. Sonuç ayrıntısı doğrudan
 * `GET /api/rooms/{roomCode}/results` ile hâlâ açılabilir.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ roomCode: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);
  const roomCode = normalizeRoomCode((await params).roomCode);

  const supabase = createAdminClient();
  const { data: room } = await supabase.from("rooms").select("id").eq("room_code", roomCode).maybeSingle();
  if (!room) return apiError("ROOM_NOT_FOUND", "Oda bulunamadı.", 404);

  const { data: updated } = await supabase
    .from("participants")
    .update({ hidden_at: new Date().toISOString() })
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .select("id");
  if (!updated || updated.length === 0) return apiError("ROOM_NOT_FOUND", "Oda bulunamadı.", 404);

  return apiOk({ hidden: true });
}
