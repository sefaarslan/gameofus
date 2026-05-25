import { Database } from "@/types/database.types";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Session-aware server client (anon key, respects RLS). */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component'ten çağrıldığında ignore edilir.
          }
        },
      },
    },
  );
}

/**
 * Service role client — RLS'i bypass eder.
 * Yalnızca server-side API route / server action içinde kullanılır.
 * Client bundle'a asla import edilmemelidir.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY env değişkeni tanımlı değil. " +
        ".env dosyasına ekleyin (Supabase Dashboard → Settings → API).",
    );
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  });
}
