import crypto from "crypto";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/** İstek IP'sinin kısaltılmış SHA-256 özeti (ham IP saklanmaz). */
export function ipHashFor(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0];
  const ip = forwarded || req.headers.get("x-real-ip") || "127.0.0.1";
  return crypto.createHash("sha256").update(ip).digest("hex").substring(0, 32);
}

/**
 * `rate_limits` tablosuyla saatlik/günlük sınır. Sınır aşılmadıysa kaydı ekler ve true döner.
 * Oda oluşturma ile solo oyun başlatma aynı mekanizmayı farklı `action` değerleriyle kullanır.
 */
export async function checkRateLimit(
  ipHash: string,
  action: string,
  limits: { perHour: number; perDay: number },
): Promise<boolean> {
  const supabase = createAdminClient();
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const count = async (since: Date) =>
    (
      await supabase
        .from("rate_limits")
        .select("*", { count: "exact", head: true })
        .eq("key", ipHash)
        .eq("action", action)
        .gte("created_at", since.toISOString())
    ).count ?? 0;

  const [hourCount, dayCount] = await Promise.all([count(hourAgo), count(dayAgo)]);
  if (hourCount >= limits.perHour || dayCount >= limits.perDay) return false;

  await supabase.from("rate_limits").insert({
    key: ipHash,
    action,
    count: 1,
    window_start: now.toISOString(),
  });
  return true;
}
