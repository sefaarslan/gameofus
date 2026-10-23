// Soru etiketi (insight_tag) → tema (kategori slug'ı) eşlemesini seeds/v2'den üretir: lib/ai/tag-themes.ts (ÜRETİLİR, elle düzenleme).
//   node --no-warnings scripts/build-ai-tag-map.mjs
// Yeni soru/etiket eklediğinde yeniden çalıştır. Aynı etiket iki kategoride geçerse uyarır (ilk kategori kazanır).
import { readdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";

const DIR = resolve("seeds/v2");
const map = {};
const dup = [];
for (const f of readdirSync(DIR).filter((f) => f.endsWith(".ts") && !["types.ts", "helpers.ts"].includes(f)).sort()) {
  const mod = await import(pathToFileURL(join(DIR, f)).href);
  for (const cat of Object.values(mod)) {
    if (!cat?.slug || !cat.questions) continue;
    for (const q of cat.questions) {
      if (map[q.tag] && map[q.tag] !== cat.slug) dup.push(`${q.tag}: ${map[q.tag]} / ${cat.slug}`);
      map[q.tag] ??= cat.slug;
    }
  }
}
const lines = Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([tag, theme]) => `  ${tag}: "${theme}",`);
writeFileSync(
  "lib/ai/tag-themes.ts",
  `// ÜRETİLDİ: scripts/build-ai-tag-map.mjs (seeds/v2). Elle düzenleme.\n// Soru etiketi (insight_tag) → tema (kategori slug'ı).\nexport const TAG_THEME: Record<string, string> = {\n${lines.join("\n")}\n};\n`,
);
console.log(`${Object.keys(map).length} etiket yazıldı.${dup.length ? "\nUYARI yinelenen etiketler:\n" + dup.join("\n") : ""}`);
