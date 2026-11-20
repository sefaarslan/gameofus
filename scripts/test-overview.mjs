// GET /api/users/overview birim testi (sunucu/DB gerekmez): node --no-warnings scripts/test-overview.mjs
import { ifNoneMatchHit, weakEtag } from "../lib/etag.ts";
import { SectionError, parseInclude, runSections } from "../lib/overview.ts";

let fails = 0;
const ok = (c, m) => { console.log((c ? "✔ " : "✗ ") + m); if (!c) fails++; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ── weakEtag ────────────────────────────────────────────────────────────────────
const e1 = weakEtag({ a: 1, b: [1, 2] });
ok(/^W\/"[A-Za-z0-9_-]{22}"$/.test(e1), `zayıf ETag biçimi (${e1})`);
ok(weakEtag({ a: 1, b: [1, 2] }) === e1, "aynı veri → aynı ETag");
ok(weakEtag({ a: 1, b: [1, 3] }) !== e1, "farklı veri → farklı ETag");
ok(weakEtag([]) !== weakEtag({ items: [] }), "boş dizi ≠ boş items nesnesi");

// ── If-None-Match ───────────────────────────────────────────────────────────────
const strong = e1.replace(/^W\//, "");
ok(ifNoneMatchHit(e1, e1), "birebir eşleşme");
ok(ifNoneMatchHit(strong, e1), "güçlü etiket zayıfla eşleşir (zayıf karşılaştırma)");
ok(ifNoneMatchHit(`"xyz", ${e1}, W/"abc"`, e1), "liste içinde eşleşme");
ok(ifNoneMatchHit("*", e1), "* her etiketle eşleşir");
ok(!ifNoneMatchHit('W/"baska"', e1), "farklı etiket eşleşmez");
ok(!ifNoneMatchHit(null, e1) && !ifNoneMatchHit("", e1) && !ifNoneMatchHit(undefined, e1), "başlık yok/boş → eşleşmez");
ok(!ifNoneMatchHit("garbage", e1), "bozuk değer → eşleşmez");
ok(!ifNoneMatchHit(e1.slice(0, -2), e1), "kesik etiket eşleşmez");

// ── parseInclude ────────────────────────────────────────────────────────────────
const ALL = ["me", "history", "soloHistory", "aiReports", "soloToday"];
ok(same(parseInclude(null), ALL), "include yok → hepsi, kanonik sırada");
ok(same(parseInclude("aiReports,me"), ["me", "aiReports"]), "kanonik sıraya dizilir");
ok(same(parseInclude(" history , history ,me"), ["me", "history"]), "boşluk ve tekrar atılır");
ok(same(parseInclude("soloToday"), ["soloToday"]), "tek bölüm");
ok(parseInclude("me,foo") === null, "bilinmeyen bölüm → null (400)");
ok(parseInclude("") === null && parseInclude(",") === null && parseInclude("  ") === null, "boş include → null (400)");
ok(parseInclude("ME") === null, "büyük/küçük harf duyarlı");

// ── runSections ─────────────────────────────────────────────────────────────────
const logged = [];
let r = await runSections({ me: async () => ({ id: 1 }), history: async () => [] }, (s, e) => logged.push([s, e.name]));
ok(same(r.data, { me: { id: 1 }, history: [] }) && same(r.errors, {}) && logged.length === 0, "hepsi başarılı");

r = await runSections({
  me: async () => ({ id: 1 }),
  soloHistory: async () => { throw new SectionError("INTERNAL_ERROR", "gizli ayrıntı"); },
  aiReports: async () => { throw new Error("beklenmeyen"); },
}, (s, e) => logged.push([s, e.name]));
ok(same(Object.keys(r.data), ["me"]) && same(r.errors, { soloHistory: "INTERNAL_ERROR", aiReports: "INTERNAL_ERROR" }), "kısmi hata: başarısızlar errors'ta, başarılı bölüm yerinde");
ok(!JSON.stringify(r).includes("gizli ayrıntı") && !JSON.stringify(r).includes("beklenmeyen"), "hata mesajı sonuca sızmaz");
ok(same(logged, [["soloHistory", "SectionError"], ["aiReports", "Error"]]), "onError yalnızca sunucu logu için çağrılır");

r = await runSections({ me: async () => { throw new SectionError("UNAUTHORIZED", "x", 401); } });
ok(same(r.errors, { me: "UNAUTHORIZED" }) && same(r.data, {}), "SectionError kodu korunur");

r = await runSections({});
ok(same(r, { data: {}, errors: {} }), "bölüm yok → boş sonuç");

// Paralellik: üç bölüm ~50 ms'lik işi ~50 ms'de bitirir (ardışık olsa ~150 ms)
const t0 = performance.now();
await runSections({ me: () => new Promise((s) => setTimeout(s, 50)), history: () => new Promise((s) => setTimeout(s, 50)), aiReports: () => new Promise((s) => setTimeout(s, 50)) });
const dt = performance.now() - t0;
ok(dt < 110, `bölümler paralel çalışır (${Math.round(dt)} ms)`);

console.log(fails ? `\n${fails} test BAŞARISIZ` : "\nTüm testler geçti");
process.exit(fails ? 1 : 0);
