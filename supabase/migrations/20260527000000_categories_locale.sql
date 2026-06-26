-- =============================================================================
-- categories: locale bazlı yapıya geç
--
-- Önceki migration'da categories.slug UNIQUE idi (tek-dil varsayımı).
-- Şimdi her kategori için TR/EN/ES satırı ayrı tutulacak: UNIQUE(slug, locale).
-- Mevcut TR satırlarına locale='tr' atanır; UUID'ler değişmediği için
-- questions.category_id FK'ları otomatik olarak korunur.
-- =============================================================================

-- 1. locale sütunu ekle (mevcut satırlar 'tr' olur) ---------------------------
alter table public.categories
  add column if not exists locale text not null default 'tr';

-- 2. Eski unique(slug) kısıtlamasını kaldır -----------------------------------
alter table public.categories
  drop constraint if exists categories_slug_key;

-- 3. Yeni unique(slug, locale) kısıtlaması ------------------------------------
alter table public.categories
  add constraint categories_slug_locale_key unique (slug, locale);

-- 4. EN kategori satırlarını ekle --------------------------------------------
insert into public.categories (name, slug, locale, is_premium, sort_order) values
  ('Communication',    'communication', 'en', false, 1),
  ('First Date',       'first_date',    'en', false, 2),
  ('Social Life',      'social_life',   'en', false, 3),
  ('Lifestyle',        'lifestyle',     'en', false, 4),
  ('Values',           'values',        'en', false, 5),
  ('Bold Questions',   'bold',          'en', true,  6)
on conflict (slug, locale) do nothing;

-- 5. ES kategori satırlarını ekle --------------------------------------------
insert into public.categories (name, slug, locale, is_premium, sort_order) values
  ('Comunicación',        'communication', 'es', false, 1),
  ('Primera Cita',        'first_date',    'es', false, 2),
  ('Vida Social',         'social_life',   'es', false, 3),
  ('Estilo de Vida',      'lifestyle',     'es', false, 4),
  ('Valores',             'values',        'es', false, 5),
  ('Preguntas Atrevidas', 'bold',          'es', true,  6)
on conflict (slug, locale) do nothing;

-- 6. Index (locale bazlı sorgular için) ---------------------------------------
create index if not exists idx_categories_locale on public.categories (locale);
