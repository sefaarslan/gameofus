// Kılavuz dosyalarını (public/guides/{tr,en,es}.json) doğrular. Hata varsa çıkış kodu 1: `npm run build` bu betikle başlar, yani deploy durur.
//   node scripts/check-guides.mjs            (GUIDES_DIR ile başka bir klasör denenebilir; testler için)
// Kategori bilgisi seeds/v2/*.ts içinden okunur (tek doğruluk kaynağı; `.dockerignore` bu iki yolu imaja alır).
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const DIR = resolve(process.env.GUIDES_DIR ?? "public/guides");
const SEEDS = resolve("seeds/v2");
const LANGS = ["tr", "en", "es"];
const REL = ["friend", "dating", "partner"];
const TIERS = ["free", "lite", "premium"];
const ROOM_MODES = ["secret_choice", "prediction", "orderline", "mixed"]; // solo/Red Flag yok
const COUNTS = [5, 10];
const MAX_IMAGE_BYTES = 150_000; // kapak görseli üst sınırı (mobil şartı)
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
// "Sırayla oyna" dayatması (uyarı): ürün kararı, adımlar öneridir ve istenen oyundan başlanır
const FORCED_ORDER = {
  tr: /sırayla|sırasıyla|sırayı\s+boz|sırasını\s+boz|atlama/i,
  en: /\bin order\b|\bin sequence\b|sequentially|one by one|don'?t skip|do not skip|\bskip\b/i,
  es: /\ben orden\b|secuencial|uno por uno|no te saltes|sin saltar/i,
};

let errors = 0, warnings = 0;
const fail = (m) => { errors++; console.error("✗ " + m); };
const warn = (m) => { warnings++; console.warn("! " + m); };

