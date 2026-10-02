-- =============================================================================
-- İlişki türü: rooms.relationship_type + categories.relationship_types
--
-- Slug'lar teknik değerdir (friend / dating / partner); eğlenceli görünen
-- isimler (Kanka, Sevgili, Hayat Arkadaşı...) yalnızca messages/*.json'dadır.
--
-- Geriye dönük uyumluluk:
--   - rooms.relationship_type nullable — eski odalar ve henüz alanı göndermeyen
--     mobil build'ler null kalır; null ise kategori uyumluluk kontrolü yapılmaz.
--   - categories.relationship_types varsayılanı üç türün tamamıdır.
-- =============================================================================

alter table public.rooms
  add column if not exists relationship_type text
  check (relationship_type in ('friend', 'dating', 'partner'));

alter table public.categories
  add column if not exists relationship_types text[]
  not null default '{friend,dating,partner}';

alter table public.categories
  drop constraint if exists categories_relationship_types_valid;
alter table public.categories
  add constraint categories_relationship_types_valid
  check (relationship_types <@ array['friend', 'dating', 'partner']::text[]
         and cardinality(relationship_types) > 0);

-- İlk Adım: yalnızca sevgili
update public.categories set relationship_types = '{dating}'
  where slug = 'first_date';

-- Cesur Sorular: sevgili + hayat arkadaşı (yaş doğrulaması ayrı iş — bkz. mobil C2b)
update public.categories set relationship_types = '{dating,partner}'
  where slug = 'bold';
