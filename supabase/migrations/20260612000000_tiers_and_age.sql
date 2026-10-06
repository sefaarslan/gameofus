-- =============================================================================
-- Tier bazlı kategori erişimi + yaş doğrulama + AI yorum alanı (mobil)
--
--  * categories.min_tier  : kategoriye erişim için gereken paket (free / lite / premium). is_premium geriye uyum için
--                           kalır ve min_tier <> 'free' ile tutarlı olmak ZORUNDA (check). Slug bazında tüm dillerde aynı.
--  * categories.min_age   : kategori için asgari yaş (Cesur Sorular = 18). Hem kurucu hem partner için sunucuda doğrulanır.
--  * users.birth_date     : kurucunun doğum tarihi (profilde saklanır; oda kurarken güncellenebilir).
--  * rooms.partner_birth_date : yalnızca bu oda için, kurucu tarafından girilir (3. kişi verisi: oda silinince birlikte gider).
--  * results.ai_commentary: AI yorum önbelleği (ileride).
-- =============================================================================
begin;

alter table public.categories add column if not exists min_tier text not null default 'free';
alter table public.categories add column if not exists min_age  int  not null default 0;

do $$ begin
  alter table public.categories add constraint categories_min_tier_check check (min_tier in ('free', 'lite', 'premium'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.categories add constraint categories_min_age_check check (min_age between 0 and 21);
exception when duplicate_object then null; end $$;

-- Cesur Sorular: premium + 18 yaş (+ yalnızca sevgili/hayat arkadaşı: relationship_types zaten böyle)
update public.categories set min_tier = 'premium', min_age = 18 where slug = 'bold';
-- Başka premium işaretli kategori varsa Lite sayılır
update public.categories set min_tier = 'lite' where is_premium and min_tier = 'free';

do $$ begin
  alter table public.categories add constraint categories_premium_tier_check check (is_premium = (min_tier <> 'free'));
exception when duplicate_object then null; end $$;

alter table public.users add column if not exists birth_date date;
do $$ begin
  alter table public.users add constraint users_birth_date_check
    check (birth_date is null or (birth_date <= current_date and birth_date >= date '1900-01-01'));
exception when duplicate_object then null; end $$;

alter table public.rooms add column if not exists partner_birth_date date;
do $$ begin
  alter table public.rooms add constraint rooms_partner_birth_date_check
    check (partner_birth_date is null or (partner_birth_date <= current_date and partner_birth_date >= date '1900-01-01'));
exception when duplicate_object then null; end $$;

alter table public.results add column if not exists ai_commentary text;

-- Doğrulama
do $$
declare n int;
begin
  select count(*) into n from public.categories where slug = 'bold' and min_tier = 'premium' and min_age = 18;
  if n <> 3 then raise exception 'bold kategorisi 3 dilde premium/18 olmalı, bulunan %', n; end if;
  select count(*) into n from public.categories where slug <> 'bold' and (min_tier <> 'free' or min_age <> 0);
  if n <> 0 then raise exception 'bold dışında kilitli kategori olmamalı: %', n; end if;
end $$;

commit;
