import { createAdminClient } from "@/lib/supabase/server";
import { dailyEarnStatus } from "@/lib/coins";
import { RETENTION } from "@/lib/retention";
import { PACK_CATEGORIES, computeProfile, encodeGrid, getPack, isFlag, type Flag } from "@/lib/solo";
import { nextSetAt, localDate, setNumber } from "@/lib/solo-daily";
import { getDailyPack } from "@/lib/solo-daily-server";
import { soloAiStatuses } from "@/lib/ai/solo/store";
import { SectionError } from "@/lib/overview";

/**
 * Mobil kullanıcı verisi yükleyicileri: `GET /api/users/{me,history,solo-history,ai-reports}` ve `GET /api/solo/red-flag/today`
 * ile `GET /api/users/overview` AYNI fonksiyonları çağırır (iş mantığı tek yerde; uçlar zamanla ayrışmaz).
 * Kimlik doğrulaması çağıranındır (yükleyiciler yalnızca verilen `userId` için okur). Sorgu hatası sessizce boş liste olarak yutulmaz,
 * `SectionError("INTERNAL_ERROR")` fırlatılır: aksi halde istemci geçici bir DB hatasını "veri yok" diye önbelleğe yazardı.
 */

const fail = (what: string) => new SectionError("INTERNAL_ERROR", `${what} okunamadı.`, 500);

/** `GET /api/users/me` yanıtı. */
export async function loadMe(userId: string) {
  const [{ data, error }, daily] = await Promise.all([
    createAdminClient()
      .from("users")
      .select("room_credits, tier, birth_date, ai_consent_at, ai_consent_version")
      .eq("id", userId)
      .maybeSingle(),
    dailyEarnStatus(userId),
  ]);
  if (error) throw fail("Kullanıcı kaydı");
  if (!data) throw new SectionError("INTERNAL_ERROR", "Kullanıcı kaydı bulunamadı.", 500);

  return {
    id: userId,
    coins: data.room_credits,
    tier: data.tier,
    // Günlük kazanım hakları (kayan 24 saat): { ad_reward, story_share } her biri { limit, remaining, nextAt }
    daily,
    birthDate: data.birth_date,
    // AI yorum rızası (yoksa null); mobil metin sürümü değiştiğinde yeniden rıza ister
    aiConsent: data.ai_consent_at ? { version: data.ai_consent_version, at: data.ai_consent_at } : null,
  };
}

/**
 * `GET /api/users/history` yanıtı (düz dizi, en yeni önce).
 * Kapsam: `participants.user_id = kullanıcı` olan odalar (kurucu ya da katılımcı olarak); yalnızca `created_at` son 90 gün içinde olanlar
 * (saklama temizliği odayı expires_at + userHistoryDays sonra siler, yani liste her zaman silinmemiş veridir). Listeden kaldırılanlar
 * (`participants.hidden_at`) çıkmaz.
 */
export async function loadHistory(userId: string) {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - RETENTION.userHistoryDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: mine, error: mineErr } = await supabase
    .from("participants")
    .select("id, room_id, role")
    .eq("user_id", userId)
    .is("hidden_at", null);
  if (mineErr) throw fail("Oda geçmişi");
  const myRows = mine ?? [];
  if (myRows.length === 0) return [];

  const roomIds = myRows.map((p) => p.room_id);
  const [rooms, everyone, results] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, room_code, locale, relationship_type, status, game_mode, question_count, created_at, expires_at")
      .in("id", roomIds)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("participants").select("id, room_id, role, display_name").in("room_id", roomIds),
    supabase.from("results").select("room_id, reading_score, created_at").in("room_id", roomIds),
  ]);
  if (rooms.error || everyone.error || results.error) throw fail("Oda geçmişi");

  const myByRoom = new Map(myRows.map((p) => [p.room_id, p]));
  const resultByRoom = new Map((results.data ?? []).map((r) => [r.room_id, r]));
  const now = Date.now();

  return (rooms.data ?? []).flatMap((room) => {
    const me = myByRoom.get(room.id);
    if (!me) return [];
    const partner = (everyone.data ?? []).find((p) => p.room_id === room.id && p.id !== me.id);
    const result = resultByRoom.get(room.id);
    return [
      {
        roomCode: room.room_code,
        locale: room.locale,
        relationshipType: room.relationship_type ?? null,
        gameMode: room.game_mode,
        questionCount: room.question_count,
        status: room.status,
        role: me.role,
        // Partner hesabını sildiyse ad boşalır (null)
        partnerName: partner?.display_name ?? null,
        createdAt: room.created_at,
        expiresAt: room.expires_at,
        expired: new Date(room.expires_at).getTime() < now,
        resultReady: !!result,
        readingScore: result?.reading_score ?? null,
        completedAt: result?.created_at ?? null,
      },
    ];
  });
}