// ── Kategoriler: slug → { types, premium } (seed dosyalarından; yalnızca ilk slug/relationshipTypes/isPremium) ─────────────
const cats = new Map();
if (!existsSync(SEEDS)) {
  fail(`${SEEDS} yok: kategori denetimi yapılamaz (.dockerignore seeds/v2'yi imaja almalı)`);
} else {
  for (const f of readdirSync(SEEDS).filter((x) => x.endsWith(".ts") && x !== "types.ts" && x !== "helpers.ts")) {
    const src = readFileSync(join(SEEDS, f), "utf8");
    const slug = src.match(/\bslug:\s*"([a-z0-9_]+)"/)?.[1];
    const types = src.match(/\brelationshipTypes:\s*\[([^\]]*)\]/)?.[1].match(/"(\w+)"/g)?.map((s) => s.replace(/"/g, ""));
    const premium = /\bisPremium:\s*true/.test(src);
    if (!slug || !types?.length) { fail(`seeds/v2/${f}: slug/relationshipTypes okunamadı`); continue; }
    cats.set(slug, { types, premium });
  }
}

// ── Dosyaları oku ────────────────────────────────────────────────────────────────────────────────────────────────────────
const data = {};
for (const l of LANGS) {
  const file = join(DIR, `${l}.json`);
  if (!existsSync(file)) { fail(`${l}.json yok`); continue; }
  try { data[l] = JSON.parse(readFileSync(file, "utf8")); } catch (e) { fail(`${l}.json geçerli JSON değil: ${e.message}`); }
}

const str = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;

// `homework`: kök alandaki tek kılavuz benzeri nesne ("Sevgi Haritası" kartı; `guides` listesinde görünmez). Adım kuralları aynıdır; ek olarak
// `description` ve adımlarda `talk` zorunlu, `occasion` boş dize, bağ türü yalnızca dating/partner.
function checkGuide(l, g, at, homework = false) {
  if (!g || typeof g !== "object" || Array.isArray(g)) return fail(`${at}: nesne değil`);
  if (!str(g.id, 80) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.id)) fail(`${at}: id kararlı bir slug olmalı (küçük harf, rakam, tire; yıl ekle)`);
  if (!str(g.slug, 80) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(g.slug)) fail(`${at}: slug geçersiz`);
  for (const k of homework ? ["title", "subtitle"] : ["occasion", "title", "subtitle"]) if (!str(g[k], 200)) fail(`${at}: ${k} boş/çok uzun`);
  if (homework) {
    if (g.occasion !== "") fail(`${at}: occasion boş dize olmalı`);
    if (!str(g.description, 500)) fail(`${at}: description boş/çok uzun`);
  }
  if (str(g.title, 200) && g.title.length > 60) warn(`${at}: title uzun (${g.title.length} > 60)`);
  if (str(g.subtitle, 200) && g.subtitle.length > 140) warn(`${at}: subtitle uzun (${g.subtitle.length} > 140)`);
  const rel = g.relationshipTypes;
  if (!Array.isArray(rel) || !rel.length || !rel.every((r) => REL.includes(r)) || new Set(rel).size !== rel.length) fail(`${at}: relationshipTypes friend|dating|partner dizisi olmalı (boş değil, tekrarsız)`);
  if (homework && Array.isArray(rel) && rel.some((r) => r !== "dating" && r !== "partner")) fail(`${at}: relationshipTypes yalnızca dating ve partner olabilir`);
  if (!TIERS.includes(g.minTier)) fail(`${at}: minTier ${TIERS.join("|")} olmalı`);
  if (!Number.isInteger(g.players) || g.players < 2) fail(`${at}: players ≥ 2 tamsayı olmalı`);

  // Pencere (isteğe bağlı): ikisi birlikte, ISO, startsAt < endsAt
  const s = g.startsAt ?? null, e = g.endsAt ?? null;
  if ((s === null) !== (e === null)) fail(`${at}: startsAt ve endsAt birlikte verilmeli ya da ikisi de boş olmalı`);
  else if (s !== null) {
    if (typeof s !== "string" || typeof e !== "string" || !ISO.test(s) || !ISO.test(e) || Number.isNaN(Date.parse(s)) || Number.isNaN(Date.parse(e))) fail(`${at}: startsAt/endsAt ISO 8601 UTC (…Z) olmalı`);
    else if (!(Date.parse(s) < Date.parse(e))) fail(`${at}: startsAt < endsAt olmalı`);
  }

  if (!Array.isArray(g.steps) || g.steps.length === 0) return fail(`${at}: steps boş`);
  g.steps.forEach((st, j) => {
    const sa = `${at} adım ${j + 1}`;
    if (!st || typeof st !== "object") return fail(`${sa}: nesne değil`);
    if (homework) {
      if (!Array.isArray(st.talk) || st.talk.length === 0 || !st.talk.every((q) => str(q, 200))) fail(`${sa}: talk boş olmayan bir metin dizisi olmalı`);
      else for (const q of st.talk) if (FORCED_ORDER[l]?.test(q)) warn(`${sa}: talk "sırayla oyna" dayatması gibi duruyor: "${q}"`);
    }
    if (st.order !== j + 1) fail(`${sa}: order ${j + 1} olmalı (1'den ardışık)`);
    for (const k of ["title", "description"]) if (!str(st[k], 200)) fail(`${sa}: ${k} boş/çok uzun`);
    if (!Number.isInteger(st.minutes) || st.minutes < 1 || st.minutes > 120) fail(`${sa}: minutes 1-120 tamsayı olmalı`);
    if (!ROOM_MODES.includes(st.mode)) fail(`${sa}: mode ${ROOM_MODES.join("|")} olmalı (solo/Red Flag yok), gelen: ${JSON.stringify(st.mode)}`);
    if (!COUNTS.includes(st.questionCount)) fail(`${sa}: questionCount 5|10 olmalı`);
    if (st.categorySlug !== null) {
      const c = typeof st.categorySlug === "string" ? cats.get(st.categorySlug) : undefined;
      if (!c) { if (cats.size) fail(`${sa}: categorySlug "${st.categorySlug}" mevcut bir kategori değil (ya da null)`); }
      else {
        if (c.premium) fail(`${sa}: "${st.categorySlug}" premium/18+ bir kategori; kılavuz (lite) buna dayanamaz`);
        // Oda kurma ekranı bağ türüne göre kategoriyi doğrular (uyumsuzsa sunucu INVALID_PAYLOAD verir): kılavuzun HER bağ türü için geçerli olmalı.
        // Kanka'ya açık kılavuzda romantik kategori bu yüzden zaten giremez.
        const bad = Array.isArray(rel) ? rel.filter((r) => REL.includes(r) && !c.types.includes(r)) : [];
        if (bad.length) fail(`${sa}: "${st.categorySlug}" yalnızca [${c.types}] bağlarına açık; kılavuz ${bad.join("/")} için de seçilebilir`);
      }
    }
    for (const k of ["title", "description"]) if (typeof st[k] === "string" && FORCED_ORDER[l]?.test(st[k])) warn(`${sa}: ${k} "sırayla oyna" dayatması gibi duruyor: "${st[k]}"`);
  });
  // Kapak görseli: mobil yolu kimlikten türetir (img/<id>.jpg). Yoksa uyarı (deploy durmaz; mobil görselsiz gösterir ya da yedeğe düşer)
  if (typeof g.id === "string" && l === "tr") {
    const img = join(DIR, "img", `${g.id}.jpg`);
    if (!existsSync(img)) warn(`${g.id}: kapak görseli yok (public/guides/img/${g.id}.jpg)`);
    else if (statSync(img).size > MAX_IMAGE_BYTES) fail(`${g.id}: kapak görseli ${Math.round(statSync(img).size / 1000)} KB; en çok ${MAX_IMAGE_BYTES / 1000} KB olmalı (mobil şartı; ${homework ? "16:9, ~1200x675" : "5:4 oran, ~1000 px genişlik"})`);
  }
  for (const k of ["subtitle", "title", "description"]) if (typeof g[k] === "string" && FORCED_ORDER[l]?.test(g[k])) warn(`${at}: ${k} "sırayla oyna" dayatması gibi duruyor: "${g[k]}"`);
}

