-- =============================================================================
-- users: zaman bazlı premium → kalıcı is_premium + room_credits
--
-- Eski model: premium_until timestamptz (süre dolunca ücretsiz).
-- Yeni model: is_premium boolean (kalıcı, süresi yok) + room_credits int
--             (tüketilebilir oda kurma hakkı, mobile IAP ile yüklenebilir).
--
-- Geriye dönük uyumluluk:
--   - Web'de login yoktu (Faz 1); users tablosunda production verisi yok.
--   - Yeni sütunlar güvenli default'larla ekleniyor:
--     is_premium = false (ücretsiz), room_credits = 0.
-- =============================================================================

-- 1. Yeni sütunları ekle -------------------------------------------------------
alter table public.users
  add column if not exists is_premium  boolean not null default false,
  add column if not exists room_credits int     not null default 0;

-- 2. Eski sütunu kaldır -------------------------------------------------------
alter table public.users
  drop column if exists premium_until;
