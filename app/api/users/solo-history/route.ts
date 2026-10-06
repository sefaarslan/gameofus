import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";
import { computeProfile, encodeGrid, isFlag, type Flag } from "@/lib/solo";

export function OPTIONS() {
  return corsOptions();
}

/** Mobil: kullanıcının tamamlanmış solo oyunları (en yeni önce). Bearer Supabase JWT. */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);

  const { data } = await createAdminClient()
    .from("solo_sessions")
    .select("id, pack_key, locale, scenario_ids, answers, coins_awarded, completed_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(100);

  const items = (data ?? []).flatMap((s) => {
    const saved = (s.answers ?? {}) as Record<string, unknown>;
    const flags = s.scenario_ids.map((id) => saved[id]);
    if (!flags.every(isFlag)) return [];
    const profile = computeProfile(flags as Flag[]);
    return [
      {
        sessionId: s.id,
        pack: s.pack_key,
        locale: s.locale,
        completedAt: s.completed_at,
        coinsEarned: s.coins_awarded,
        grid: encodeGrid(flags as Flag[]),
        counts: profile.counts,
        tolerance: profile.tolerance,
      },
    ];
  });

  return apiOk({ items });
}