for (const l of LANGS) {
  const d = data[l];
  if (!d) continue;
  if (d.version !== 1) fail(`${l}.json: version 1 olmalı`);
  if (!Array.isArray(d.guides)) { fail(`${l}.json: guides dizi olmalı`); continue; }
  const ids = new Set();
  d.guides.forEach((g, i) => {
    checkGuide(l, g, `${l}.json guides[${i}]${g?.id ? ` (${g.id})` : ""}`);
    if (g?.id) { if (ids.has(g.id)) fail(`${l}.json: yinelenen id "${g.id}"`); ids.add(g.id); }
  });
  if (d.homework !== undefined) {
    checkGuide(l, d.homework, `${l}.json homework`, true);
    // Aynı kimlik hem listede hem homework'te olamaz (tamamlandı işaretleri ve kapak yolu kimliğe bağlı)
    if (d.homework?.id && ids.has(d.homework.id)) fail(`${l}.json: homework id "${d.homework.id}" guides içinde de var (listede görünmemeli)`);
  }
}

// ── Diller arası tutarlılık: aynı id'ler, aynı yapı (yalnızca metinler dile göre değişir) ────────────────────────────────
function compare(g, o, name, l) {
  for (const k of ["id", "slug", "relationshipTypes", "minTier", "players", "startsAt", "endsAt"]) {
    if (JSON.stringify(g[k] ?? null) !== JSON.stringify(o[k] ?? null)) fail(`${name}: ${k} tr ve ${l} arasında farklı`);
  }
  if ((g.steps?.length ?? 0) !== (o.steps?.length ?? 0)) return fail(`${name}: adım sayısı tr (${g.steps?.length}) ≠ ${l} (${o.steps?.length})`);
  (g.steps ?? []).forEach((s, j) => {
    for (const k of ["order", "minutes", "mode", "categorySlug", "questionCount"]) {
      if (JSON.stringify(s?.[k] ?? null) !== JSON.stringify(o.steps[j]?.[k] ?? null)) fail(`${name} adım ${j + 1}: ${k} tr ve ${l} arasında farklı`);
    }
    if ((s?.talk?.length ?? 0) !== (o.steps[j]?.talk?.length ?? 0)) fail(`${name} adım ${j + 1}: talk soru sayısı tr ve ${l} arasında farklı`);
  });
}

const ref = data.tr;
for (const l of LANGS.slice(1)) {
  if (!ref || !data[l]) continue;
  const a = ref.homework, b = data[l].homework;
  if (!a !== !b) fail(`homework tr ve ${l} dosyalarından yalnızca birinde var`);
  else if (a && b) compare(a, b, "homework", l);
}
if (ref && Array.isArray(ref.guides)) {
  for (const l of LANGS.slice(1)) {
    const d = data[l];
    if (!d || !Array.isArray(d.guides)) continue;
    const a = ref.guides.map((g) => g?.id), b = d.guides.map((g) => g?.id);
    if (JSON.stringify(a) !== JSON.stringify(b)) { fail(`tr.json ve ${l}.json aynı id'lere/sıraya sahip değil: [${a}] ≠ [${b}]`); continue; }
    ref.guides.forEach((g, i) => compare(g, d.guides[i], g.id, l));
  }
}

const n = ref?.guides?.length ?? 0;
console.log(errors ? `\n${errors} hata, ${warnings} uyarı` : `✔ ${n} kılavuz${ref?.homework ? " + homework" : ""}, ${LANGS.length} dil: tamam${warnings ? ` (${warnings} uyarı)` : ""}`);
process.exit(errors ? 1 : 0);
