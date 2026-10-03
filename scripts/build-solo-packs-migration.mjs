// seeds/solo → supabase/migrations/20260608000000_solo_packs.sql
//   node scripts/build-solo-packs-migration.mjs
// Setler (deste): senaryolara pack_key/pack_position, oturuma pack_key; 5 yeni senaryo; emekli senaryolar pasife alınır.
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
const PACKS = ["friend-101", "friend-102", "friend-103", "romantic-101", "romantic-102", "romantic-103"];

// Yeni senaryolar (n >= 11): ilk migration'da yoktu
const fresh = list.filter((sc) => sc.n >= 11);
const insertRows = [];
for (const sc of fresh) {
  const key = `${sc.tag}:${sc.n}`;
  const tg = uuidv5(`red_flag:${key}`);
  for (const l of ["tr", "en", "es"]) insertRows.push(`  (${q(uuidv5(`red_flag:${key}:${l}`))}, 'red_flag', ${q(key)}, ${q(tg)}, ${q(l)}, ${q(sc[l])}, ${q(sc.tag)})`);
}

const slots = list.filter((sc) => sc.pack).map((sc) => `  (${q(`${sc.tag}:${sc.n}`)}, ${q(sc.pack)}, ${sc.pos})`);
const retired = list.filter((sc) => sc.inactive).map((sc) => q(`${sc.tag}:${sc.n}`));
const activeCount = list.filter((sc) => !sc.inactive).length * 3;

writeFileSync("supabase/migrations/20260608000000_solo_packs.sql", `-- =============================================================================
-- Solo oyun: setler (deste) — Red Flag Mayın Tarlası
-- Üreten: scripts/build-solo-packs-migration.mjs (seeds/solo). Elle düzenleme; seed'i değiştirip yeniden üret.
--
-- Her set 9 sabit kart (sabit sıra). Aynı settekiler aynı kartları oynar → yüzdeler karşılaştırılabilir.
--   friend-101..103   : "Arkadaşlık ilişkilerinde"
--   romantic-101..103 : "Gönül ilişkilerinde"
--   104-106           : ileride (mobilde açılacak); şimdilik içeriksiz.
-- Hangi senaryonun hangi sette/kaçıncı sırada olduğu solo_scenarios.pack_key / pack_position; oturum hangi seti
-- oynadığını solo_sessions.pack_key ile saklar. Hiçbir sette yer almayan senaryolar silinmez, pasife alınır.
-- =============================================================================
begin;

alter table public.solo_scenarios add column if not exists pack_key      text;
alter table public.solo_scenarios add column if not exists pack_position smallint;
alter table public.solo_sessions  add column if not exists pack_key      text;

create unique index if not exists uq_solo_scenarios_pack_slot
  on public.solo_scenarios (game, pack_key, pack_position, locale) where pack_key is not null;
create index if not exists idx_solo_scenarios_pack
  on public.solo_scenarios (game, pack_key, locale) where is_active and pack_key is not null;
create index if not exists idx_solo_sessions_pack on public.solo_sessions (pack_key) where pack_key is not null;

-- Arkadaşlık setlerini tamamlayan yeni senaryolar
insert into public.solo_scenarios (id, game, scenario_key, translation_group_id, locale, scenario_text, insight_tag) values
${insertRows.join(",\n")}
on conflict (id) do nothing;

-- Set yerleşimi (3 dilde aynı slot)
update public.solo_scenarios s
   set pack_key = v.pack_key, pack_position = v.pos
  from (values
${slots.join(",\n")}
  ) as v(scenario_key, pack_key, pos)
 where s.game = 'red_flag' and s.scenario_key = v.scenario_key;

-- Hiçbir sette yer almayanlar pasife alınır (silinmez; geçmiş oturumlar bu kimliklere başvurabilir)
update public.solo_scenarios
   set is_active = false
 where game = 'red_flag' and scenario_key in (${retired.join(", ")});

do $$
declare
  p text; l text; n int;
begin
  foreach p in array array[${PACKS.map(q).join(", ")}] loop
    foreach l in array array['tr', 'en', 'es'] loop
      select count(*) into n from public.solo_scenarios
       where game = 'red_flag' and pack_key = p and locale = l and is_active;
      if n <> 9 then
        raise exception 'set % (%): beklenen 9 aktif kart, bulunan %', p, l, n;
      end if;
    end loop;
  end loop;

  select count(*) into n from public.solo_scenarios where game = 'red_flag' and is_active and pack_key is null;
  if n <> 0 then
    raise exception 'sette olmayan aktif senaryo kaldı: %', n;
  end if;

  select count(*) into n from public.solo_scenarios where game = 'red_flag' and is_active;
  if n <> ${activeCount} then
    raise exception 'beklenen ${activeCount} aktif senaryo satırı, bulunan %', n;
  end if;
end $$;

commit;
`);
console.log(`${fresh.length} yeni senaryo, ${slots.length} yerleşim, ${retired.length} emekli → supabase/migrations/20260608000000_solo_packs.sql`);
