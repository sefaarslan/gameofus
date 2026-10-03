// Red Flag senaryolarının okunabilir dökümü (set set):  node scripts/export-solo-md.mjs [tr|en|es]
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const lang = process.argv[2] ?? "tr";
const { redFlagScenarios: list } = await import(pathToFileURL(resolve("seeds/solo/red-flag.ts")).href);
const NAMES = { boundaries: "Sınırlar", trust: "Güven", communication: "İletişim", jealousy: "Kıskançlık / Sahiplenme", money_lifestyle: "Para & Yaşam Tarzı", respect: "Saygı" };
const CATS = { friend: "Arkadaşlık", romantic: "Sevgili" };
const TONE = { H: "sağlıklı", G: "gri", C: "endişe verici" };
const active = list.filter((s) => !s.inactive);
let out = `# Red Flag Mayın Tarlası — Setler (${lang.toUpperCase()})\n\n${active.length} aktif senaryo, 6 set × 9 kart. Doğru cevap yoktur; skor yalnızca Green/Yellow/Red dağılımıdır. Yüzdeler yalnızca aynı set içinde karşılaştırılabilir. 104-106 setleri mobilde açılacaktır (henüz içerik yok).\n\n`;
for (const cat of Object.keys(CATS)) {
  for (const no of [101, 102, 103]) {
    const key = `${cat}-${no}`;
    out += `## ${CATS[cat]} · ${no}  \`${key}\`\n\n`;
    list.filter((s) => s.pack === key).sort((a, b) => a.pos - b.pos).forEach((s) => (out += `${s.pos}. ${s[lang]}  _(${NAMES[s.tag]} · ${TONE[s.tone]})_\n`));
    out += "\n";
  }
}
const retired = list.filter((s) => s.inactive);
out += `## Emekli (pasif) senaryolar\n\n`;
retired.forEach((s) => (out += `- ${s.tag}:${s.n} — ${s[lang]}\n`));
writeFileSync(`docs/solo-red-flag-${lang}.md`, out + "\n");
console.log(`docs/solo-red-flag-${lang}.md`);
