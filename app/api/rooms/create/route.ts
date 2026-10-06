import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateToken, hashToken } from "@/lib/token";
import { corsOptions } from "@/lib/cors";

export function OPTIONS() {
  return corsOptions();
}
import { generateUniqueRoomCode } from "@/lib/room-code";
import { getRoomExpiry } from "@/lib/expire";
import { apiError, apiOk } from "@/lib/api";
import { isRelationshipType } from "@/lib/relationship";
import { checkRateLimit, ipHashFor } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth";
import { COIN_PRICES, CoinError, applyCoins } from "@/lib/coins";

const RATE_LIMIT = { perHour: 10, perDay: 50 };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function selectQuestionCounts(
  gameMode: string,
  questionCount: number,
): Array<{ mode: string; count: number }> {
  if (gameMode !== "mixed") {
    return [{ mode: gameMode, count: questionCount }];
  }
  // Karma: equal distribution, secret_choice gets remainder
  const base = Math.floor(questionCount / 3);
  const remainder = questionCount - base * 2;
  return [
    { mode: "secret_choice", count: remainder },
    { mode: "prediction", count: base },
    { mode: "orderline", count: base },
  ];
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_PAYLOAD", "Geçersiz istek gövdesi.");
  }

  const { displayName, partnerName, gameMode, questionCount, locale, categoryId, relationshipType, platform } =
    body as Record<string, unknown>;

  // Mobil (giriş zorunlu): geçerli Supabase JWT'si gerekir; oda coin ile açılır (−250). Web anonimdir ve ücretsiz kalır.
  const authUser = await getAuthUser(req);
  if (platform === "mobile" && !authUser) {
    return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);
  }

  const selectedCategoryId = typeof categoryId === "string" && categoryId.length > 0
    ? categoryId
    : null;

  if (!displayName || typeof displayName !== "string" || displayName.trim().length === 0) {
    return apiError("INVALID_PAYLOAD", "İsim zorunludur.");
  }
  // relationshipType opsiyonel (alanı henüz göndermeyen eski mobil build'ler için), ama gönderildiyse geçerli olmalı
  if (relationshipType != null && !isRelationshipType(relationshipType)) {
    return apiError("INVALID_PAYLOAD", "Geçersiz ilişki türü.");
  }
  const selectedRelationship = isRelationshipType(relationshipType) ? relationshipType : null;

  const validModes = ["secret_choice", "prediction", "orderline", "mixed"];
  const mode = typeof gameMode === "string" && validModes.includes(gameMode)
    ? gameMode
    : "secret_choice";

  const count = typeof questionCount === "number" && [5, 10].includes(questionCount)
    ? questionCount
    : 5;

  const roomLocale = typeof locale === "string" ? locale : "en";

  // Rate limiting
  const allowed = await checkRateLimit(ipHashFor(req), "create_room", RATE_LIMIT);
  if (!allowed) {
    return apiError("RATE_LIMITED", "Kısa sürede çok fazla oda oluşturdunuz.", 429);
  }

  const supabase = createAdminClient();

  // Seçilen kategori bu ilişki türüne uygun mu (sunucu tarafı doğrulama)
  if (selectedCategoryId && selectedRelationship) {
    const { data: cat } = await supabase
      .from("categories")
      .select("relationship_types")
      .eq("id", selectedCategoryId)
      .maybeSingle();
    if (!cat || !cat.relationship_types.includes(selectedRelationship)) {
      return apiError("INVALID_PAYLOAD", "Bu kategori seçilen ilişki türüne uygun değil.");
    }
  }

  // Room code
  const roomCode = await generateUniqueRoomCode(async (code) => {
    const { data } = await supabase
      .from("rooms")
      .select("id")
      .eq("room_code", code)
      .maybeSingle();
    return !!data;
  });

  // Sorular — her mod için ayrı random seçim.
  // Havuz: oda diline ait, aktif, ücretsiz ve ilişki türüne uygun kategoriler. Seçilen kategori önceliklidir;
  // yetmezse yalnızca aynı güvenli havuzdan tamamlanır (başka ilişki türünün sorusu asla gelmez).
  const questionGroups = selectQuestionCounts(mode, count);
  const selectedQuestions: Array<{ id: string; mode: string }> = [];

  const safePoolFor = async (loc: string): Promise<string[]> => {
    const { data } = await supabase
      .from("categories")
      .select("id, relationship_types, is_premium")
      .eq("locale", loc);
    return (data ?? [])
      .filter((c) => !c.is_premium && (!selectedRelationship || c.relationship_types.includes(selectedRelationship)))
      .map((c) => c.id);
  };

  const fetchIds = async (
    loc: string,
    qMode: string,
    categoryIds: string[],
    exclude: Set<string>,
  ): Promise<string[]> => {
    if (categoryIds.length === 0) return [];
    // Tüm havuz çekilir: sıralamasız limit(kısa) hep aynı ilk satırları döndürürdü
    const { data } = await supabase
      .from("questions")
      .select("id")
      .eq("mode", qMode as "secret_choice" | "prediction" | "orderline" | "mixed")
      .eq("locale", loc)
      .eq("is_active", true)
      .in("category_id", categoryIds)
      .limit(1000);
    return shuffle((data ?? []).map((r) => r.id).filter((id) => !exclude.has(id)));
  };

  const safePools = new Map<string, string[]>();
  const getSafePool = async (loc: string) => {
    if (!safePools.has(loc)) safePools.set(loc, await safePoolFor(loc));
    return safePools.get(loc)!;
  };

  for (const { mode: qMode, count: qCount } of questionGroups) {
    const chosen: string[] = [];
    const taken = new Set<string>(selectedQuestions.map((q) => q.id));

    // 1) Seçilen kategori
    if (selectedCategoryId) {
      const ids = await fetchIds(roomLocale, qMode, [selectedCategoryId], taken);
      chosen.push(...ids.slice(0, qCount));
    }

    // 2) Yetmezse güvenli havuzdan tamamla; 3) hâlâ yetmezse 'tr' güvenli havuzu
    const locales = roomLocale === "tr" ? ["tr"] : [roomLocale, "tr"];
    for (const loc of locales) {
      if (chosen.length >= qCount) break;
      const exclude = new Set<string>([...taken, ...chosen]);
      const pool = await getSafePool(loc);
      const ids = await fetchIds(loc, qMode, pool, exclude);
      chosen.push(...ids.slice(0, qCount - chosen.length));
    }

    if (chosen.length < qCount) {
      return apiError("INTERNAL_ERROR", "Yeterli soru bulunamadı.", 500);
    }
    selectedQuestions.push(...chosen.map((id) => ({ id, mode: qMode })));
  }

  // Shuffle final question list
  for (let i = selectedQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedQuestions[i], selectedQuestions[j]] = [
      selectedQuestions[j],
      selectedQuestions[i],
    ];
  }

  const expiresAt = getRoomExpiry(false);

  // Coin: oda açılmadan önce düşülür (idempotent: ref = oda kodu); sonraki bir adım başarısız olursa iade edilir
  if (authUser) {
    try {
      await applyCoins(authUser.id, -COIN_PRICES.room_create, "room_create", roomCode);
    } catch (e) {
      if (e instanceof CoinError && e.code === "INSUFFICIENT_COINS") {
        return apiError("INSUFFICIENT_COINS", "Oda açmak için yeterli coin yok.", 402);
      }
      return apiError("INTERNAL_ERROR", "Coin düşülemedi.", 500);
    }
  }
  const refundCoins = async () => {
    if (!authUser) return;
    try {
      await applyCoins(authUser.id, COIN_PRICES.room_create, "room_create_refund", roomCode);
    } catch {
      /* iade başarısız olursa kayıt credit_transactions'ta düşüm olarak kalır; elle düzeltilir */
    }
  };

  // Room insert
  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .insert({
      room_code: roomCode,
      game_mode: mode as "secret_choice" | "prediction" | "orderline" | "mixed",
      question_count: count,
      locale: roomLocale,
      expires_at: expiresAt.toISOString(),
      ...(authUser ? { user_id: authUser.id } : {}),
      ...(selectedCategoryId ? { category_id: selectedCategoryId } : {}),
      ...(selectedRelationship ? { relationship_type: selectedRelationship } : {}),
    })
    .select("id")
    .single();

  if (roomErr || !room) {
    await refundCoins();
    return apiError("INTERNAL_ERROR", "Oda oluşturulamadı.", 500);
  }

  // Owner participant
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);

  const { data: participant, error: partErr } = await supabase
    .from("participants")
    .insert({
      room_id: room.id,
      role: "owner",
      display_name: displayName.trim(),
      status: "joined",
      token_hash: tokenHash,
      ...(authUser ? { user_id: authUser.id } : {}),
    })
    .select("id")
    .single();

  if (partErr || !participant) {
    await refundCoins();
    return apiError("INTERNAL_ERROR", "Katılımcı oluşturulamadı.", 500);
  }

  // rooms.owner_id güncelle
  await supabase.from("rooms").update({ owner_id: participant.id }).eq("id", room.id);

  // room_questions
  const roomQuestionsPayload = selectedQuestions.map((q, idx) => ({
    room_id: room.id,
    question_id: q.id,
    round_order: idx + 1,
  }));

  const { error: rqErr } = await supabase.from("room_questions").insert(roomQuestionsPayload);
  if (rqErr) {
    await refundCoins();
    return apiError("INTERNAL_ERROR", "Sorular atanamadı.", 500);
  }

  const baseUrl = process.env.APP_BASE_URL ?? "";
  return apiOk(
    {
      roomCode,
      roomUrl: `${baseUrl}/game/room/${roomCode}`,
      participant: {
        id: participant.id,
        role: "owner",
        displayName: displayName.trim(),
        partnerName: partnerName ?? null,
        token: rawToken,
      },
    },
    201,
  );
}
