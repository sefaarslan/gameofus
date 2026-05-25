import { Database } from "@/types/database.types";
import { SupabaseDBClient } from "@/types/helper.types";
import { createBrowserClient } from "@supabase/ssr";

export function createClient(): SupabaseDBClient {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
