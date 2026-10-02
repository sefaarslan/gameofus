// Kodda kullanılan Material Symbols ikonlarından küçük bir font alt kümesi üretir:
//   node scripts/build-icon-font.mjs   (veya: npm run icons)
// Çıktı: app/fonts/material-symbols.woff2 — next/font/local ile self-host edilir.
// Yeni bir ikon eklediğinde bu script'i yeniden çalıştır.
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";

const ROOTS = ["app", "components"];
const OUT = "app/fonts/material-symbols.woff2";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function* walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if ([".ts", ".tsx"].includes(extname(p))) yield p;
  }
}

// Aday: tırnak içindeki snake_case sözcükler (ikon haritaları) + material-symbols span'larının metni
// (alt satıra yazılmış / className'inde `=>` olan span'lar dahil)
const candidates = new Set();
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(/["'`]([a-z][a-z0-9_]{2,})["'`]/g)) candidates.add(m[1]);
    for (const m of src.matchAll(/material-symbols-outlined[\s\S]{0,300}?>\s*([a-z][a-z0-9_]+)\s*</g)) candidates.add(m[1]);
  }
}

const metaRes = await fetch("https://fonts.google.com/metadata/icons?key=material_symbols&incomplete=true");
const meta = JSON.parse((await metaRes.text()).replace(/^\)\]\}'\n/, ""));
const valid = new Set(meta.icons.map((i) => i.name));
const icons = [...candidates].filter((n) => valid.has(n)).sort();

// FILL eksenini (0..1) koruyup diğer eksenleri sabitle → küçük dosya
const css = await (
  await fetch(
    `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=${icons.join(",")}&display=block`,
    { headers: { "User-Agent": UA } },
  )
).text();
const url = css.match(/url\((https:[^)]+)\)/)?.[1];
if (!url) throw new Error("Font URL bulunamadı:\n" + css);

const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
mkdirSync("app/fonts", { recursive: true });
writeFileSync(OUT, buf);
console.log(`${icons.length} ikon, ${(buf.length / 1024).toFixed(1)} KB → ${OUT}`);
console.log(icons.join(" "));
