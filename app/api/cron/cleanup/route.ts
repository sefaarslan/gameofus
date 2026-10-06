import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { RETENTION } from "@/lib/retention";

export const maxDuration = 60;

const BATCH = 500;
const MAX_ROUNDS = 20;

/** Sabit zamanlı karşılaştırma (CRON_SECRET) */
function secretMatches(provided: string, secret: string): boolean {
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(secret).digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * Süresi dolmuş verileri siler (anonim web odaları, anonim solo oturumlar, eski IP özetleri); silmeden önce kişisel
 * olmayan günlük metrik toplamlarını arşivler. Vercel Cron günde bir çağırır (`vercel.json`); `CRON_SECRET` yoksa/yanlışsa reddeder.
 * Mobil (kullanıcıya bağlı) oyun geçmişi silinmez; hesap silmeyle gider.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET tanımlı değil" }, { status: 503 });
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ") || !secretMatches(auth.slice(7), secret)) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const total = { rooms: 0, solo: 0, rateLimits: 0 };
  let rounds = 0;
  for (; rounds < MAX_ROUNDS; rounds++) {
    const { data, error } = await supabase.rpc("cleanup_expired_data", {
      p_room_days: RETENTION.roomDays,
      p_solo_days: RETENTION.soloDays,
      p_rate_days: RETENTION.rateLimitDays,
      p_batch: BATCH,
      p_user_days: RETENTION.userHistoryDays,
    });
    if (error) return NextResponse.json({ error: error.message, ...total, rounds }, { status: 500 });
    const row = data?.[0];
    if (!row) break;
    total.rooms += row.rooms_deleted;
    total.solo += row.solo_deleted;
    total.rateLimits += row.rate_deleted;
    // Kalan iş yoksa dur (parti dolmadıysa her şey işlenmiştir)
    if (row.rooms_deleted < BATCH && row.solo_deleted < BATCH && row.rate_deleted < BATCH * 10) break;
  }
  return NextResponse.json({ ok: true, ...total, rounds: rounds + 1 });
}
