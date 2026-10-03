import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyToken, extractToken } from "@/lib/token";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";
import { computeProfile, encodeGrid, isFlag, type Flag } from "@/lib/solo";

export function OPTIONS() {
  return corsOptions();
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function respond(flags: Flag[]) {
  const profile = computeProfile(flags);
  return apiOk({ ...profile, grid: encodeGrid(flags) });
}

/**
 * Oturumu tamamlar: 9 cevabı doğrular, tolerans profilini hesaplar. İdempotenttir (tamamlanmış oturum aynı
 * sonucu döndürür). Doğru cevap yoktur; ödül/coin mantığı (mobil) ileride bu endpoint'e eklenecektir.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  if (!UUID_RE.test(sessionId)) return apiError("SESSION_NOT_FOUND", "Oturum bulunamadı.", 404);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return apiError("INVALID_PAYLOAD", "Geçersiz istek gövdesi.");
  }

  const token = extractToken(req, typeof body.participantToken === "string" ? body.participantToken : null);
  if (!token) return apiError("INVALID_TOKEN", "Token gereklidir.", 403);

  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from("solo_sessions")
    .select("id, token_hash, scenario_ids, answers, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) return apiError("SESSION_NOT_FOUND", "Oturum bulunamadı.", 404);
  if (!verifyToken(token, session.token_hash)) return apiError("INVALID_TOKEN", "Geçersiz token.", 403);

  // Tamamlanmış oturum: kayıtlı cevaplardan aynı sonucu döndür
  if (session.status === "completed" && session.answers && typeof session.answers === "object") {
    const saved = session.answers as Record<string, unknown>;
    const flags = session.scenario_ids.map((id) => saved[id]);
    if (flags.every(isFlag)) return respond(flags as Flag[]);
  }

  const raw = body.answers;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return apiError("INVALID_PAYLOAD", "Cevaplar gereklidir.");
  }
  const answers = raw as Record<string, unknown>;

  // Tam olarak bu oturumun 9 senaryosu, her biri geçerli bir bayrak
  const ids = session.scenario_ids;
  const keys = Object.keys(answers);
  if (keys.length !== ids.length || !ids.every((id) => id in answers)) {
    return apiError("INVALID_PAYLOAD", "Tüm kartlar cevaplanmalıdır.");
  }
  const flags = ids.map((id) => answers[id]);
  if (!flags.every(isFlag)) return apiError("INVALID_PAYLOAD", "Geçersiz bayrak değeri.");

  const clean = Object.fromEntries(ids.map((id, i) => [id, flags[i] as Flag]));
  const { error } = await supabase
    .from("solo_sessions")
    .update({ answers: clean, status: "completed", completed_at: new Date().toISOString() })
    .eq("id", session.id)
    .eq("status", "started");
  if (error) return apiError("INTERNAL_ERROR", "Sonuç kaydedilemedi.", 500);

  return respond(flags as Flag[]);
}
