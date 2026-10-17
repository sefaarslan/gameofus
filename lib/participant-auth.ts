import { NextRequest } from "next/server";
import { bearerJwt, getAuthUser } from "@/lib/auth";
import { verifyToken } from "@/lib/token";

export interface ParticipantAuthRow {
  id: string;
  token_hash: string;
  user_id: string | null;
}

/**
 * İsteği yapan katılımcıyı bulur. Önce katılımcı token'ı (web ve mobilde cihazdaki token), yoksa/eşleşmezse giriş yapmış
 * mobil kullanıcının Supabase JWT'si: `participants.user_id` ile eşleşen katılımcı o kullanıcıdır (başka cihazda ya da
 * yeniden kurulumdan sonra token olmadan geçmişi açmak için). Token yolu öncelikli olduğu için normal oyun akışında
 * JWT doğrulaması (ek ağ turu) yapılmaz.
 *
 * Aynı kullanıcı aynı odada iki rolde de katılmışsa (kendi odasına kendi hesabıyla girmek) ilk eşleşen döner; token'ı olan
 * taraf token yoluyla her zaman doğru rolü bulur.
 */
export async function findParticipant<T extends ParticipantAuthRow>(
  req: NextRequest,
  token: string | null,
  participants: T[],
): Promise<{ participant: T | null; viaUser: boolean }> {
  if (token) {
    const match = participants.find((p) => verifyToken(token, p.token_hash));
    if (match) return { participant: match, viaUser: false };
  }
  if (bearerJwt(req)) {
    const user = await getAuthUser(req);
    if (user) {
      const match = participants.find((p) => p.user_id === user.id);
      if (match) return { participant: match, viaUser: true };
    }
  }
  return { participant: null, viaUser: false };
}