/** `GET /api/users/solo-history` yanıtı: `{ items }` (tamamlanmış solo oyunlar, en yeni önce; listeden kaldırılanlar çıkmaz). */
export async function loadSoloHistory(userId: string) {
  const { data, error } = await createAdminClient()
    .from("solo_sessions")
    .select("id, game, pack_key, locale, scenario_ids, answers, coins_awarded, completed_at, set_date")
    .eq("user_id", userId)
    .eq("status", "completed")
    .is("hidden_at", null)
    .order("completed_at", { ascending: false })
    .limit(100);
  if (error) throw fail("Solo geçmişi");

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

  return { items };
}

/**
 * `GET /api/users/ai-reports` yanıtı: kullanıcının SATIN ALDIĞI AI yorum/analizlerin listesi (yeniden eskiye, düz dizi, en çok 100). İki tür:
 *  - `type: "room"`: iki kişilik oda yorumu `{ roomCode, partnerName, relationshipType, headline, createdAt }`
 *  - `type: "solo"`: solo oyun analizi `{ sessionId, gameType, pack, headline, createdAt }`
 * Listeden kaldırılanlar çıkmaz. Partnerin satın aldığı oda yorumları burada çıkmaz.
 */
export async function loadAiReports(userId: string) {
  const supabase = createAdminClient();
  const [roomRes, soloRes] = await Promise.all([
    supabase
      .from("ai_commentaries")
      .select("room_id, content, created_at")
      .eq("purchased_by", userId)
      .eq("status", "ready")
      .is("hidden_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("ai_solo_analyses")
      .select("session_id, game, content, created_at")
      .eq("purchased_by", userId)
      .eq("status", "ready")
      .is("hidden_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  if (roomRes.error || soloRes.error) throw fail("AI analizleri");
  const rooms = roomRes.data ?? [];
  const solos = soloRes.data ?? [];
  if (rooms.length === 0 && solos.length === 0) return [];

  const roomIds = rooms.map((r) => r.room_id);
  const sessionIds = solos.map((r) => r.session_id);
  const [roomInfo, parts, sessions] = await Promise.all([
    roomIds.length ? supabase.from("rooms").select("id, room_code, relationship_type").in("id", roomIds) : Promise.resolve({ data: [], error: null }),
    roomIds.length ? supabase.from("participants").select("room_id, user_id, display_name").in("room_id", roomIds) : Promise.resolve({ data: [], error: null }),
    sessionIds.length ? supabase.from("solo_sessions").select("id, pack_key").in("id", sessionIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (roomInfo.error || parts.error || sessions.error) throw fail("AI analizleri");
  const roomById = new Map((roomInfo.data ?? []).map((r) => [r.id, r]));
  const packById = new Map((sessions.data ?? []).map((s) => [s.id, s.pack_key]));
  const headlineOf = (c: unknown) => (c as { headline?: string } | null)?.headline ?? "";

  const items = [
    ...rooms.flatMap((r) => {
      const room = roomById.get(r.room_id);
      if (!room) return [];
      const partner = (parts.data ?? []).find((p) => p.room_id === r.room_id && p.user_id !== userId);
      return [
        {
          type: "room" as const,
          roomCode: room.room_code,
          partnerName: partner?.display_name ?? null,
          relationshipType: room.relationship_type,
          headline: headlineOf(r.content),
          createdAt: r.created_at,
        },
      ];
    }),
    ...solos.map((r) => ({
      type: "solo" as const,
      sessionId: r.session_id,
      gameType: r.game,
      pack: packById.get(r.session_id) ?? null,
      headline: headlineOf(r.content),
      createdAt: r.created_at,
    })),
  ];
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return items.slice(0, 100);
}

/**
 * `GET /api/solo/red-flag/today` yanıtı: bugünün Red Flag setleri (kategori başına bir set) ve kullanıcının durumu.
 * `timezone` ÇAĞIRAN tarafından `normalizeTimezone` ile doğrulanmış IANA adıdır. Kartlar burada dönmez; oynanmış kategori için `sessionId` + özet gelir.
 */
export async function loadSoloToday(userId: string, timezone: string, now = new Date()) {
  const setDate = localDate(now, timezone);
  const supabase = createAdminClient();

  const [packs, completed, reward] = await Promise.all([
    Promise.all(PACK_CATEGORIES.map(async (category) => ({ category, pack: await getDailyPack(category, setDate) }))),
    supabase
      .from("solo_sessions")
      .select("id, pack_key, scenario_ids, answers, coins_awarded, completed_at")
      .eq("user_id", userId)
      .eq("set_date", setDate)
      .eq("status", "completed"),
    supabase.from("credit_transactions").select("id").eq("user_id", userId).eq("reason", "solo_reward").eq("ref_id", `daily:${setDate}`).maybeSingle(),
  ]);
  if (completed.error || reward.error) throw fail("Günlük set");

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

  return {
    setDate,
    setNumber: setNumber(setDate),
    nextSetAt: nextSetAt(now, timezone),
    /** Bugün henüz ödül alınmadı (herhangi bir kategoriyi tamamlamak +25 verir) */
    rewardAvailable: !reward.data,
    categories,
  };
}
