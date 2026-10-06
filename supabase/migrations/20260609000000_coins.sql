-- =============================================================================
-- Coin sistemi (mobil): bakiye = users.room_credits, her hareket credit_transactions'a yazılır.
-- Ekonomi: kayıt +500 · reklam +100 · oda −250 · AI yorum −100 · solo +20 / solo AI −100
--
--  * Tüm yazımlar apply_coins() ile, atomik ve idempotent (aynı user+reason+ref ikinci kez uygulanmaz).
--    Fonksiyon yalnızca service_role tarafından çağrılabilir; istemci hiçbir zaman doğrudan coin yazamaz.
--  * Yeni Supabase Auth kullanıcısı için public.users satırı + 500 kayıt bonusu trigger ile otomatik oluşur.
--  * Mevcut Auth kullanıcıları (public.users satırı olmayanlar) aynı şekilde geriye dönük oluşturulur.
-- =============================================================================
begin;

-- users: tier (paket seviyesi; yalnızca yükselir). is_premium geriye uyum için kalır.
alter table public.users
  add column if not exists tier text not null default 'free';
do $$ begin
  alter table public.users add constraint users_tier_check check (tier in ('free', 'lite', 'premium'));
exception when duplicate_object then null; end $$;

-- Coin hareketleri (audit trail + idempotency)
create table if not exists public.credit_transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  delta         int  not null check (delta <> 0),
  balance_after int  not null check (balance_after >= 0),
  reason        text not null check (reason in (
                  'signup_bonus', 'ad_reward', 'room_create', 'room_create_refund',
                  'ai_commentary', 'ai_commentary_refund', 'solo_reward', 'solo_ai', 'solo_ai_refund',
                  'purchase', 'admin_adjust')),
  ref_id        text,                       -- oda kodu / solo oturumu / satın alma kimliği (idempotency anahtarı)
  created_at    timestamptz not null default now()
);

-- Aynı (kullanıcı, neden, referans) yalnızca bir kez uygulanır
create unique index if not exists uq_credit_tx_ref
  on public.credit_transactions (user_id, reason, ref_id) where ref_id is not null;
create index if not exists idx_credit_tx_user on public.credit_transactions (user_id, created_at desc);

alter table public.credit_transactions enable row level security;
drop policy if exists "credit_tx_read_own" on public.credit_transactions;
create policy "credit_tx_read_own" on public.credit_transactions
  for select using (auth.uid() = user_id);
-- insert/update/delete policy yok: yalnızca service_role (apply_coins)

-- Atomik coin uygulama. Dönüş: yeni bakiye ve işlemin gerçekten uygulanıp uygulanmadığı (idempotent tekrar → false).
create or replace function public.apply_coins(
  p_user   uuid,
  p_delta  int,
  p_reason text,
  p_ref    text default null
) returns table (balance int, applied boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
begin
  if p_delta = 0 then
    raise exception 'INVALID_DELTA';
  end if;

  -- Kullanıcı satırı kilitlenir: aynı kullanıcının eşzamanlı işlemleri sıraya girer
  select u.room_credits into v_balance from public.users u where u.id = p_user for update;
  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  -- Idempotency: aynı referansla daha önce uygulandıysa değişiklik yapma
  if p_ref is not null and exists (
    select 1 from public.credit_transactions t
     where t.user_id = p_user and t.reason = p_reason and t.ref_id = p_ref
  ) then
    return query select v_balance, false;
    return;
  end if;

  if v_balance + p_delta < 0 then
    raise exception 'INSUFFICIENT_COINS';
  end if;

  v_balance := v_balance + p_delta;
  update public.users set room_credits = v_balance where id = p_user;
  insert into public.credit_transactions (user_id, delta, balance_after, reason, ref_id)
  values (p_user, p_delta, v_balance, p_reason, p_ref);

  return query select v_balance, true;
end;
$$;

revoke all on function public.apply_coins(uuid, int, text, text) from public, anon, authenticated;
grant execute on function public.apply_coins(uuid, int, text, text) to service_role;

-- Yeni Auth kullanıcısı → users satırı + 500 coin kayıt bonusu
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, room_credits)
  values (new.id, new.email, 0)
  on conflict (id) do nothing;
  perform public.apply_coins(new.id, 500, 'signup_bonus', new.id::text);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Geriye dönük: users satırı olmayan mevcut Auth kullanıcıları (idempotent: ref = kullanıcı id)
do $$
declare r record;
begin
  for r in select a.id, a.email from auth.users a where not exists (select 1 from public.users u where u.id = a.id) loop
    insert into public.users (id, email, room_credits) values (r.id, r.email, 0) on conflict (id) do nothing;
    perform public.apply_coins(r.id, 500, 'signup_bonus', r.id::text);
  end loop;
end $$;

-- Doğrulama
do $$
declare n int;
begin
  select count(*) into n from auth.users a where not exists (select 1 from public.users u where u.id = a.id);
  if n <> 0 then raise exception 'users satırı olmayan Auth kullanıcısı kaldı: %', n; end if;
  select count(*) into n from public.users u
   where not exists (select 1 from public.credit_transactions t where t.user_id = u.id and t.reason = 'signup_bonus');
  if n <> 0 then raise exception 'kayıt bonusu verilmemiş kullanıcı: %', n; end if;
end $$;

commit;
