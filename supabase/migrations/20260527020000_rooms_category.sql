-- =============================================================================
-- rooms: category_id ekleme + is_premium_room kaldırma
--
-- Oda artık hangi kategoride kurulduğunu category_id ile saklar.
-- category_id, categories tablosundaki rooms.locale ile eşleşen satıra FK'dır.
-- Oda tek dile sabit olduğu için locale bazlı çözümlemeye gerek yoktur.
--
-- Geriye dönük uyumluluk:
--   - category_id nullable — mevcut odalar null kalır; hiçbir endpoint bu
--     alanı zorunlu olarak okumaz.
--   - is_premium_room yeni PRD'de yoktur; create route'da hiç set edilmiyordu
--     (default false). Kaldırılması mevcut hiçbir sorguyu bozmaz.
-- =============================================================================

-- 1. category_id ekle (nullable) ----------------------------------------------
alter table public.rooms
  add column if not exists category_id uuid references public.categories (id);

create index if not exists idx_rooms_category_id on public.rooms (category_id);

-- 2. is_premium_room kaldır (artık PRD'de yok) --------------------------------
alter table public.rooms
  drop column if exists is_premium_room;
