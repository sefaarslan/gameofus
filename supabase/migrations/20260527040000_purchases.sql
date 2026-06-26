-- =============================================================================
-- purchases: mobile IAP satın alma tablosu
--
-- Eski payments tablosu (Lemon Squeezy) yerinde bırakılır; ileriki bir
-- cleanup migration'ında kaldırılabilir. Bu tablo mobile Faz 3'te kullanılır.
-- =============================================================================

create table if not exists public.purchases (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.users (id) on delete cascade,
  product_type            text not null check (product_type in ('premium_package', 'room_credit_pack')),
  provider                text not null check (provider in ('app_store', 'play_store')),
  provider_transaction_id text not null,
  amount                  numeric,
  currency                text not null default 'USD',
  status                  text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  created_at              timestamptz not null default now()
);

alter table public.purchases enable row level security;

-- provider_transaction_id idempotency için unique olmalı
create unique index if not exists purchases_provider_transaction_id_key
  on public.purchases (provider_transaction_id);

-- Kullanıcı kendi satın almalarını görebilir (mobile JWT ile)
drop policy if exists "purchases_read_own" on public.purchases;
create policy "purchases_read_own" on public.purchases
  for select to authenticated
  using (user_id = auth.uid());
