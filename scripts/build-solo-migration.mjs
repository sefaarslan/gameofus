// seeds/solo → supabase/migrations/20260605000000_solo_red_flag.sql
//   node scripts/build-solo-migration.mjs
// Kimlikler UUID v5 (belirlenimci): aynı senaryo her zaman aynı id'yi alır.
import crypto from "node:crypto";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const NS = "6f1d2c1e-9b52-4c0e-8a2f-3c7d5e1a9b00";
const uuidv5 = (name) => {
  const ns = Buffer.from(NS.replace(/-/g, ""), "hex");
  const h = crypto.createHash("sha1").update(ns).update(name).digest();
  h[6] = (h[6] & 0x0f) | 0x50; h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
};
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

const { redFlagScenarios: list } = await import(pathToFileURL(resolve("seeds/solo/red-flag.ts")).href);
const rows = [];
for (const sc of list) {
  const key = `${sc.tag}:${sc.n}`;
  const tg = uuidv5(`red_flag:${key}`);
  for (const l of ["tr", "en", "es"]) rows.push(`  (${q(uuidv5(`red_flag:${key}:${l}`))}, 'red_flag', ${q(key)}, ${q(tg)}, ${q(l)}, ${q(sc[l])}, ${q(sc.tag)})`);
}

writeFileSync("supabase/migrations/20260605000000_solo_red_flag.sql", `-- =============================================================================
-- Solo oyunlar: Red Flag Mayın Tarlası
-- Üreten: scripts/build-solo-migration.mjs (seeds/solo). Elle düzenleme; seed'i değiştirip yeniden üret.
--
-- solo_scenarios : senaryo havuzu (satır bazlı locale; "doğru cevap" yoktur)
-- solo_sessions  : oyun oturumu — sunucu 9 senaryoyu seçer, cevaplar tek istekle gelir.
--                  Web'de anonim (user_id null, token_hash); mobilde user_id dolar ve coin ödülü
--                  oturum başına yalnızca bir kez (coins_awarded) verilir.
-- RLS açık, policy yok: tüm erişim token doğrulayan sunucu endpoint'leri üzerinden (service role).
-- =============================================================================
begin;

create table if not exists public.solo_scenarios (
  id                   uuid primary key default gen_random_uuid(),
  game                 text not null default 'red_flag',
  scenario_key         text not null,           -- ör. 'boundaries:1' (tema:sıra)
  translation_group_id uuid not null,
  locale               text not null,
  scenario_text        text not null,
  insight_tag          text not null,           -- boundaries | trust | communication | jealousy | money_lifestyle | respect
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  unique (game, scenario_key, locale)
);

create index if not exists idx_solo_scenarios_pool on public.solo_scenarios (game, locale) where is_active;

create table if not exists public.solo_sessions (
  id            uuid primary key default gen_random_uuid(),
  game          text not null default 'red_flag',
  locale        text not null,
  platform      text not null default 'web' check (platform in ('web', 'mobile')),
  user_id       uuid references public.users (id) on delete set null,
  token_hash    text not null,
  scenario_ids  uuid[] not null,
  answers       jsonb,                          -- { "<scenario_id>": "green" | "yellow" | "red" }
  status        text not null default 'started' check (status in ('started', 'completed')),
  coins_awarded int not null default 0,
  ai_analysis   text,                           -- planlanan (mobil, 100 coin)
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index if not exists idx_solo_sessions_created_at on public.solo_sessions (created_at);
create index if not exists idx_solo_sessions_user on public.solo_sessions (user_id) where user_id is not null;

alter table public.solo_scenarios enable row level security;
alter table public.solo_sessions  enable row level security;

insert into public.solo_scenarios (id, game, scenario_key, translation_group_id, locale, scenario_text, insight_tag) values
${rows.join(",\n")}
on conflict (id) do nothing;

do $$
declare n int;
begin
  select count(*) into n from public.solo_scenarios where game = 'red_flag' and is_active;
  if n < ${rows.length} then
    raise exception 'Beklenen en az ${rows.length} aktif senaryo, bulunan %', n;
  end if;
end $$;

commit;
`);
console.log(`${list.length} senaryo × 3 dil = ${rows.length} satır → supabase/migrations/20260605000000_solo_red_flag.sql`);
