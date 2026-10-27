import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";
import { PACK_CATEGORIES, computeProfile, encodeGrid, getPack, isFlag, type Flag } from "@/lib/solo";
import { localDate, nextSetAt, normalizeTimezone, setNumber } from "@/lib/solo-daily";
import { getDailyPack } from "@/lib/solo-daily-server";

export function OPTIONS() {
  return corsOptions();
}

/**
 * Mobil: bugünün Red Flag setleri (kategori başına bir set) ve kullanıcının durumu. Bearer Supabase JWT.
 * `?timezone=Europe/Istanbul` (IANA; yoksa/geçersizse Europe/Istanbul). Kartlar burada DÖNMEZ: oyun `POST /api/solo/red-flag/start`
 * ile `{ category, timezone }` gönderilerek başlatılır. Oynanmış kategori için `sessionId` + özet gelir (tam sonuç: `solo-history/{sessionId}`).
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);

  const now = new Date();
  const timezone = normalizeTimezone(req.nextUrl.searchParams.get("timezone"));
  const setDate = localDate(now, timezone);
  const supabase = createAdminClient();

  const [packs, completed, reward] = await Promise.all([
    Promise.all(PACK_CATEGORIES.map(async (category) => ({ category, pack: await getDailyPack(category, setDate) }))),
    supabase
      .from("solo_sessions")
      .select("id, pack_key, scenario_ids, answers, coins_awarded, completed_at")
      .eq("user_id", user.id)
      .eq("set_date", setDate)
      .eq("status", "completed"),
    supabase.from("credit_transactions").select("id").eq("user_id", user.id).eq("reason", "solo_reward").eq("ref_id", `daily:${setDate}`).maybeSingle(),
  ]);

  const categories = packs.flatMap(({ category, pack }) => {
    if (!pack) return [];
    const done = (completed.data ?? []).find((s) => s.pack_key === pack);
    const saved = (done?.answers ?? {}) as Record<string, unknown>;
    const flags = done ? done.scenario_ids.map((id) => saved[id]) : [];
    const played = !!done && flags.every(isFlag);
    const profile = played ? computeProfile(flags as Flag[]) : null;
    return [
      {
        category,
        pack,
        packNumber: getPack(pack)?.number ?? null,
        played,
        ...(played && done && profile
          ? { sessionId: done.id, completedAt: done.completed_at, grid: encodeGrid(flags as Flag[]), counts: profile.counts, tolerance: profile.tolerance, coinsEarned: done.coins_awarded }
          : {}),
      },
    ];
  });

  return apiOk({
    setDate,
    setNumber: setNumber(setDate),
    nextSetAt: nextSetAt(now, timezone),
    /** Bugün henüz ödül alınmadı (herhangi bir kategoriyi tamamlamak +50 verir) */
    rewardAvailable: !reward.data,
    categories,
  });
}
