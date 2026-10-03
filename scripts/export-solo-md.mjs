// Red Flag senaryolarının okunabilir dökümü:  node scripts/export-solo-md.mjs [tr|en|es]
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const lang = process.argv[2] ?? "tr";
const { redFlagScenarios: list } = await import(pathToFileURL(resolve("seeds/solo/red-flag.ts")).href);
const NAMES = { boundaries: "Sınırlar", trust: "Güven", communication: "İletişim", jealousy: "Kıskançlık / Sahiplenme", money_lifestyle: "Para & Yaşam Tarzı", respect: "Saygı" };
let out = `# Red Flag Mayın Tarlası — Senaryolar (${lang.toUpperCase()})\n\n${list.length} senaryo. Doğru cevap yoktur; skor yalnızca Green/Yellow/Red dağılımıdır.\n\n`;
for (const tag of Object.keys(NAMES)) {
  out += `## ${NAMES[tag]}  \`${tag}\`\n\n`;
  list.filter((s) => s.tag === tag).forEach((s) => (out += `${s.n}. ${s[lang]}\n`));
  out += "\n";
}
writeFileSync(`docs/solo-red-flag-${lang}.md`, out);
console.log(`docs/solo-red-flag-${lang}.md`);
