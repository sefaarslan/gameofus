import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateToken, hashToken } from "@/lib/token";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";
import { checkRateLimit, ipHashFor } from "@/lib/rate-limit";
import { RED_FLAG_CARD_COUNT, RED_FLAG_GAME } from "@/lib/solo";

export function OPTIONS() {
  return corsOptions();
}

const LOCALES = ["tr", "en", "es"];
const RATE_LIMIT = { perHour: 30, perDay: 100 };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Scenario = { id: string; scenario_text: string; insight_tag: string };

// Senaryo havuzu nadiren değişir: sunucu örneği başına 10 dk bellekte tutulur (her oyun başlangıcında bir DB turu azalır).
const POOL_TTL_MS = 10 * 60 * 1000;
const poolCache = new Map<string, { at: number; rows: Scenario[] }>();

async function loadPool(locale: string): Promise<Scenario[] | null> {
  const hit = poolCache.get(locale);
  if (hit && Date.now() - hit.at < POOL_TTL_MS) return hit.rows;
  const { data } = await createAdminClient()
    .from("solo_scenarios")
    .select("id, scenario_text, insight_tag")
    .eq("game", RED_FLAG_GAME)
    .eq("locale", locale)
    .eq("is_active", true)
    .limit(1000);
  if (!data || data.length < RED_FLAG_CARD_COUNT) return null;
  poolCache.set(locale, { at: Date.now(), rows: data });
  return data;
}

/** Her temadan en az bir senaryo (kapsayıcı profil), kalan kartlar kalan havuzdan rastgele. */
function pickNine(pool: Scenario[]): Scenario[] {
  const byTag = new Map<string, Scenario[]>();
  for (const sc of shuffle(pool)) byTag.set(sc.insight_tag, [...(byTag.get(sc.insight_tag) ?? []), sc]);
  const picked: Scenario[] = [];
  for (const list of byTag.values()) {
    if (picked.length < RED_FLAG_CARD_COUNT) picked.push(list.shift()!);
  }
  const rest = shuffle([...byTag.values()].flat());
  picked.push(...rest.slice(0, RED_FLAG_CARD_COUNT - picked.length));
  return shuffle(picked);
}

/**
 * Red Flag Mayın Tarlası oturumu başlatır: sunucu 9 senaryoyu seçer, anonim token üretir.
 * Cevaplar kart geçişlerinde sunucuya gitmez; tek istekle `complete`'te gelir.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* gövde opsiyonel */
  }

  const locale = typeof body.locale === "string" && LOCALES.includes(body.locale) ? body.locale : "en";
  const platform = body.platform === "mobile" ? "mobile" : "web";

  // Sınır kontrolü ve senaryo havuzu birbirinden bağımsız: paralel (havuz ayrıca bellekte önbelleğe alınır)
  const [allowed, pool] = await Promise.all([checkRateLimit(ipHashFor(req), "solo_start", RATE_LIMIT), loadPool(locale)]);
  if (!allowed) return apiError("RATE_LIMITED", "Kısa sürede çok fazla oyun başlattınız.", 429);

  if (!pool || pool.length < RED_FLAG_CARD_COUNT) {
    return apiError("INTERNAL_ERROR", "Yeterli senaryo bulunamadı.", 500);
  }

  const supabase = createAdminClient();
  const scenarios = pickNine(pool);
  const token = generateToken();

  const { data: session, error } = await supabase
    .from("solo_sessions")
    .insert({
      game: RED_FLAG_GAME,
      locale,
      platform,
      token_hash: hashToken(token),
      scenario_ids: scenarios.map((s) => s.id),
    })
    .select("id")
    .single();

  if (error || !session) return apiError("INTERNAL_ERROR", "Oyun başlatılamadı.", 500);

  return apiOk(
    {
      sessionId: session.id,
      token,
      locale,
      scenarios: scenarios.map((s) => ({ id: s.id, text: s.scenario_text })),
    },
    201,
  );
}
