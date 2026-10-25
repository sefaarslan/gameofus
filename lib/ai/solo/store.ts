// Solo analiz kayıtları ve coin iadesi (sunucu tarafı). Oda yorumundaki commentary-store.ts ile aynı durum makinesi:
// generating → ready | failed; takılmış kayıtlar tembel temizlenir; iade yalnızca düşüm gerçekten yapıldıysa.

import { createAdminClient } from "@/lib/supabase/server";
import { COIN_PRICES, applyCoins } from "@/lib/coins";
import type { Database } from "@/types/database.types";

export type SoloAnalysisRow = Database["public"]["Tables"]["ai_solo_analyses"]["Row"];
export type SoloAiStatus = "none" | "generating" | "ready" | "failed";

/** `generating` durumunda bu süreden uzun kalan kayıt "takılmış" sayılır (sunucu çökmesi). */
export const SOLO_STALE_AFTER_MS = 120_000;

/** Coin referansı: oturum kimliği + deneme numarası. Aynı referans iki kez uygulanmaz (idempotent); yeniden denemede yeni referans. */
export const soloCoinRef = (sessionId: string, attempt: number) => `${sessionId}:${attempt}`;

export async function refundSoloIfCharged(userId: string, sessionId: string, attempt: number): Promise<boolean> {
  const ref = soloCoinRef(sessionId, attempt);
  const supabase = createAdminClient();
  const { data: charged } = await supabase
    .from("credit_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("reason", "solo_ai")
    .eq("ref_id", ref)
    .maybeSingle();
  if (!charged) return false;
  try {
    await applyCoins(userId, COIN_PRICES.solo_ai, "solo_ai_refund", ref);
    return true;
  } catch {
    console.error("[ai-solo] coin iadesi başarısız", { attempt }); // kişisel veri yok; izlenebilir olsun
    return false;
  }
}

/** Takılmış `generating` kayıtlarını `failed` yapar ve (düşüm varsa) coin'i iade eder. */
export async function reapStaleSolo(sessionId: string): Promise<void> {
  const cutoff = new Date(Date.now() - SOLO_STALE_AFTER_MS).toISOString();
  const { data } = await createAdminClient()
    .from("ai_solo_analyses")
    .update({ status: "failed", error_kind: "stale", updated_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .eq("status", "generating")
    .lt("updated_at", cutoff)
    .select("purchased_by, attempt");
  for (const row of data ?? []) await refundSoloIfCharged(row.purchased_by, sessionId, row.attempt);
}

/** Oturumun aktif (ready ya da generating) kaydı; yoksa en son `failed` kaydı; hiç yoksa null. */
export async function currentSoloAnalysis(sessionId: string): Promise<SoloAnalysisRow | null> {
  const { data } = await createAdminClient()
    .from("ai_solo_analyses")
    .select("*")
    .eq("session_id", sessionId)
    .order("attempt", { ascending: false })
    .limit(5);
  const rows = data ?? [];
  return rows.find((r) => r.status === "ready" || r.status === "generating") ?? rows[0] ?? null;
}

/** Birden çok oturum için AI durumu (liste rozetleri için tek sorgu): ready > generating > son failed > none */
export async function soloAiStatuses(sessionIds: string[]): Promise<Map<string, SoloAiStatus>> {
  const out = new Map<string, SoloAiStatus>(sessionIds.map((id) => [id, "none"]));
  if (sessionIds.length === 0) return out;
  const { data } = await createAdminClient()
    .from("ai_solo_analyses")
    .select("session_id, status, attempt")
    .in("session_id", sessionIds)
    .order("attempt", { ascending: false });
  const rank: Record<string, number> = { ready: 3, generating: 2, failed: 1 };
  for (const r of data ?? []) {
    const cur = out.get(r.session_id) ?? "none";
    if ((rank[r.status] ?? 0) > (cur === "none" ? 0 : rank[cur])) out.set(r.session_id, r.status as SoloAiStatus);
  }
  return out;
}
