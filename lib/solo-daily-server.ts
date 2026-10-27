import { createAdminClient } from "@/lib/supabase/server";
import { RED_FLAG_CARD_COUNT, RED_FLAG_GAME, getPack, type PackCategory } from "@/lib/solo";
import { addDays, pickDailyPack } from "@/lib/solo-daily";

// Günlük havuz: veritabanında 9 aktif senaryosu olan setler. Yeni set içeriği eklemek kod değişikliği gerektirmez.
// Havuz nadiren değişir: sunucu örneği başına 10 dk bellekte tutulur.
const POOL_TTL_MS = 10 * 60 * 1000;
const poolCache = new Map<string, { at: number; keys: string[] }>();

async function loadPool(category: PackCategory): Promise<string[]> {
  const hit = poolCache.get(category);
  if (hit && Date.now() - hit.at < POOL_TTL_MS) return hit.keys;
  const { data } = await createAdminClient()
    .from("solo_scenarios")
    .select("pack_key")
    .eq("game", RED_FLAG_GAME)
    .eq("locale", "tr")
    .eq("is_active", true)
    .like("pack_key", `${category}-%`)
    .limit(1000);
  const counts = new Map<string, number>();
  for (const r of data ?? []) if (r.pack_key) counts.set(r.pack_key, (counts.get(r.pack_key) ?? 0) + 1);
  const keys = [...counts]
    .filter(([key, n]) => n === RED_FLAG_CARD_COUNT && getPack(key))
    .map(([key]) => key)
    .sort((a, b) => getPack(a)!.number - getPack(b)!.number);
  poolCache.set(category, { at: Date.now(), keys });
  return keys;
}

/**
 * O gün (set günü) ve kategori için set anahtarı. İlk istek seçimi `solo_daily_sets`'e yazar; sonraki istekler (ve
 * havuz değişse bile) aynı sonucu görür. Havuz boşsa null.
 */
export async function getDailyPack(category: PackCategory, setDate: string): Promise<string | null> {
  const supabase = createAdminClient();
  const read = async () => {
    const { data } = await supabase.from("solo_daily_sets").select("pack_key").eq("category", category).eq("set_date", setDate).maybeSingle();
    return data?.pack_key ?? null;
  };
  const existing = await read();
  if (existing) return existing;

  const [pool, yesterday] = await Promise.all([
    loadPool(category),
    supabase.from("solo_daily_sets").select("pack_key").eq("category", category).eq("set_date", addDays(setDate, -1)).maybeSingle(),
  ]);
  const pick = pickDailyPack(pool, setDate, yesterday.data?.pack_key ?? null);
  if (!pick) return null;
  await supabase.from("solo_daily_sets").upsert({ category, set_date: setDate, pack_key: pick }, { onConflict: "category,set_date", ignoreDuplicates: true });
  // Eşzamanlı iki istek farklı seçim yazmaya çalışırsa kazanan satır esastır
  return (await read()) ?? pick;
}
