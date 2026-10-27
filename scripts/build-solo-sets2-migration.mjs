// seeds/solo (n >= 21: friend-104…107, romantic-104…107) → supabase/migrations/20260619000000_solo_sets_104_107.sql
//   node scripts/build-solo-sets2-migration.mjs
// Yalnızca EKLER: yeni senaryolar doğrudan pack_key/pack_position ile eklenir; mevcut satırlar ve setler değişmez.
import crypto from "node:crypto";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const NS = "6f1d2c1e-9b52-4c0e-8a2f-3c7d5e1a9b00"; // build-solo-migration.mjs ile aynı: kimlikler tutarlı
const uuidv5 = (name) => {
  const ns = Buffer.from(NS.replace(/-/g, ""), "hex");
  const h = crypto.createHash("sha1").update(ns).update(name).digest();
  h[6] = (h[6] & 0x0f) | 0x50; h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
};
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

const { redFlagScenarios: list } = await import(pathToFileURL(resolve("seeds/solo/red-flag.ts")).href);
const fresh = list.filter((sc) => sc.n >= 21);
const rows = [];
for (const sc of fresh) {
  const key = `${sc.tag}:${sc.n}`;
  const tg = uuidv5(`red_flag:${key}`);
  for (const l of ["tr", "en", "es"]) {
    rows.push(`  (${q(uuidv5(`red_flag:${key}:${l}`))}, 'red_flag', ${q(key)}, ${q(tg)}, ${q(l)}, ${q(sc[l])}, ${q(sc.tag)}, ${q(sc.pack)}, ${sc.pos})`);
  }
}

writeFileSync("supabase/migrations/20260619000000_solo_sets_104_107.sql", `-- =============================================================================
-- Solo oyun: yeni setler — friend-104…107 ve romantic-104…107 (Red Flag Mayın Tarlası)
-- Üreten: scripts/build-solo-sets2-migration.mjs (seeds/solo/red-flag-sets2.ts). Elle düzenleme; seed'i değiştirip yeniden üret.
--
-- ${fresh.length} yeni senaryo × 3 dil = ${rows.length} satır. Her set 9 kart (6 tema + 3 ekstra); kategori başına 4 set boyunca her tema
-- 6 kez ve ton 2 sağlıklı / 2 gri / 2 endişe verici. Mevcut senaryolar ve 101-103 setleri DEĞİŞMEZ.
-- Setler yalnızca mobilde açılır (webde 101-103); günlük set havuzu 9 aktif senaryosu olan setlerden oluştuğu için
-- bu migration sonrası havuz kategori başına 3'ten 7'ye çıkar.
-- =============================================================================
begin;

insert into public.solo_scenarios (id, game, scenario_key, translation_group_id, locale, scenario_text, insight_tag, pack_key, pack_position) values
${rows.join(",\n")}
on conflict (id) do nothing;

do $$
declare n int;
begin
  select count(*) into n from public.solo_scenarios where game = 'red_flag' and is_active and pack_key ~ '^(friend|romantic)-10[4-7]$';
  if n <> ${rows.length} then raise exception 'Beklenen ${rows.length} aktif satır, bulunan %', n; end if;
end $$;

commit;
`);
console.log(`${fresh.length} senaryo, ${rows.length} satır → supabase/migrations/20260619000000_solo_sets_104_107.sql`);
