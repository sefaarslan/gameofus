/** `GET /api/users/overview` için saf yardımcılar (bağımlılık yok; birim testi `scripts/test-overview.mjs`). */

export const OVERVIEW_SECTIONS = ["me", "history", "soloHistory", "aiReports", "soloToday"] as const;
export type OverviewSection = (typeof OVERVIEW_SECTIONS)[number];

/** Bir bölüm/uç yüklenirken bilinen bir hata (kod `ApiErrorCode` değerlerinden biridir). Bilinmeyen hatalar `INTERNAL_ERROR` sayılır. */
export class SectionError extends Error {
  readonly code: string;
  readonly status: number;
  // (Parametre özelliği kullanılmaz: birim testleri Node'un yalnızca-tip-silme kipinde çalışır)
  constructor(code: string, message: string, status = 500) {
    super(message);
    this.name = "SectionError";
    this.code = code;
    this.status = status;
  }
}

/**
 * `include` sorgu parametresini bölüm listesine çevirir. Verilmediyse (null) hepsi, kanonik sırada. Virgülle ayrılır, boşluklar ve tekrarlar atılır.
 * Bilinmeyen bir ad ya da boş değer (`include=`, `include=,`) geçersizdir: `null` döner (çağıran 400 verir).
 */
export function parseInclude(raw: string | null): OverviewSection[] | null {
  if (raw === null) return [...OVERVIEW_SECTIONS];
  const wanted = new Set<string>();
  for (const part of raw.split(",")) {
    const name = part.trim();
    if (name === "") continue;
    if (!(OVERVIEW_SECTIONS as readonly string[]).includes(name)) return null;
    wanted.add(name);
  }
  if (wanted.size === 0) return null;
  return OVERVIEW_SECTIONS.filter((s) => wanted.has(s));
}

export interface SectionsResult {
  data: Partial<Record<OverviewSection, unknown>>;
  errors: Partial<Record<OverviewSection, string>>;
}

/**
 * İstenen bölümleri PARALEL çalıştırır; biri hata verirse diğerleri yine döner. Başarısız bölüm `data`'da olmaz, `errors`'a kodu yazılır
 * (`SectionError.code`, diğer hatalarda `INTERNAL_ERROR`). Hata ayrıntısı (mesaj) istemciye gitmez; `onError` yalnızca sunucu logu içindir.
 */
export async function runSections(
  loaders: Partial<Record<OverviewSection, () => Promise<unknown>>>,
  onError?: (section: OverviewSection, err: unknown) => void,
): Promise<SectionsResult> {
  const entries = Object.entries(loaders) as [OverviewSection, () => Promise<unknown>][];
  const settled = await Promise.all(
    entries.map(async ([name, load]) => {
      try {
        return [name, { ok: true as const, value: await load() }] as const;
      } catch (err) {
        onError?.(name, err);
        return [name, { ok: false as const, code: err instanceof SectionError ? err.code : "INTERNAL_ERROR" }] as const;
      }
    }),
  );
  const data: SectionsResult["data"] = {};
  const errors: SectionsResult["errors"] = {};
  for (const [name, r] of settled) {
    if (r.ok) data[name] = r.value;
    else errors[name] = r.code;
  }
  return { data, errors };
}
