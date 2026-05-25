import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyToken } from "@/lib/token";
import { isRoomExpired } from "@/lib/expire";
import { apiError, apiOk } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> },
) {
  const { roomCode } = await params;
  const token = req.nextUrl.searchParams.get("participantToken");

  const supabase = createAdminClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, room_code, status, game_mode, question_count, expires_at, locale")
    .eq("room_code", roomCode)
    .maybeSingle();

  if (!room) return apiError("ROOM_NOT_FOUND", "Oda bulunamadı.", 404);
  if (isRoomExpired(room.expires_at)) return apiError("ROOM_EXPIRED", "Bu odanın süresi dolmuş.");

  // Participants
  const { data: allParticipants } = await supabase
    .from("participants")
    .select("id, role, display_name, status, token_hash, completed_at")
    .eq("room_id", room.id);

  const participants = allParticipants ?? [];

  // Token ile mevcut participant'ı bul
  let me = null;
  if (token) {
    me = participants.find((p) => verifyToken(token, p.token_hash)) ?? null;
  }

  // Questions (options dahil — tek seferde yüklenir)
  const { data: roomQuestions } = await supabase
    .from("room_questions")
    .select(
      `
      round_order,
      question_id,
      questions (
        id,
        mode,
        question_text,
        question_options (
          id,
          option_text,
          sort_order
        )
      )
    `,
    )
    .eq("room_id", room.id)
    .order("round_order");

  const questions = (roomQuestions ?? []).map((rq) => {
    const q = rq.questions as {
      id: string;
      mode: string;
      question_text: string;
      question_options: Array<{ id: string; option_text: string; sort_order: number }>;
    } | null;

    return {
      roundOrder: rq.round_order,
      questionId: rq.question_id,
      mode: q?.mode ?? "secret_choice",
      questionText: q?.question_text ?? "",
      options:
        q?.question_options && q.question_options.length > 0
          ? q.question_options
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((o) => ({ id: o.id, optionText: o.option_text, sortOrder: o.sort_order }))
          : null,
    };
  });

  // Progress: bu participant'ın kaç soruya cevap verdiği
  let answeredCount = 0;
  if (me) {
    const { count } = await supabase
      .from("answers")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id)
      .eq("participant_id", me.id);
    answeredCount = count ?? 0;
  }

  return apiOk({
    room: {
      roomCode: room.room_code,
      status: room.status,
      gameMode: room.game_mode,
      questionCount: room.question_count,
      expiresAt: room.expires_at,
      locale: room.locale ?? "tr",
    },
    participant: me
      ? {
          id: me.id,
          role: me.role,
          displayName: me.display_name,
          status: me.status,
        }
      : null,
    participants: participants.map((p) => ({
      role: p.role,
      displayName: p.display_name,
      status: p.status,
    })),
    questions,
    progress: {
      answeredCount,
      totalCount: room.question_count,
    },
  });
}
