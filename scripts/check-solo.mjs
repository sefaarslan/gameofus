// Solo oyun (Red Flag Mayın Tarlası) senaryolarını doğrular:  node scripts/check-solo.mjs
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { redFlagScenarios: list } = await import(pathToFileURL(resolve("seeds/solo/red-flag.ts")).href);
const TAGS = ["boundaries", "trust", "communication", "jealousy", "money_lifestyle", "respect"];
const LANGS = ["tr", "en", "es"];
const MAX_N = 12; // 1-10 ilk set, 11-12 arkadaşlık setlerini tamamlayan yeni senaryolar
const PACKS = ["friend-101", "friend-102", "friend-103", "romantic-101", "romantic-102", "romantic-103"];
// Arkadaşlık setlerinde romantik çağrışım yasak (kategori "Arkadaşlık ilişkilerinde")
const ROMANTIC = { tr: ["sevgili", "partner", "flört", "romantik", "eski sevgili"], en: ["partner", "boyfriend", "girlfriend", "dating", "romantic", "lover", "ex "], es: ["pareja", "novi", "romántic", "amante", " ex "] };
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

const count = Object.fromEntries(TAGS.map((t) => [t, 0]));
const seen = new Set(), keys = new Set();
for (const sc of list) {
  const id = `${sc.tag}#${sc.n}`;
  if (!TAGS.includes(sc.tag)) { fail(`${id}: geçersiz tag`); continue; }
  count[sc.tag]++;
  if (keys.has(id)) fail(`${id}: yinelenen tag#n`); keys.add(id);
  if (!Number.isInteger(sc.n) || sc.n < 1 || sc.n > MAX_N) fail(`${id}: n 1-${MAX_N} olmalı`);
  for (const l of LANGS) {
    const t = sc[l];
    if (!t || !t.trim()) { fail(`${id}: ${l} boş`); continue; }
    if (t.length > 170) fail(`${id}: ${l} çok uzun (${t.length})`);
    const k = l + "|" + t.toLowerCase(); if (seen.has(k)) fail(`${id}: ${l} yinelenen metin`); seen.add(k);
    for (const w of GENDERED[l]) if (wordRe(w).test(t)) fail(`${id}: ${l} cinsiyetli ifade "${w}" :: ${t}`);
    for (const w of UNSAFE[l]) if (prefRe(w).test(t)) fail(`${id}: ${l} hassas ifade "${w}" :: ${t}`);
  }
}
// Setler: 6 set × 9 kart, pozisyon 1-9, 6 temanın tamamı, aynı senaryo tek sette; arkadaşlık setlerinde romantik çağrışım yok
const byPack = Object.fromEntries(PACKS.map((p) => [p, []]));
for (const sc of list) {
  if (sc.pack) {
    if (!byPack[sc.pack]) { fail(`${sc.tag}#${sc.n}: bilinmeyen set ${sc.pack}`); continue; }
    if (sc.inactive) fail(`${sc.tag}#${sc.n}: pasif senaryo sette yer alıyor`);
    byPack[sc.pack].push(sc);
  } else if (!sc.inactive) fail(`${sc.tag}#${sc.n}: sette değil ama pasif işaretlenmemiş`);
}
for (const [pk, items] of Object.entries(byPack)) {
  if (items.length !== 9) fail(`${pk}: ${items.length} kart, beklenen 9`);
  const pos = items.map((i) => i.pos).sort((a, b) => a - b).join(",");
  if (pos !== "1,2,3,4,5,6,7,8,9") fail(`${pk}: pozisyonlar 1-9 olmalı (${pos})`);
  const themes = new Set(items.map((i) => i.tag));
  if (themes.size !== TAGS.length) fail(`${pk}: ${themes.size}/6 tema`);
  const tones = { H: 0, G: 0, C: 0 }; for (const i of items) tones[i.tone ?? "?"]++;
  console.log(`  ${pk.padEnd(14)} H${tones.H} G${tones.G} C${tones.C}  temalar: ${[...themes].map((t) => t.slice(0, 4)).join(",")}`);
  if (pk.startsWith("friend-")) for (const i of items) for (const l of LANGS) for (const w of ROMANTIC[l]) if (new RegExp(w.startsWith(" ") || w.endsWith(" ") ? w : `(?<![\\p{L}])${w}`, "iu").test(i[l])) fail(`${pk} ${i.tag}#${i.n}: ${l} romantik ifade "${w.trim()}" :: ${i[l]}`);
}
console.log(Object.entries(count).map(([t, n]) => `${t}:${n}`).join("  "));
const active = list.filter((x) => !x.inactive).length;
console.log(errors ? `\n${errors} hata` : `\n${list.length} senaryo (${active} aktif, ${list.length - active} emekli) × ${LANGS.length} dil, tüm denetimler geçti ✔`);
process.exit(errors ? 1 : 0);
