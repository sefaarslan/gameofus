-- =============================================================================
-- categories tablosu + questions.category_id migration
--
-- questions.category (text) → questions.category_id (uuid FK)
-- Mevcut veri slug eşleşmesiyle korunur.
-- =============================================================================

-- 1. categories tablosu -------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  is_premium boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 2. Mevcut text kategorileri seed et (slug = eski category değerleri) --------
insert into public.categories (name, slug, is_premium, sort_order) values
  ('İletişim',       'communication', false, 1),
  ('İlk Adım',       'first_date',    false, 2),
  ('Sosyal Hayat',   'social_life',   false, 3),
  ('Yaşam Tarzı',    'lifestyle',     false, 4),
  ('Değerler',       'values',        false, 5),
  ('Cesur Sorular',  'bold',          true,  6)
on conflict (slug) do nothing;

-- 3. questions.category_id kolonu ekle (nullable) -----------------------------
alter table public.questions
  add column if not exists category_id uuid references public.categories (id);

-- 4. Mevcut category text → category_id (slug eşleşmesiyle) ------------------
update public.questions q
set category_id = c.id
from public.categories c
where q.category = c.slug
  and q.category_id is null;

-- 5. Eski category text kolonu kaldır -----------------------------------------
alter table public.questions
  drop column if exists category;

-- 6. RLS -----------------------------------------------------------------------
alter table public.categories enable row level security;

drop policy if exists "categories_read" on public.categories;
create policy "categories_read" on public.categories
  for select to anon, authenticated
  using (true);

-- 7. Index ---------------------------------------------------------------------
create index if not exists idx_questions_category_id on public.questions (category_id);
