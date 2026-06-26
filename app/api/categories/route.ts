import { createAdminClient } from "@/lib/supabase/server";
import { apiError, apiOk } from "@/lib/api";
import { corsOptions } from "@/lib/cors";

export function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  const supabase = createAdminClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, slug, is_premium, sort_order")
    .order("sort_order");

  if (error || !categories) {
    return apiError("INTERNAL_ERROR", "Kategoriler yüklenemedi.", 500);
  }

  return apiOk(categories);
}
