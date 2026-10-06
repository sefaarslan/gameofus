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

/**
 * Hesabı kalıcı olarak siler (App Store 5.1.1(v) / Google Play). Gövde: `{ "confirm": true }` (kaza ile silmeyi önler).
 * Silinenler: kurulan odalar (içeriğiyle), solo oyunlar, coin kayıtları, kullanıcı ve Auth kaydı. Başkalarının odalarındaki
 * katılım anonimleştirilir; satın alma kayıtları kullanıcıdan ayrılmış halde yasal süre saklanır.
 * (Sign in with Apple için Apple token iptali ayrıca eklenecek.)
 */
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* gövde yoksa aşağıda reddedilir */
  }
  if (body.confirm !== true) return apiError("INVALID_PAYLOAD", "Silme onayı gereklidir.");

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("delete_user_account", { p_user: user.id });
  if (error) return apiError("INTERNAL_ERROR", "Hesap silinemedi.", 500);

  const { error: authErr } = await supabase.auth.admin.deleteUser(user.id);
  if (authErr) return apiError("INTERNAL_ERROR", "Hesap silinemedi.", 500);

  return apiOk({ deleted: true });
}
