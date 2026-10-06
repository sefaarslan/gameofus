import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";
import { MIN_APP_AGE, ageOn, parseBirthDate } from "@/lib/age";

export function OPTIONS() {
  return corsOptions();
}

/** Mobil: giriş yapmış kullanıcının coin bakiyesi ve tier'ı. Authorization: Bearer <Supabase JWT>. */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);

  const { data } = await createAdminClient()
    .from("users")
    .select("room_credits, tier, birth_date")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return apiError("INTERNAL_ERROR", "Kullanıcı kaydı bulunamadı.", 500);

  return apiOk({ id: user.id, coins: data.room_credits, tier: data.tier, birthDate: data.birth_date });
}

/**
 * Profil: doğum tarihi (`{ "birthDate": "YYYY-AA-GG" }`). Cesur Sorular gibi yaş koşullu kategoriler ve (planlanan) AI yorum
 * için kullanılır; oda kurarken de gönderilebilir (profile yazılır). Asgari uygulama yaşı altı reddedilir.
 */
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return apiError("INVALID_PAYLOAD", "Geçersiz istek gövdesi.");
  }
  const birth = parseBirthDate(body.birthDate);
  if (!birth) return apiError("INVALID_PAYLOAD", "Geçersiz doğum tarihi (YYYY-AA-GG).");
  if (ageOn(birth) < MIN_APP_AGE) return apiError("AGE_RESTRICTED", `Uygulama ${MIN_APP_AGE} yaş ve üzeri içindir.`, 403);

  const { error } = await createAdminClient().from("users").update({ birth_date: body.birthDate as string }).eq("id", user.id);
  if (error) return apiError("INTERNAL_ERROR", "Profil güncellenemedi.", 500);
  return apiOk({ birthDate: body.birthDate });
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
