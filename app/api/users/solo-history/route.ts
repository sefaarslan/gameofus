import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";
import { computeProfile, encodeGrid, isFlag, type Flag } from "@/lib/solo";
import { setNumber } from "@/lib/solo-daily";
import { soloAiStatuses } from "@/lib/ai/solo/store";

export function OPTIONS() {
  return corsOptions();
}

/** Mobil: kullanıcının tamamlanmış solo oyunları (en yeni önce; listeden kaldırılanlar çıkmaz). Bearer Supabase JWT. */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);

  const { data } = await createAdminClient()
    .from("solo_sessions")
    .select("id, game, pack_key, locale, scenario_ids, answers, coins_awarded, completed_at, set_date")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .is("hidden_at", null)
    .order("completed_at", { ascending: false })
    .limit(100);

  // AI analiz durumu (liste rozetleri için tek sorgu; N tane GET gerekmez)
  const ai = await soloAiStatuses((data ?? []).map((s) => s.id));

  const items = (data ?? []).flatMap((s) => {
    const saved = (s.answers ?? {}) as Record<string, unknown>;
    const flags = s.scenario_ids.map((id) => saved[id]);
    if (!flags.every(isFlag)) return [];
    const profile = computeProfile(flags as Flag[]);
    return [
      {
        sessionId: s.id,
        gameType: s.game,
        aiStatus: ai.get(s.id) ?? "none",
        pack: s.pack_key,
        setDate: s.set_date,
        setNumber: s.set_date ? setNumber(s.set_date) : null,
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
