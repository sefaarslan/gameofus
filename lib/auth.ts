import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export interface AuthUser {
  id: string;
  email: string | null;
}

/** Bearer değeri bir Supabase JWT mi (3 parça)? Oda katılımcı token'ı (64 hex) ile karışmasın. */
export function bearerJwt(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  const token = h.slice(7).trim();
  return token.split(".").length === 3 ? token : null;
}

/**
 * Mobil istemcinin Supabase oturumunu (Google/Apple girişi) doğrular. Geçersiz/süresi dolmuş/yoksa null.
 * Web anonimdir ve bu fonksiyonla tanımlanmaz.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const jwt = bearerJwt(req);
  if (!jwt) return null;
  const { data, error } = await createAdminClient().auth.getUser(jwt);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}
