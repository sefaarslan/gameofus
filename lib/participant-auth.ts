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
 * Aynı kullanıcı aynı odada iki rolde de katılmışsa (kendi odasına kendi hesabıyla girmek): okuma uçlarında ilk eşleşen
 * döner; yazma uçlarında `requireUnique` ile eşleşme sayılmaz (token'ı olan taraf token yoluyla her zaman doğru rolü bulur).
 */
export type JwtStatus = "none" | "invalid" | "valid";

export async function findParticipant<T extends ParticipantAuthRow>(
  req: NextRequest,
  token: string | null,
  participants: T[],
  options: { requireUnique?: boolean } = {},
): Promise<{ participant: T | null; viaUser: boolean; jwt: JwtStatus }> {
  if (token) {
    const match = participants.find((p) => verifyToken(token, p.token_hash));
    if (match) return { participant: match, viaUser: false, jwt: "none" };
  }
  if (bearerJwt(req)) {
    const user = await getAuthUser(req);
    if (!user) return { participant: null, viaUser: false, jwt: "invalid" };
    const matches = participants.filter((p) => p.user_id === user.id);
    // Yazma uçlarında (submit-turn/complete) aynı hesap odada iki rolde de varsa (kendi odasına kendi hesabıyla katılmak)
    // JWT hangi oyuncu olduğunu belirleyemez: yanlış oyuncu adına yazmamak için eşleşme sayılmaz (token yolu yine çalışır).
    if (options.requireUnique && matches.length > 1) return { participant: null, viaUser: false, jwt: "valid" };
    const match = matches[0];
    return { participant: match ?? null, viaUser: !!match, jwt: "valid" };
  }
  return { participant: null, viaUser: false, jwt: "none" };
}
