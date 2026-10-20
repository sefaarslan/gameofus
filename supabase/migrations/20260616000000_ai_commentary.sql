-- =============================================================================
-- AI yorum (ikili sonuç) — YALNIZCA MOBİL.
--
--  * users.ai_consent_at / ai_consent_version: kullanıcının AI yorum rızası (sürüm metni mobil tarafta; sunucu yalnızca saklar).
--  * ai_commentaries: bir odanın AI yorumu. Bir oda için aynı anda yalnızca BİR aktif kayıt (generating | ready) —
--    kısmi unique index ile yarışa karşı güvenli. Başarısız denemeler (failed) saklanır; yeniden denemede `attempt` artar,
--    böylece coin referansı (oda:attempt) benzersiz kalır. Oda silinince (90 gün temizliği / hesap silme) yorum da silinir;
--    satın alan kullanıcı silinince onun satın aldığı yorumlar da silinir (cascade).
--  * ai_usage_daily: sağlayıcı başına günlük kullanım toplamı (kişisel veri yok) — ücretsiz katman kapasitesini korumak için.
--  * RLS açık ve hiç policy yok: yalnızca service role (sunucu) erişir.
-- =============================================================================
begin;

alter table public.users
  add column if not exists ai_consent_at timestamptz,
  add column if not exists ai_consent_version text;

create table if not exists public.ai_commentaries (
  id                uuid primary key default gen_random_uuid(),
  room_id           uuid not null references public.rooms (id) on delete cascade,
  purchased_by      uuid not null references public.users (id) on delete cascade,
  locale            text not null,
  status            text not null check (status in ('generating', 'ready', 'failed')),
  attempt           int  not null check (attempt >= 1),
  content           jsonb,
  consent_version   text not null,
  model             text,
  prompt_version    text,
  prompt_tokens     int,
  completion_tokens int,
  error_kind        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (room_id, attempt)
);

-- Bir odada aynı anda yalnızca bir aktif (üretiliyor ya da hazır) kayıt
create unique index if not exists uq_ai_commentaries_active
  on public.ai_commentaries (room_id) where status in ('generating', 'ready');
-- "Satın aldığım yorumlar" listesi
create index if not exists idx_ai_commentaries_buyer
  on public.ai_commentaries (purchased_by, created_at desc) where status = 'ready';

alter table public.ai_commentaries enable row level security;
revoke all on public.ai_commentaries from anon, authenticated;

-- Atomik "üretim başlat": sıradaki attempt numarasıyla `generating` satırı açar. Aktif kayıt varsa (ya da eşzamanlı başka bir
-- istek aynı numarayı aldıysa) hiçbir şey eklemez ve boş döner; çağıran mevcut kaydı yeniden okur.
create or replace function public.ai_commentary_begin(p_room uuid, p_user uuid, p_locale text, p_consent text)
returns table (id uuid, attempt int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt int;
  v_id uuid;
begin
  select coalesce(max(c.attempt), 0) + 1 into v_attempt from public.ai_commentaries c where c.room_id = p_room;
  insert into public.ai_commentaries (room_id, purchased_by, locale, status, attempt, consent_version)
  values (p_room, p_user, p_locale, 'generating', v_attempt, p_consent)
  returning public.ai_commentaries.id into v_id;
  return query select v_id, v_attempt;
exception when unique_violation then
  return;
end;
$$;
revoke all on function public.ai_commentary_begin(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.ai_commentary_begin(uuid, uuid, text, text) to service_role;

-- Günlük sağlayıcı kullanımı (UTC günü). Kişisel veri içermez.
create table if not exists public.ai_usage_daily (
  day      date not null,
  provider text not null,
  requests int  not null default 0,
  tokens   int  not null default 0,
  failures int  not null default 0,
  primary key (day, provider)
);
alter table public.ai_usage_daily enable row level security;
revoke all on public.ai_usage_daily from anon, authenticated;

create or replace function public.ai_usage_add(p_provider text, p_requests int, p_tokens int, p_failures int)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.ai_usage_daily as u (day, provider, requests, tokens, failures)
  values ((now() at time zone 'utc')::date, p_provider, p_requests, p_tokens, p_failures)
  on conflict (day, provider) do update
    set requests = u.requests + excluded.requests,
        tokens   = u.tokens   + excluded.tokens,
        failures = u.failures + excluded.failures;
$$;
revoke all on function public.ai_usage_add(text, int, int, int) from public, anon, authenticated;
grant execute on function public.ai_usage_add(text, int, int, int) to service_role;

commit;
