// Günlük kapasite takibi (sunucusuz ortamda bellekte sayaç tutulamaz → küçük bir tablo: ai_usage_daily).
// Amaç: ücretsiz katman kotası dolmadan, kullanıcıdan coin ALMADAN "şu an yoğunluk var" diyebilmek.

import { createAdminClient } from "@/lib/supabase/server";
import type { ModelSpec } from "./config.ts";
import type { ProviderName } from "./provider.ts";

const utcDay = () => new Date().toISOString().slice(0, 10);

const KEY_ENV: Partial<Record<ProviderName, string>> = { groq: "GROQ_API_KEY", openrouter: "OPENROUTER_API_KEY" };

/** Sağlayıcının anahtarı tanımlı ve bugünkü istek sayısı yumuşak sınırın altında mı? */
export async function hasCapacity(spec: ModelSpec): Promise<boolean> {
  const keyEnv = KEY_ENV[spec.provider];
  if (keyEnv && !process.env[keyEnv]) return false;
  if (!Number.isFinite(spec.dailyRequestLimit)) return true;
  const { data } = await createAdminClient()
    .from("ai_usage_daily")
    .select("requests")
    .eq("day", utcDay())
    .eq("provider", spec.provider)
    .maybeSingle();
  return (data?.requests ?? 0) < spec.dailyRequestLimit;
}

/** Bir model çağrısını (başarılı ya da değil) bugünkü toplama ekler. Kişisel veri içermez. */
export async function recordUsage(provider: ProviderName, tokens: number, failed: boolean): Promise<void> {
  if (provider === "fake") return;
  try {
    await createAdminClient().rpc("ai_usage_add", {
      p_provider: provider,
      p_requests: 1,
      p_tokens: tokens,
      p_failures: failed ? 1 : 0,
    });
  } catch {
    // Kullanım sayacı yorumun kendisini bozmasın
  }
}
