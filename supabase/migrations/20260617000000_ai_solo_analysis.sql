-- =============================================================================
-- Solo oyunlar için AI analizi (mobil): oyundan bağımsız durum makinesi.
--
--  * `solo_sessions.game` (zaten var, varsayılan 'red_flag') oyun türünü taşır; AI adaptörü bu değere göre seçilir.
--    Yeni solo oyun = yeni adaptör; tablo/endpoint/coin akışı değişmez.
--  * ai_solo_analyses: oda yorumlarındaki `ai_commentaries` ile aynı durum makinesi (status, attempt, purchased_by, locale,
--    consent_version, model, prompt_version, token sayıları, error_kind). CANLI `ai_commentaries` tablosuna dokunmamak için
--    ayrı tablo. Bir oturumda aynı anda yalnızca BİR aktif kayıt (generating | ready): kısmi unique index ile yarışa karşı güvenli.
--  * Oturum silinince (90 günlük temizlik / hesap silme → solo_sessions silinir) analiz de silinir (cascade); satın alan
--    kullanıcı silinince onun satın aldığı analizler de silinir.
--  * RLS açık ve hiç policy yok: yalnızca service role (sunucu) erişir.
--  * credit_transactions.reason zaten 'solo_ai' ve 'solo_ai_refund' değerlerini içerir (coin akışı için ek değişiklik yok).
-- =============================================================================
begin;

create table if not exists public.ai_solo_analyses (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid not null references public.solo_sessions (id) on delete cascade,
  purchased_by      uuid not null references public.users (id) on delete cascade,
  game              text not null,
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
  unique (session_id, attempt)
);

create unique index if not exists uq_ai_solo_active
  on public.ai_solo_analyses (session_id) where status in ('generating', 'ready');
create index if not exists idx_ai_solo_buyer
  on public.ai_solo_analyses (purchased_by, created_at desc) where status = 'ready';
create index if not exists idx_ai_solo_session on public.ai_solo_analyses (session_id);

alter table public.ai_solo_analyses enable row level security;
revoke all on public.ai_solo_analyses from anon, authenticated;

-- Atomik "üretim başlat": sıradaki attempt numarasıyla `generating` satırı açar. Aktif kayıt varsa (ya da eşzamanlı başka bir istek
-- aynı numarayı aldıysa) hiçbir şey eklemez ve boş döner; çağıran mevcut kaydı yeniden okur.
create or replace function public.ai_solo_begin(p_session uuid, p_user uuid, p_game text, p_locale text, p_consent text)
returns table (id uuid, attempt int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt int;
  v_id uuid;
begin
  select coalesce(max(a.attempt), 0) + 1 into v_attempt from public.ai_solo_analyses a where a.session_id = p_session;
  insert into public.ai_solo_analyses (session_id, purchased_by, game, locale, status, attempt, consent_version)
  values (p_session, p_user, p_game, p_locale, 'generating', v_attempt, p_consent)
  returning public.ai_solo_analyses.id into v_id;
  return query select v_id, v_attempt;
exception when unique_violation then
  return;
end;
$$;
revoke all on function public.ai_solo_begin(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.ai_solo_begin(uuid, uuid, text, text, text) to service_role;

commit;
