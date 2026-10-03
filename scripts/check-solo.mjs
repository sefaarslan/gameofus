// Solo oyun (Red Flag Mayın Tarlası) senaryolarını doğrular:  node scripts/check-solo.mjs
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { redFlagScenarios: list } = await import(pathToFileURL(resolve("seeds/solo/red-flag.ts")).href);
const TAGS = ["boundaries", "trust", "communication", "jealousy", "money_lifestyle", "respect"];
const LANGS = ["tr", "en", "es"];
const PER_TAG = 10;
// Cinsiyetli zamir/ad denetimi (metinler cinsiyetsiz olmalı): kelime başı/sonu eşleşmesi
const GENDERED = {
  en: ["he", "she", "him", "his", "her", "hers", "himself", "herself", "boyfriend", "girlfriend", "husband", "wife"],
  es: ["él", "ella", "ellos", "ellas", "novio", "novia", "esposo", "esposa", "marido", "mujer"],
  tr: ["erkek arkadaş", "kız arkadaş", "kocan", "karın"],
};
// Şiddet/istismarı hafife alan veya açık cinsel içerik için kaba denetim
const UNSAFE = { tr: ["tecavüz", "döv", "vur", "şiddet", "cinsel"], en: ["rape", "beat", "hit you", "violen", "sexual"], es: ["viol", "golpe", "pega", "violen", "sexual"] };

let errors = 0;
const fail = (m) => { errors++; console.error("✗ " + m); };
const wordRe = (w) => new RegExp(`(?<![\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "iu");
const prefRe = (w) => new RegExp(`(?<![\\p{L}])${w}`, "iu");

if (list.length !== TAGS.length * PER_TAG) fail(`toplam ${list.length}, beklenen ${TAGS.length * PER_TAG}`);
const count = Object.fromEntries(TAGS.map((t) => [t, 0]));
const seen = new Set(), keys = new Set();
for (const sc of list) {
  const id = `${sc.tag}#${sc.n}`;
  if (!TAGS.includes(sc.tag)) { fail(`${id}: geçersiz tag`); continue; }
  count[sc.tag]++;
  if (keys.has(id)) fail(`${id}: yinelenen tag#n`); keys.add(id);
  if (!Number.isInteger(sc.n) || sc.n < 1 || sc.n > PER_TAG) fail(`${id}: n 1-${PER_TAG} olmalı`);
  for (const l of LANGS) {
    const t = sc[l];
    if (!t || !t.trim()) { fail(`${id}: ${l} boş`); continue; }
    if (t.length > 170) fail(`${id}: ${l} çok uzun (${t.length})`);
    const k = l + "|" + t.toLowerCase(); if (seen.has(k)) fail(`${id}: ${l} yinelenen metin`); seen.add(k);
    for (const w of GENDERED[l]) if (wordRe(w).test(t)) fail(`${id}: ${l} cinsiyetli ifade "${w}" :: ${t}`);
    for (const w of UNSAFE[l]) if (prefRe(w).test(t)) fail(`${id}: ${l} hassas ifade "${w}" :: ${t}`);
  }
}
for (const t of TAGS) if (count[t] !== PER_TAG) fail(`${t}: ${count[t]} senaryo, beklenen ${PER_TAG}`);
console.log(Object.entries(count).map(([t, n]) => `${t}:${n}`).join("  "));
console.log(errors ? `\n${errors} hata` : `\n${list.length} senaryo × ${LANGS.length} dil, tüm denetimler geçti ✔`);
process.exit(errors ? 1 : 0);
