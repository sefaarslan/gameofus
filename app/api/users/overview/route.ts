import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { corsOptions } from "@/lib/cors";
import { apiError, apiOkEtag } from "@/lib/api";
import { OVERVIEW_SECTIONS, SectionError, parseInclude, runSections, type OverviewSection } from "@/lib/overview";
import { checkRateLimitWindow } from "@/lib/rate-limit";
import { normalizeTimezone } from "@/lib/solo-daily";
import { loadAiReports, loadHistory, loadMe, loadSoloHistory, loadSoloToday } from "@/lib/user-data";

export function OPTIONS() {
  return corsOptions();
}

/** Kullanıcı başına dakikada 30 (beş ayrı ucun toplam kullanımını karşılar). */
const OVERVIEW_LIMIT = { limit: 30, windowMs: 60_000 };

/**
 * Mobil: birden çok ekran verisini TEK istekte döner (tek JWT doğrulaması, tek kullanıcı kaydı sorgusu, bölümler paralel). Yalnızca Bearer Supabase JWT.
 * `?include=me,history,soloHistory,aiReports,soloToday` (verilmezse hepsi; yalnızca istenen bölüm hesaplanır). `soloToday` istenirse `timezone` (IANA) zorunludur.
 * Her bölüm, karşılığı olan ucun yanıtıyla BİREBİR aynıdır (aynı `lib/user-data.ts` yükleyicileri): `me`→`GET /users/me`, `history`→`GET /users/history` (dizi),
 * `soloHistory`→`GET /users/solo-history` (`{ items }`), `aiReports`→`GET /users/ai-reports` (dizi), `soloToday`→`GET /solo/red-flag/today`.
 * Kısmi hata: başarısız bölüm yanıtta olmaz, `errors.<bölüm>` hata kodunu taşır; hepsi başarısızsa 500. ETag (`generatedAt` hariç) + `If-None-Match` → 304.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Giriş gereklidir.", 401);

  const params = req.nextUrl.searchParams;
  const sections = parseInclude(params.get("include"));
  if (!sections) {
    return apiError("INVALID_PAYLOAD", `include geçersiz. Virgülle ayrılmış en az bir bölüm ver: ${OVERVIEW_SECTIONS.join(", ")}.`);
  }
  let timezone = "";
  if (sections.includes("soloToday")) {
    const raw = params.get("timezone")?.trim();
    if (!raw) return apiError("INVALID_PAYLOAD", "soloToday için timezone gereklidir (IANA, ör. Europe/Istanbul).");
    // Geçersiz ad `GET /solo/red-flag/today` ile aynı kuralla varsayılana düşer
    timezone = normalizeTimezone(raw);
  }

  // Yalnızca geliştirme/test sunucusunda: bir bölümü zorla başarısız kıl (kısmi hata davranışını sınamak için). Üretimde hiçbir etkisi yoktur.
  const forcedFail =
    process.env.NODE_ENV !== "production" && process.env.OVERVIEW_ALLOW_TEST_OVERRIDE === "1"
      ? new Set((req.headers.get("x-overview-test-fail") ?? "").split(",").map((s) => s.trim()))
      : new Set<string>();
  const guarded = (name: OverviewSection, load: () => Promise<unknown>) => async () => {
    if (forcedFail.has(name)) throw new SectionError("INTERNAL_ERROR", "Test için zorla başarısız.");
    return load();
  };

  // Kanonik sırada (yanıt anahtar sırası ve ETag kararlı olsun); yalnızca istenenler kurulur
  const all: Record<OverviewSection, () => Promise<unknown>> = {
    me: guarded("me", () => loadMe(user.id)),
    history: guarded("history", () => loadHistory(user.id)),
    soloHistory: guarded("soloHistory", () => loadSoloHistory(user.id)),
    aiReports: guarded("aiReports", () => loadAiReports(user.id)),
    soloToday: guarded("soloToday", () => loadSoloToday(user.id, timezone)),
  };
  const loaders = Object.fromEntries(OVERVIEW_SECTIONS.filter((s) => sections.includes(s)).map((s) => [s, all[s]]));

  // Hız sınırı bölümlerle paralel: gecikme eklemez; aşıldıysa sonuç atılır
  const [allowed, { data, errors }] = await Promise.all([
    checkRateLimitWindow(`u:${user.id}`, "overview_min", OVERVIEW_LIMIT),
    runSections(loaders, (section, err) => console.error(`overview: ${section} başarısız:`, err instanceof Error ? err.name : "unknown")),
  ]);
  if (!allowed) return apiError("RATE_LIMITED", "Çok fazla istek. Biraz sonra tekrar dene.", 429);

  if (Object.keys(data).length === 0) {
    return apiError("INTERNAL_ERROR", "Veriler okunamadı.", 500, { errors });
  }

  // ETag `generatedAt` OLMADAN hesaplanır (her istekte değişir, 304'ü bozar)
  const core: Record<string, unknown> = { ...data, ...(Object.keys(errors).length > 0 ? { errors } : {}) };
  return apiOkEtag(req, { generatedAt: new Date().toISOString(), ...core }, core);
}
