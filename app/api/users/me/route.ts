import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";

export function OPTIONS() {
  return corsOptions();
}

/** Mobil: giriş yapmış kullanıcının coin bakiyesi ve tier'ı. Authorization: Bearer <Supabase JWT>. */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);

  const { data } = await createAdminClient()
    .from("users")
    .select("room_credits, tier")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return apiError("INTERNAL_ERROR", "Kullanıcı kaydı bulunamadı.", 500);

  return apiOk({ id: user.id, coins: data.room_credits, tier: data.tier });
}
