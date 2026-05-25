import crypto from "crypto";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateToken, hashToken } from "@/lib/token";
import { generateUniqueRoomCode } from "@/lib/room-code";
import { getRoomExpiry } from "@/lib/expire";
import { apiError, apiOk } from "@/lib/api";

const RATE_LIMIT_HOUR = 10;
const RATE_LIMIT_DAY = 50;

async function checkRateLimit(ipHash: string) {
  const supabase = createAdminClient();
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const { count: hourCount } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("key", ipHash)
    .eq("action", "create_room")
    .gte("created_at", hourAgo.toISOString());

  if ((hourCount ?? 0) >= RATE_LIMIT_HOUR) return false;

  const { count: dayCount } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("key", ipHash)
    .eq("action", "create_room")
    .gte("created_at", dayAgo.toISOString());

  if ((dayCount ?? 0) >= RATE_LIMIT_DAY) return false;

  await supabase.from("rate_limits").insert({
    key: ipHash,
    action: "create_room",
    count: 1,
    window_start: now.toISOString(),
  });

  return true;
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

  const { displayName, partnerName, gameMode, questionCount, locale } =
    body as Record<string, unknown>;

  if (!displayName || typeof displayName !== "string" || displayName.trim().length === 0) {
    return apiError("INVALID_PAYLOAD", "İsim zorunludur.");
  }
  const validModes = ["secret_choice", "prediction", "orderline", "mixed"];
  const mode = typeof gameMode === "string" && validModes.includes(gameMode)
    ? gameMode
    : "secret_choice";

  const count = typeof questionCount === "number" && [5, 10].includes(questionCount)
    ? questionCount
    : 5;

  const roomLocale = typeof locale === "string" ? locale : "tr";

  // Rate limiting
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0];
  const ip = forwarded || req.headers.get("x-real-ip") || "127.0.0.1";
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex").substring(0, 32);

  const allowed = await checkRateLimit(ipHash);
  if (!allowed) {
    return apiError("RATE_LIMITED", "Kısa sürede çok fazla oda oluşturdunuz.", 429);
  }

  const supabase = createAdminClient();

  // Room code
  const roomCode = await generateUniqueRoomCode(async (code) => {
    const { data } = await supabase
      .from("rooms")
      .select("id")
      .eq("room_code", code)
      .maybeSingle();
    return !!data;
  });

  // Sorular — her mod için ayrı random seçim
  const questionGroups = selectQuestionCounts(mode, count);
  const selectedQuestions: Array<{ id: string; mode: string }> = [];

  for (const { mode: qMode, count: qCount } of questionGroups) {
    const { data: qs, error } = await supabase
      .from("questions")
      .select("id, mode")
      .eq("mode", qMode as "secret_choice" | "prediction" | "orderline" | "mixed")
      .eq("locale", roomLocale)
      .eq("is_active", true)
      .limit(qCount * 3); // fazladan çek, shuffle için

    if (error || !qs || qs.length < qCount) {
      return apiError("INTERNAL_ERROR", "Yeterli soru bulunamadı.", 500);
    }

    // Fisher-Yates shuffle, ilk qCount'u al
    for (let i = qs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [qs[i], qs[j]] = [qs[j], qs[i]];
    }
    selectedQuestions.push(...qs.slice(0, qCount));
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

  // Room insert
  const { data: room, error: roomErr } = await supabase
    .from("rooms")
    .insert({
      room_code: roomCode,
      game_mode: mode as "secret_choice" | "prediction" | "orderline" | "mixed",
      question_count: count,
      locale: roomLocale,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (roomErr || !room) {
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
    })
    .select("id")
    .single();

  if (partErr || !participant) {
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
