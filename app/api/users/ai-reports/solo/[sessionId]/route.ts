import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";

export function OPTIONS() {
  return corsOptions();
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mobil: solo AI analizini "Analizlerim" listesinden kaldırır (yumuşak silme: `ai_solo_analyses.hidden_at`; analiz silinmez,
 * coin iade edilmez, oyunun sonuç ekranından yine okunur). Yalnızca çağıranın SATIN ALDIĞI hazır analiz etkilenir. Idempotenttir.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);
  const { sessionId } = await params;
  if (!UUID_RE.test(sessionId)) return apiError("SESSION_NOT_FOUND", "Analiz bulunamadı.", 404);

  const { data: updated } = await createAdminClient()
    .from("ai_solo_analyses")
    .update({ hidden_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .eq("purchased_by", user.id)
    .eq("status", "ready")
    .select("id");
  if (!updated || updated.length === 0) return apiError("SESSION_NOT_FOUND", "Analiz bulunamadı.", 404);

  return apiOk({ hidden: true });
}
