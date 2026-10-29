// AI yorum uçlarının ortak kimlik/yetki adımları. YALNIZCA geçerli Supabase JWT kabul edilir (hesapsız web oyuncusu yorumu hiçbir
// yoldan göremez): katılımcı token'ı ya da kimliksiz istek → 403 AI_MOBILE_ONLY.

import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api";
import { bearerJwt, getAuthUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import { tokenDenied } from "@/lib/room-lookup";
import { allParticipantsConsented } from "@/lib/ai/consent";

/**
 * Odadaki HER oyuncunun AI rızası var mı? Hesaplı oyuncuda `users.ai_consent_at`, hesapsız (web) oyuncuda katılım satırındaki
 * `participants.ai_consent_at`. Yorum iki oyuncunun verisini kullandığı için biri bile eksikse yorum açılmaz.
 */
export async function bothPlayersConsented(roomId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: parts } = await supabase.from("participants").select("user_id, ai_consent_at").eq("room_id", roomId);
  const participants = parts ?? [];
  const userIds = participants.map((p) => p.user_id).filter((id): id is string => !!id);
  const userConsent: Record<string, string | null> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase.from("users").select("id, ai_consent_at").in("id", userIds);
    for (const u of users ?? []) userConsent[u.id] = u.ai_consent_at;
  }
  return allParticipantsConsented(participants, userConsent);
}

/** JWT yoksa AI_MOBILE_ONLY, geçersizse 401; geçerliyse kullanıcı. */
export async function authAiUser(req: NextRequest): Promise<AuthUser | Response> {
  if (!bearerJwt(req)) return apiError("AI_MOBILE_ONLY", "Bu özellik yalnızca mobil uygulamada.", 403);
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Oturum geçersiz, tekrar giriş yapın.", 401);
  return user;
}

export interface AiRoomContext {
  room: { id: string; status: string; expires_at: string; locale: string; relationship_type: string | null };
  me: { id: string; role: string };
}

/**
 * Odayı bulur ve kullanıcının bu odanın katılımcısı olduğunu doğrular. Oda yok / katılımcı değil / aynı hesap iki rolde
 * (JWT oyuncuyu ayıramaz) → hepsi AYNI `403 INVALID_TOKEN` (oda varlığı sızmaz; denemeler sayılır).
 */
export async function resolveAiParticipant(req: NextRequest, roomCode: string, user: AuthUser): Promise<AiRoomContext | Response> {
  const supabase = createAdminClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("id, status, expires_at, locale, relationship_type")
    .eq("room_code", roomCode)
    .maybeSingle();
  if (!room) return tokenDenied(req);

  const { data: parts } = await supabase.from("participants").select("id, role, user_id").eq("room_id", room.id);
  const mine = (parts ?? []).filter((p) => p.user_id === user.id);
  if (mine.length !== 1) return tokenDenied(req);
  return { room, me: { id: mine[0].id, role: mine[0].role } };
}
