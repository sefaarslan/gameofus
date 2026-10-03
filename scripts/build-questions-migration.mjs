// seeds/v2 → supabase/migrations/*_questions_v2_*.sql
//   node scripts/build-questions-migration.mjs
// Tasarım:
//   schema  : insight_tag kolonu + kategorilerin (ad/sıra/ilişki türü) upsert'i
//   part1..N: yeni soruları PASİF ekler (oda açma etkilenmez), idempotent (on conflict do nothing)
//   activate: sayı/kategori/seçenek doğrulaması + eski soruları pasife alıp yenileri aktifleştirir (atomik)
// Kimlikler UUID v5 (belirlenimci): aynı soru her zaman aynı id'yi alır.
import crypto from "node:crypto";
import { readdirSync, writeFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";

const STAMP = "20260604";
const OUT = "supabase/migrations";
const LANGS = ["tr", "en", "es"];
const NS = "6f1d2c1e-9b52-4c0e-8a2f-3c7d5e1a9b00"; // proje sabiti

function uuidv5(name) {
  const ns = Buffer.from(NS.replace(/-/g, ""), "hex");
  const h = crypto.createHash("sha1").update(ns).update(name).digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

const DIR = resolve("seeds/v2");
const cats = [];
for (const f of readdirSync(DIR).filter((f) => f.endsWith(".ts") && !["types.ts", "helpers.ts"].includes(f))) {
  const mod = await import(pathToFileURL(join(DIR, f)).href);
  for (const v of Object.values(mod)) if (v?.slug && v?.questions) cats.push(v);
}
cats.sort((a, b) => a.sortOrder - b.sortOrder);
const total = cats.reduce((n, c) => n + c.questions.length, 0) * LANGS.length;

// Önceki çalıştırmanın çıktılarını temizle
for (const f of readdirSync(OUT).filter((f) => f.startsWith(STAMP) && f.includes("_questions_v2_"))) rmSync(join(OUT, f));

const header = (title) => `-- =============================================================================
-- ${title}
-- Üreten: scripts/build-questions-migration.mjs (seeds/v2). Elle düzenleme; seed'i değiştirip yeniden üret.
-- =============================================================================
`;

// ── schema ───────────────────────────────────────────────────────────────────
{
  const rows = [];
  for (const c of cats) for (const l of LANGS) {
    rows.push(`  (${q(c.names[l])}, ${q(c.slug)}, ${q(l)}, ${c.isPremium}, ${c.sortOrder}, ${q("{" + c.relationshipTypes.join(",") + "}")}::text[])`);
  }
  writeFileSync(`${OUT}/${STAMP}000000_questions_v2_schema.sql`, `${header("Soru seti v2 — 1/N: şema + kategoriler")}
begin;

-- Sorunun AI yorumu için tema etiketi (kullanıcıya görünmez). Eski sorularda null kalır.
alter table public.questions add column if not exists insight_tag text;

-- Kategoriler: mevcutlar (slug+locale) güncellenir, yeniler eklenir. Odalar category_id ile bağlı kaldığı için satırlar silinmez.
insert into public.categories (name, slug, locale, is_premium, sort_order, relationship_types) values
${rows.join(",\n")}
on conflict (slug, locale) do update set
  name = excluded.name,
  is_premium = excluded.is_premium,
  sort_order = excluded.sort_order,
  relationship_types = excluded.relationship_types;

commit;
`);
}

// ── parts: kategorileri yaklaşık eşit parçalara böl ─────────────────────────
const PARTS = [
  ["friend_test", "wild_scenarios", "social_life"],
  ["first_date", "romance", "bold"],
  ["future", "home_money"],
  ["communication", "lifestyle", "values"],
];
const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c]));
const used = new Set(PARTS.flat());
for (const c of cats) if (!used.has(c.slug)) throw new Error(`Bölümlere atanmamış kategori: ${c.slug}`);

PARTS.forEach((slugs, pi) => {
  const qRows = [], oRows = [];
  for (const slug of slugs) {
    const c = bySlug[slug];
    for (const sq of c.questions) {
      const tg = uuidv5(`${c.slug}:${sq.tag}`);
      for (const l of LANGS) {
        const id = uuidv5(`${c.slug}:${sq.tag}:${l}`);
        qRows.push(`  (${q(id)}, ${q(sq.mode)}, ${q(sq[l].text)}, ${q(l)}, ${q(tg)}, ${q(sq.tag)}, ${q(c.slug)})`);
        (sq[l].options ?? []).forEach((o, i) => oRows.push(`  (${q(uuidv5(`${id}:opt:${i + 1}`))}, ${q(id)}, ${q(o)}, ${i + 1})`));
      }
    }
  }
  writeFileSync(`${OUT}/${STAMP}0${pi + 1}0000_questions_v2_part${pi + 1}.sql`, `${header(`Soru seti v2 — ${pi + 2}/${PARTS.length + 2}: sorular (${slugs.join(", ")})`)}
-- Yeni sorular PASİF eklenir; aktifleştirme son adımdadır. Tekrar çalıştırmak güvenlidir (on conflict do nothing).
begin;

insert into public.questions (id, mode, question_text, locale, is_active, translation_group_id, category_id, insight_tag)
select v.id::uuid, v.mode::public.game_mode, v.text, v.locale, false, v.tg::uuid, c.id, v.tag
from (values
${qRows.join(",\n")}
) as v(id, mode, text, locale, tg, tag, slug)
join public.categories c on c.slug = v.slug and c.locale = v.locale
on conflict (id) do nothing;

insert into public.question_options (id, question_id, option_text, sort_order) values
${oRows.join(",\n")}
on conflict (id) do nothing;

commit;
`);
});

// ── activate ────────────────────────────────────────────────────────────────
writeFileSync(`${OUT}/${STAMP}090000_questions_v2_activate.sql`, `${header(`Soru seti v2 — ${PARTS.length + 2}/${PARTS.length + 2}: doğrula + aktifleştir`)}
-- Önceki parçaların hepsi çalıştırılmış olmalı. Doğrulama başarısızsa hiçbir şey değişmez (istisna → rollback).
begin;

do $$
declare n int;
begin
  select count(*) into n from public.questions where insight_tag is not null;
  if n <> ${total} then
    raise exception 'Beklenen ${total} yeni soru, bulunan % — önceki parçalar eksik olabilir', n;
  end if;

  if exists (select 1 from public.questions where insight_tag is not null and category_id is null) then
    raise exception 'Kategorisi eşleşmeyen yeni soru var';
  end if;

  if exists (
    select 1 from public.questions q
    where q.insight_tag is not null and q.mode in ('prediction', 'orderline')
      and (select count(*) from public.question_options o where o.question_id = q.id) <> 4
  ) then
    raise exception 'Seçenek sayısı 4 olmayan prediction/orderline sorusu var';
  end if;

  if exists (
    select 1 from public.questions q
    where q.insight_tag is not null and q.mode = 'secret_choice'
      and exists (select 1 from public.question_options o where o.question_id = q.id)
  ) then
    raise exception 'Seçeneği olan secret_choice sorusu var';
  end if;
end $$;

-- Eski sorular (insight_tag null) pasife alınır: silinmez, mevcut odalar/sonuçlar/geçmiş bozulmaz.
update public.questions set is_active = false where insight_tag is null and is_active;
-- Yeni sorular aktifleşir.
update public.questions set is_active = true where insight_tag is not null and not is_active;

commit;
`);
console.log(`${cats.length} kategori, ${total} soru → ${OUT}/ (${STAMP}*_questions_v2_*.sql)`);
