// Soru setini okunabilir bir inceleme belgesine döker:  node scripts/export-questions-md.mjs [tr|en|es]
import { readdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";

const lang = process.argv[2] ?? "tr";
const DIR = resolve("seeds/v2");
const cats = [];
for (const f of readdirSync(DIR).filter((f) => f.endsWith(".ts") && !["types.ts", "helpers.ts"].includes(f))) {
  const mod = await import(pathToFileURL(join(DIR, f)).href);
  for (const v of Object.values(mod)) if (v?.slug && v?.questions) cats.push(v);
}
cats.sort((a, b) => a.sortOrder - b.sortOrder);
const TYPE = { friend: "Kanka", dating: "Sevgili", partner: "Hayat Arkadaşı" };
const MODE = { secret_choice: "Evet / Kararsız / Hayır", prediction: "Çoktan seçmeli", orderline: "Sıralama" };
let out = `# Game of Us — Soru Seti v2 (${lang.toUpperCase()})\n\n${cats.length} kategori, ${cats.reduce((n, c) => n + c.questions.length, 0)} soru.\n\n`;
for (const c of cats) {
  out += `## ${c.names[lang]}  \`${c.slug}\`\n\n`;
  out += `**Görünür:** ${c.relationshipTypes.map((t) => TYPE[t]).join(", ")}${c.isPremium ? " · **Premium (18+)**" : ""}\n\n`;
  for (const mode of ["secret_choice", "prediction", "orderline"]) {
    out += `### ${MODE[mode]}\n\n`;
    c.questions.filter((q) => q.mode === mode).forEach((q, i) => {
      out += `${i + 1}. ${q[lang].text}  _(${q.tag})_\n`;
      if (q[lang].options) out += q[lang].options.map((o) => `   - ${o}`).join("\n") + "\n";
    });
    out += "\n";
  }
}
writeFileSync(`docs/questions-v2-${lang}.md`, out);
console.log(`docs/questions-v2-${lang}.md yazıldı (${out.length} karakter)`);
