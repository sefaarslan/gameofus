// AI yorum kayıtları ve coin iadesi yardımcıları (sunucu tarafı).

import { createAdminClient } from "@/lib/supabase/server";
import { COIN_PRICES, applyCoins } from "@/lib/coins";
import type { Database } from "@/types/database.types";

export type CommentaryRow = Database["public"]["Tables"]["ai_commentaries"]["Row"];

/** `generating` durumunda bu süreden uzun kalan kayıt "takılmış" sayılır (sunucu çökmesi). */
export const STALE_AFTER_MS = 120_000;

/** Coin referansı: oda kodu + deneme numarası. Aynı referans iki kez uygulanmaz (idempotent). */
export const coinRef = (roomCode: string, attempt: number) => `${roomCode}:${attempt}`;

/**
 * Yalnızca kullanıcıdan GERÇEKTEN coin düşüldüyse iade eder (düşüm kaydı yoksa iade etmez: çökme "kayıt açıldı ama coin düşmeden"
 * anında olduysa bedava coin vermeyiz). İade de idempotenttir. Başarıyla iade edildiyse (ya da zaten edilmişse) true.
 */
export async function refundIfCharged(userId: string, roomCode: string, attempt: number): Promise<boolean> {
  const ref = coinRef(roomCode, attempt);
  const supabase = createAdminClient();
  const { data: charged } = await supabase
    .from("credit_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("reason", "ai_commentary")
    .eq("ref_id", ref)
    .maybeSingle();
  if (!charged) return false;
  try {
    await applyCoins(userId, COIN_PRICES.ai_commentary, "ai_commentary_refund", ref);
    return true;
  } catch {
    console.error("[ai] coin iadesi başarısız", { attempt }); // kişisel veri yok; izlenebilir olsun
    return false;
  }
}

/** Takılmış `generating` kayıtlarını `failed` yapar ve (düşüm varsa) coin'i iade eder. */
export async function reapStale(roomId: string, roomCode: string): Promise<void> {
  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString();
  const { data } = await supabase
    .from("ai_commentaries")
    .update({ status: "failed", error_kind: "stale", updated_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("status", "generating")
    .lt("updated_at", cutoff)
    .select("purchased_by, attempt");
  for (const row of data ?? []) await refundIfCharged(row.purchased_by, roomCode, row.attempt);
}

/** Odanın aktif (ready ya da generating) kaydı; yoksa en son `failed` kaydı; hiç yoksa null. */
export async function currentCommentary(roomId: string): Promise<CommentaryRow | null> {
  const { data } = await createAdminClient()
    .from("ai_commentaries")
    .select("*")
    .eq("room_id", roomId)
    .order("attempt", { ascending: false })
    .limit(5);
  const rows = data ?? [];
  return rows.find((r) => r.status === "ready" || r.status === "generating") ?? rows[0] ?? null;
}
