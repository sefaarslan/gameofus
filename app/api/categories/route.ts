import { createAdminClient } from "@/lib/supabase/server";
import { apiError, apiOk } from "@/lib/api";
import { corsOptions } from "@/lib/cors";
import { isRelationshipType } from "@/lib/relationship";

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
    .select("id, name, slug, is_premium, sort_order, relationship_types")
    .eq("locale", safeLocale);
  if (relationshipType) query = query.contains("relationship_types", [relationshipType]);

  const { data: categories, error } = await query.order("sort_order");

  if (error || !categories) {
    return apiError("INTERNAL_ERROR", "Kategoriler yüklenemedi.", 500);
  }

  return apiOk(categories);
}
