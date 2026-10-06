import { createAdminClient } from "@/lib/supabase/server";
import { apiError, apiOk } from "@/lib/api";
import { corsOptions } from "@/lib/cors";
import { isRelationshipType } from "@/lib/relationship";
import { getAuthUser } from "@/lib/auth";
import { canAccessTier, isTier, type Tier } from "@/lib/tier";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") ?? "en";
  const validLocales = ["tr", "en", "es"];
  const safeLocale = validLocales.includes(locale) ? locale : "en";

  const relationshipType = searchParams.get("relationshipType");
  if (relationshipType !== null && !isRelationshipType(relationshipType)) {
    return apiError("INVALID_PAYLOAD", "Geçersiz ilişki türü.");
  }

  const supabase = createAdminClient();

  let query = supabase
    .from("categories")
    .select("id, name, slug, is_premium, sort_order, relationship_types, min_tier, min_age")
    .eq("locale", safeLocale);
  if (relationshipType) query = query.contains("relationship_types", [relationshipType]);

  // Giriş yapmış (mobil) kullanıcının tier'ı: kilit durumu buna göre hesaplanır. Anonim web'de tier'lı kategoriler kilitlidir.
  const authUser = await getAuthUser(req);
  const [{ data: categories, error }, userRow] = await Promise.all([
    query.order("sort_order"),
    authUser ? supabase.from("users").select("tier").eq("id", authUser.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  if (error || !categories) {
    return apiError("INTERNAL_ERROR", "Kategoriler yüklenemedi.", 500);
  }

  const userTier: Tier = isTier(userRow.data?.tier) ? userRow.data.tier : "free";
  return apiOk(
    categories.map((c) => ({
      ...c,
      // locked: bu kullanıcı bu kategoriyi seçemez (paket yetersiz ya da web). Yaş koşulu (min_age) oda kurarken ayrıca doğrulanır.
      locked: !canAccessTier(userTier, isTier(c.min_tier) ? c.min_tier : "free"),
    })),
  );
}
