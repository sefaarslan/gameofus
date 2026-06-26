import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateToken, hashToken, verifyToken, extractToken } from "@/lib/token";
import { isRoomExpired } from "@/lib/expire";
import { apiError, apiOk } from "@/lib/api";
import { corsOptions } from "@/lib/cors";

export function OPTIONS() {
  return corsOptions();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> },
) {
  const { roomCode } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("INVALID_PAYLOAD", "Geçersiz istek gövdesi.");
  }

  const { displayName } = body as Record<string, unknown>;
  const rawBodyToken = (body as Record<string, unknown>).participantToken;
  const participantToken = extractToken(req, typeof rawBodyToken === "string" ? rawBodyToken : null);

  if (!displayName || typeof displayName !== "string" || displayName.trim().length === 0) {
    return apiError("INVALID_PAYLOAD", "İsim zorunludur.");
  }

  const supabase = createAdminClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, status, join_locked, expires_at, game_mode, question_count")
    .eq("room_code", roomCode)
    .maybeSingle();

  if (!room) return apiError("ROOM_NOT_FOUND", "Oda bulunamadı.", 404);
  if (isRoomExpired(room.expires_at)) return apiError("ROOM_EXPIRED", "Bu odanın süresi dolmuş.");

  const { data: existingParticipants } = await supabase
    .from("participants")
    .select("id, role, display_name, status, token_hash")
    .eq("room_id", room.id);

  const participants = existingParticipants ?? [];

  // Mevcut token varsa doğrula
  if (typeof participantToken === "string" && participantToken.length > 0) {
    const match = participants.find((p) => verifyToken(participantToken, p.token_hash));
    if (match) {
      return apiOk({
        roomCode,
        participant: {
          id: match.id,
          role: match.role,
          displayName: match.display_name,
          token: participantToken,
        },
        roomStatus: room.status,
      });
    }
  }

  // Yeni guest oluştur
  if (room.join_locked || participants.length >= 2) {
    return apiError("ROOM_FULL", "Bu odada iki kişi zaten var.");
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);

  const { data: guest, error: guestErr } = await supabase
    .from("participants")
    .insert({
      room_id: room.id,
      role: "guest",
      display_name: displayName.trim(),
      status: "joined",
      token_hash: tokenHash,
    })
    .select("id")
    .single();

  if (guestErr || !guest) {
    return apiError("INTERNAL_ERROR", "Odaya katılınamadı.", 500);
  }

  // Oda doldu, kilitle ve status güncelle
  await supabase
    .from("rooms")
    .update({ join_locked: true, status: "guest_joined" })
    .eq("id", room.id);

  return apiOk({
    roomCode,
    participant: {
      id: guest.id,
      role: "guest",
      displayName: displayName.trim(),
      token: rawToken,
    },
    roomStatus: "guest_joined",
  });
}
