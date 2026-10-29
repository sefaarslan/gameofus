// AI yorumunda rıza kuralı: yorum odadaki İKİ oyuncunun verisini kullanır, bu yüzden her ikisinin de rızası aranır.
// Saf mantık (ağ/DB yok; `scripts/test-ai.mjs` ile test edilir). Veriyi okuyan kısım: `lib/ai/access.ts` → bothPlayersConsented.

/** Web (hesapsız) oyuncunun katılma ekranında verdiği rızanın metin sürümü. Metin değişirse artır. */
export const WEB_AI_CONSENT_VERSION = "web-ai-v1";

export interface ConsentParticipant {
  user_id: string | null;
  ai_consent_at: string | null;
}

/**
 * Hesaplı oyuncunun rızası `users`'ta (`userConsent[user_id]`), hesapsız (web) oyuncunun rızası katılım satırındadır.
 * Katılımcı yoksa `false` (kimsenin rızası doğrulanamaz).
 */
export function allParticipantsConsented(
  participants: ConsentParticipant[],
  userConsent: Record<string, string | null | undefined>,
): boolean {
  if (participants.length === 0) return false;
  return participants.every((p) => (p.user_id ? !!userConsent[p.user_id] : !!p.ai_consent_at));
}
