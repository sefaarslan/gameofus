// Soru setini doğrular: yapı (adet/seçenek/diller) + "Kanka'ya romantik çağrışım yok" denetimi.
//   node scripts/check-questions.mjs
import { readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";

const DIR = resolve("seeds/v2");
const LANGS = ["tr", "en", "es"];
const TARGET = { secret_choice: 10, prediction: 10, orderline: 10 };

// Kanka'ya açık kategorilerde (ortak olanlar dahil) YASAK sözcük köklerinden oluşan denetim listesi.
const ROMANCE = {
  tr: ["partner", "sevgili", "aşk", "flört", "romant", "evlil", "evlen", "eşin", "eşim", "öpüc", "öpüş", "kıskan", "nişan", "balayı", "buluşma", "randevu", "gelinlik", "damat", "yatak", "ilişki", "sadakat", "cinsel", "çıkma teklif", "âşık", "asık", "kalbini", "kalp kır", "yakışıklı", "güzel bul"],
  en: ["partner", "boyfriend", "girlfriend", "romanc", "romantic", "dating", "date night", "first date", "marriage", "marry", "wedding", "spouse", "husband", "wife", "kiss", "jealous", "crush", "in love", "love life", "lover", "flirt", "honeymoon", "sexy", "intimate", "bedroom", "relationship"],
  es: ["pareja", "novio", "novia", "romántic", "romanc", "amor", "enamor", "matrimonio", "casar", "boda", "esposo", "esposa", "beso", "celos", "cita ", "ligar", "coquete", "luna de miel", "sexy", "íntim", "relación", "dormitorio"],
};

// Kök, kelimenin BAŞINDA eşleşmeli (ekler yakalanır; "başka" içindeki "aşk" yakalanmaz)
const startsWord = (hay, root) => new RegExp("(?<![\\p{L}])" + root.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "iu").test(hay);

let errors = 0;
const fail = (msg) => { errors++; console.error("✗ " + msg); };

const files = readdirSync(DIR).filter((f) => f.endsWith(".ts") && f !== "types.ts");
const cats = [];
for (const f of files) {
  const mod = await import(pathToFileURL(join(DIR, f)).href);
  for (const v of Object.values(mod)) if (v && v.slug && v.questions) cats.push(v);
}

const seenSlugs = new Set();
for (const c of cats) {
  if (seenSlugs.has(c.slug)) fail(`${c.slug}: yinelenen slug`);
  seenSlugs.add(c.slug);
  for (const l of LANGS) if (!c.names?.[l]) fail(`${c.slug}: names.${l} eksik`);

  const counts = { secret_choice: 0, prediction: 0, orderline: 0 };
  const texts = new Set();
  c.questions.forEach((q, i) => {
    const id = `${c.slug}[${i}] (${q.mode}/${q.tag})`;
    counts[q.mode]++;
    if (!q.tag || !/^[a-z0-9_]+$/.test(q.tag)) fail(`${id}: geçersiz tag`);
    const optCounts = new Set();
    for (const l of LANGS) {
      const t = q[l];
      if (!t?.text?.trim()) { fail(`${id}: ${l}.text boş`); continue; }
      if (texts.has(l + t.text)) fail(`${id}: ${l} yinelenen soru metni`);
      texts.add(l + t.text);
      if (q.mode === "secret_choice") {
        if (t.options) fail(`${id}: ${l} secret_choice'ta options olmamalı`);
      } else {
        if (!t.options || t.options.length !== 4) fail(`${id}: ${l} 4 seçenek olmalı`);
        else {
          optCounts.add(t.options.length);
          if (new Set(t.options).size !== 4) fail(`${id}: ${l} seçenekler yinelenen`);
          if (t.options.some((o) => !o.trim() || o.length > 80)) fail(`${id}: ${l} seçenek boş/çok uzun`);
        }
      }
      if (t.text.length > 160) fail(`${id}: ${l} soru çok uzun (${t.text.length})`);
      // Kanka'ya açık her kategoride romantik çağrışım denetimi
      if (c.relationshipTypes.includes("friend")) {
        const hay = (t.text + " " + (t.options ?? []).join(" ")).toLowerCase() + " ";
        for (const w of ROMANCE[l]) if (startsWord(hay, w)) fail(`${id}: ${l} romantik çağrışım olabilir → "${w}" :: ${t.text}`);
      }
    }
  });
  for (const [m, n] of Object.entries(TARGET)) if (counts[m] !== n) fail(`${c.slug}: ${m} ${counts[m]} adet, hedef ${n}`);
  console.log(`${errors === 0 ? "✓" : "·"} ${c.slug} [${c.relationshipTypes.join(",")}] — SC ${counts.secret_choice}, PR ${counts.prediction}, OL ${counts.orderline}`);
}
// Her ilişki türü için ücretsiz havuz, her modda en az 10 soru içermeli (10 soruluk tek modlu oyun için)
for (const rt of ["friend", "dating", "partner"]) {
  const pool = { secret_choice: 0, prediction: 0, orderline: 0 };
  for (const c of cats) if (!c.isPremium && c.relationshipTypes.includes(rt)) for (const q of c.questions) pool[q.mode]++;
  for (const [m, n] of Object.entries(pool)) if (n < 10) fail(`havuz: ${rt} / ${m} ücretsiz havuzda ${n} soru (en az 10 gerekli)`);
  console.log(`  havuz ${rt}: SC ${pool.secret_choice}, PR ${pool.prediction}, OL ${pool.orderline}`);
}
console.log(errors ? `\n${errors} hata` : `\n${cats.length} kategori, tüm denetimler geçti ✔`);
process.exit(errors ? 1 : 0);
