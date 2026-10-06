import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";
import { computeProfile, encodeGrid, isFlag, type Flag } from "@/lib/solo";

export function OPTIONS() {
  return corsOptions();
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mobil: kullanıcının tek bir solo oyununun ayrıntısı (kart sırasıyla senaryo metni + seçilen bayrak). Yalnızca sahibi görür. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);
  const { sessionId } = await params;
  if (!UUID_RE.test(sessionId)) return apiError("SESSION_NOT_FOUND", "Oturum bulunamadı.", 404);

  const supabase = createAdminClient();
  const { data: s } = await supabase
    .from("solo_sessions")
    .select("id, pack_key, locale, scenario_ids, answers, coins_awarded, completed_at, status, user_id")
    .eq("id", sessionId)
    .maybeSingle();
  // Başkasının oturumu "yok" gibi davranır
  if (!s || s.user_id !== user.id || s.status !== "completed") return apiError("SESSION_NOT_FOUND", "Oturum bulunamadı.", 404);

  const saved = (s.answers ?? {}) as Record<string, unknown>;
  const flags = s.scenario_ids.map((id) => saved[id]);
  if (!flags.every(isFlag)) return apiError("SESSION_NOT_FOUND", "Oturum bulunamadı.", 404);

  const { data: rows } = await supabase.from("solo_scenarios").select("id, scenario_text").in("id", s.scenario_ids);
  const text = new Map((rows ?? []).map((r) => [r.id, r.scenario_text]));
  const profile = computeProfile(flags as Flag[]);

  return apiOk({
    sessionId: s.id,
    pack: s.pack_key,
    locale: s.locale,
    completedAt: s.completed_at,
    coinsEarned: s.coins_awarded,
    grid: encodeGrid(flags as Flag[]),
    counts: profile.counts,
    tolerance: profile.tolerance,
    cards: s.scenario_ids.map((id, i) => ({ id, text: text.get(id) ?? "", flag: flags[i] })),
  });
}
