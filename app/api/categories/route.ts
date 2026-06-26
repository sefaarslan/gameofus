import { createAdminClient } from "@/lib/supabase/server";
import { apiError, apiOk } from "@/lib/api";
import { corsOptions } from "@/lib/cors";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") ?? "tr";
  const validLocales = ["tr", "en", "es"];
  const safeLocale = validLocales.includes(locale) ? locale : "tr";

  const supabase = createAdminClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, slug, is_premium, sort_order")
    .eq("locale", safeLocale)
    .order("sort_order");

  if (error || !categories) {
    return apiError("INTERNAL_ERROR", "Kategoriler yüklenemedi.", 500);
  }

  return apiOk(categories);
}
