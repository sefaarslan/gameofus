import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateToken, hashToken } from "@/lib/token";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOk } from "@/lib/api";
import { checkRateLimit, ipHashFor } from "@/lib/rate-limit";
import { PACK_CATEGORIES, RED_FLAG_CARD_COUNT, RED_FLAG_GAME, getPack, type PackCategory } from "@/lib/solo";
import { localDate, nextSetAt, normalizeTimezone, setNumber } from "@/lib/solo-daily";
import { getDailyPack } from "@/lib/solo-daily-server";
import { getAuthUser } from "@/lib/auth";

export function OPTIONS() {
  return corsOptions();
}

const LOCALES = ["tr", "en", "es"];
const RATE_LIMIT = { perHour: 30, perDay: 100 };

type Scenario = { id: string; scenario_text: string; pack_position: number };

// Setler sabit ve nadiren değişir: sunucu örneği başına 10 dk bellekte tutulur (her oyun başlangıcında bir DB turu azalır).
const POOL_TTL_MS = 10 * 60 * 1000;
const packCache = new Map<string, { at: number; rows: Scenario[] }>();

/** Setin 9 kartı, sabit sırayla (pack_position). Set eksikse null. */
async function loadPack(packKey: string, locale: string): Promise<Scenario[] | null> {
  const cacheKey = `${packKey}:${locale}`;
  const hit = packCache.get(cacheKey);
  if (hit && Date.now() - hit.at < POOL_TTL_MS) return hit.rows;
  const { data } = await createAdminClient()
    .from("solo_scenarios")
    .select("id, scenario_text, pack_position")
    .eq("game", RED_FLAG_GAME)
    .eq("pack_key", packKey)
    .eq("locale", locale)
    .eq("is_active", true)
    .order("pack_position", { ascending: true })
    .limit(50);
  if (!data || data.length !== RED_FLAG_CARD_COUNT) return null;
  packCache.set(cacheKey, { at: Date.now(), rows: data as Scenario[] });
  return data as Scenario[];
}

/**
 * Red Flag Mayın Tarlası oturumu başlatır: sunucu 9 senaryoyu seçer, anonim token üretir.
 * Cevaplar kart geçişlerinde sunucuya gitmez; tek istekle `complete`'te gelir.
 *
 * İki kip: `pack` (serbest set seçimi; web) ve `category` + `timezone` (günlük set; YALNIZCA mobil, giriş zorunlu):
 * sunucu o günün setini seçer ve kullanıcı aynı günün aynı kategorisini yalnızca bir kez tamamlayabilir.
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

  // Mobil (giriş zorunlu): geçerli Supabase JWT'si gerekir; oturum kullanıcıya bağlanır (coin ödülü, geçmiş). Web anonimdir.
  const authUser = await getAuthUser(req);
  if (platform === "mobile" && !authUser) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);

  // Günlük kip: set gövdeden değil sunucudan gelir
  const daily = body.category !== undefined && body.pack === undefined;
  let pack = daily ? null : getPack(body.pack);
  let dailyInfo: { category: PackCategory; setDate: string; timezone: string } | null = null;
  if (daily) {
    if (platform !== "mobile") return apiError("DAILY_MOBILE_ONLY", "Günlük set yalnızca mobil uygulamada oynanır.", 403);
    if (!PACK_CATEGORIES.includes(body.category as PackCategory)) return apiError("INVALID_PAYLOAD", "Geçerli bir kategori seçilmelidir.");
    const category = body.category as PackCategory;
    const timezone = normalizeTimezone(body.timezone);
    const setDate = localDate(new Date(), timezone);
    const key = await getDailyPack(category, setDate);
    pack = getPack(key);
    if (!pack) return apiError("PACK_UNAVAILABLE", "Bugün için set hazır değil.", 404);
    dailyInfo = { category, setDate, timezone };
  }
  if (!pack) return apiError("INVALID_PAYLOAD", "Geçerli bir set seçilmelidir.");
  // Web yalnızca açık setleri oynatır; diğerleri mobilde açılacak
  if (platform === "web" && !pack.webAvailable) return apiError("PACK_UNAVAILABLE", "Bu set mobil uygulamada açılacak.", 403);

  // Sınır kontrolü, set kartları ve (günlük kipte) "bugün zaten oynadı mı" birbirinden bağımsız: paralel
  const [allowed, scenarios, played] = await Promise.all([
    checkRateLimit(ipHashFor(req), "solo_start", RATE_LIMIT),
    loadPack(pack.key, locale),
    dailyInfo && authUser
      ? createAdminClient()
          .from("solo_sessions")
          .select("id")
          .eq("user_id", authUser.id)
          .eq("pack_key", pack.key)
          .eq("set_date", dailyInfo.setDate)
          .eq("status", "completed")
          .maybeSingle()
      : Promise.resolve(null),
  ]);
  if (!allowed) return apiError("RATE_LIMITED", "Kısa sürede çok fazla oyun başlattınız.", 429);
  if (played?.data) return apiError("ALREADY_PLAYED_TODAY", "Bugünün setini zaten tamamladın.", 409, { sessionId: played.data.id });
  // İçeriği henüz hazır olmayan set (ör. 108+): web/mobil fark etmez, oynanamaz
  if (!scenarios) return apiError("PACK_UNAVAILABLE", "Bu set henüz hazır değil.", 404);

  const supabase = createAdminClient();
  const token = generateToken();

  const { data: session, error } = await supabase
    .from("solo_sessions")
    .insert({
      game: RED_FLAG_GAME,
      locale,
      platform,
      pack_key: pack.key,
      ...(dailyInfo ? { set_date: dailyInfo.setDate } : {}),
      ...(authUser && platform === "mobile" ? { user_id: authUser.id } : {}),
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
      pack: pack.key,
      scenarios: scenarios.map((s) => ({ id: s.id, text: s.scenario_text })),
      ...(dailyInfo
        ? {
            category: dailyInfo.category,
            setDate: dailyInfo.setDate,
            setNumber: setNumber(dailyInfo.setDate),
            nextSetAt: nextSetAt(new Date(), dailyInfo.timezone),
          }
        : {}),
    },
    201,
  );
}
