import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";

export function OPTIONS() {
  return corsOptions();
}

/**
 * Mobil: AI yorum rızası. Gövde: `{ "version": "<rıza metni sürümü>" }` (mobil kendi metin sürümünü gönderir, sunucu yalnızca saklar).
 * Rıza olmadan `POST /api/rooms/{roomCode}/ai-commentary` `403 AI_CONSENT_REQUIRED` döner.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return apiError("INVALID_PAYLOAD", "Geçersiz istek gövdesi.");
  }
  const version = typeof body.version === "string" ? body.version.trim() : "";
  if (!/^[A-Za-z0-9._-]{1,32}$/.test(version)) {
    return apiError("INVALID_PAYLOAD", "Geçersiz rıza sürümü (1-32 karakter: harf, rakam, . _ -).");
  }

  const { error } = await createAdminClient()
    .from("users")
    .update({ ai_consent_at: new Date().toISOString(), ai_consent_version: version })
    .eq("id", user.id);
  if (error) return apiError("INTERNAL_ERROR", "Rıza kaydedilemedi.", 500);
  return apiOk({ ok: true });
}
