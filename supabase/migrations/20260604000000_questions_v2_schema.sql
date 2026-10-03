-- =============================================================================
-- Soru seti v2 — 1/N: şema + kategoriler
-- Üreten: scripts/build-questions-migration.mjs (seeds/v2). Elle düzenleme; seed'i değiştirip yeniden üret.
-- =============================================================================

begin;

-- Sorunun AI yorumu için tema etiketi (kullanıcıya görünmez). Eski sorularda null kalır.
alter table public.questions add column if not exists insight_tag text;

-- Kategoriler: mevcutlar (slug+locale) güncellenir, yeniler eklenir. Odalar category_id ile bağlı kaldığı için satırlar silinmez.
insert into public.categories (name, slug, locale, is_premium, sort_order, relationship_types) values
  ('Kanka Testi', 'friend_test', 'tr', false, 1, '{friend}'::text[]),
  ('Bestie Test', 'friend_test', 'en', false, 1, '{friend}'::text[]),
  ('Test de Colegas', 'friend_test', 'es', false, 1, '{friend}'::text[]),
  ('Çılgın Senaryolar', 'wild_scenarios', 'tr', false, 2, '{friend}'::text[]),
  ('Wild Scenarios', 'wild_scenarios', 'en', false, 2, '{friend}'::text[]),
  ('Escenarios locos', 'wild_scenarios', 'es', false, 2, '{friend}'::text[]),
  ('Tanışma', 'first_date', 'tr', false, 3, '{dating}'::text[]),
  ('Getting to Know You', 'first_date', 'en', false, 3, '{dating}'::text[]),
  ('Conociéndonos', 'first_date', 'es', false, 3, '{dating}'::text[]),
  ('Romantizm', 'romance', 'tr', false, 4, '{dating}'::text[]),
  ('Romance', 'romance', 'en', false, 4, '{dating}'::text[]),
  ('Romance', 'romance', 'es', false, 4, '{dating}'::text[]),
  ('Birlikte Gelecek', 'future', 'tr', false, 5, '{partner}'::text[]),
  ('Future Together', 'future', 'en', false, 5, '{partner}'::text[]),
  ('Futuro juntos', 'future', 'es', false, 5, '{partner}'::text[]),
  ('Ev & Para', 'home_money', 'tr', false, 6, '{partner}'::text[]),
  ('Home & Money', 'home_money', 'en', false, 6, '{partner}'::text[]),
  ('Casa y dinero', 'home_money', 'es', false, 6, '{partner}'::text[]),
  ('Sosyal Hayat', 'social_life', 'tr', false, 7, '{friend}'::text[]),
  ('Social Life', 'social_life', 'en', false, 7, '{friend}'::text[]),
  ('Vida social', 'social_life', 'es', false, 7, '{friend}'::text[]),
  ('İletişim', 'communication', 'tr', false, 8, '{friend,dating,partner}'::text[]),
  ('Communication', 'communication', 'en', false, 8, '{friend,dating,partner}'::text[]),
  ('Comunicación', 'communication', 'es', false, 8, '{friend,dating,partner}'::text[]),
  ('Yaşam Tarzı', 'lifestyle', 'tr', false, 9, '{friend,dating,partner}'::text[]),
  ('Lifestyle', 'lifestyle', 'en', false, 9, '{friend,dating,partner}'::text[]),
  ('Estilo de vida', 'lifestyle', 'es', false, 9, '{friend,dating,partner}'::text[]),
  ('Değerler', 'values', 'tr', false, 10, '{friend,dating,partner}'::text[]),
  ('Values', 'values', 'en', false, 10, '{friend,dating,partner}'::text[]),
  ('Valores', 'values', 'es', false, 10, '{friend,dating,partner}'::text[]),
  ('Cesur Sorular', 'bold', 'tr', true, 11, '{dating,partner}'::text[]),
  ('Bold Questions', 'bold', 'en', true, 11, '{dating,partner}'::text[]),
  ('Preguntas atrevidas', 'bold', 'es', true, 11, '{dating,partner}'::text[])
on conflict (slug, locale) do update set
  name = excluded.name,
  is_premium = excluded.is_premium,
  sort_order = excluded.sort_order,
  relationship_types = excluded.relationship_types;

commit;
