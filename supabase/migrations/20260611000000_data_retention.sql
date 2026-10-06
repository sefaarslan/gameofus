-- =============================================================================
-- Veri saklama / temizleme (Gizlilik Politikası ile uyumlu)
--
--   * Anonim web odaları: erişime kapandıktan (expires_at) 14 gün sonra silinir.
--   * Mobil (giriş yapmış kullanıcıya bağlı) odalar: expires_at + 90 gün sonra silinir (oyun geçmişi 90 gün).
--   * Solo oturumlar: anonim (web) 90 gün; kullanıcıya bağlı (mobil) oluşturulmasından 90 gün sonra silinir.
--   * rate_limits (IP özetleri): 7 gün sonra silinir.
--   * Coin hareketleri (credit_transactions) ve satın alma kayıtları bu işle SİLİNMEZ: coin kayıtları hesap silinene kadar
--     (idempotency ve uyuşmazlık için), satın alma kayıtları yasal süre boyunca (hesap silinince kullanıcıdan ayrılır).
--
-- Metrikler kaybolmasın diye silinmeden ÖNCE kişisel olmayan günlük toplamlar arşiv tablolarına yazılır ve
-- metrics_* görünümleri canlı + arşiv verisini birleştirir (aynı sütunlar). Silmeyi cleanup_expired_data() yapar;
-- /api/cron/cleanup (Vercel Cron, CRON_SECRET) günde bir çağırır.
-- =============================================================================
begin;

-- ── Arşiv tabloları (yalnızca toplamlar; kişisel veri yok) ─────────────────────
create table if not exists public.metrics_funnel_archive (
  day               date   not null,
  game_mode         text,
  relationship_type text,
  locale            text,
  rooms_created     bigint not null,
  guest_joined      bigint not null,
  results_ready     bigint not null
);
create table if not exists public.metrics_participant_archive (
  day          date   not null,
  role         text,
  status       text,
  participants bigint not null
);
create table if not exists public.metrics_feedback_archive (
  day               date   not null,
  game_mode         text,
  relationship_type text,
  locale            text,
  source            text,
  responses         bigint not null,
  rating_sum        bigint not null,
  liked             bigint not null,
  disliked          bigint not null,
  ai_yes            bigint not null,
  ai_maybe          bigint not null,
  ai_no             bigint not null,
  with_comment      bigint not null
);
create index if not exists idx_metrics_funnel_archive_day      on public.metrics_funnel_archive (day);
create index if not exists idx_metrics_participant_archive_day on public.metrics_participant_archive (day);
create index if not exists idx_metrics_feedback_archive_day    on public.metrics_feedback_archive (day);

alter table public.metrics_funnel_archive      enable row level security;
alter table public.metrics_participant_archive enable row level security;
alter table public.metrics_feedback_archive    enable row level security;
revoke all on public.metrics_funnel_archive, public.metrics_participant_archive, public.metrics_feedback_archive from anon, authenticated;

-- ── Görünümler: canlı + arşiv ──────────────────────────────────────────────────
drop view if exists public.metrics_daily_funnel;
create view public.metrics_daily_funnel
with (security_invoker = true) as
with src as (
  select date_trunc('day', r.created_at)::date as day, r.game_mode::text as game_mode, r.relationship_type, r.locale,
         count(*)::bigint                                   as rooms_created,
         (count(*) filter (where g.room_id is not null))::bigint   as guest_joined,
         (count(*) filter (where res.room_id is not null))::bigint as results_ready
    from public.rooms r
    left join (select distinct room_id from public.participants where role = 'guest') g on g.room_id = r.id
    left join (select distinct room_id from public.results) res on res.room_id = r.id
   where not exists (select 1 from public.participants p where p.room_id = r.id and p.display_name like 'TEST-%')
   group by 1, 2, 3, 4
  union all
  select day, game_mode, relationship_type, locale, rooms_created, guest_joined, results_ready
    from public.metrics_funnel_archive
)
select day, game_mode, relationship_type, locale,
       sum(rooms_created)::bigint as rooms_created,
       sum(guest_joined)::bigint  as guest_joined,
       sum(results_ready)::bigint as results_ready,
       round(100.0 * sum(guest_joined) / nullif(sum(rooms_created), 0), 1) as join_rate_pct,
       round(100.0 * sum(results_ready) / nullif(sum(guest_joined), 0), 1) as completion_rate_pct
  from src
 group by 1, 2, 3, 4;

drop view if exists public.metrics_participant_status;
create view public.metrics_participant_status
with (security_invoker = true) as
with src as (
  select date_trunc('day', p.created_at)::date as day, p.role::text as role, p.status::text as status, count(*)::bigint as participants
    from public.participants p
    join public.rooms r on r.id = p.room_id
   where not exists (select 1 from public.participants t where t.room_id = r.id and t.display_name like 'TEST-%')
   group by 1, 2, 3
  union all
  select day, role, status, participants from public.metrics_participant_archive
)
select day, role, status, sum(participants)::bigint as participants from src group by 1, 2, 3;

drop view if exists public.metrics_feedback_summary;
create view public.metrics_feedback_summary
with (security_invoker = true) as
with src as (
  select date_trunc('day', f.created_at)::date as day, f.game_mode, f.relationship_type, f.locale,
         case when f.solo_session_id is not null then 'solo_' || coalesce(f.game, 'unknown') else 'duo' end as source,
         count(*)::bigint as responses,
         sum(f.rating)::bigint as rating_sum,
         (count(*) filter (where f.rating >= 4))::bigint as liked,
         (count(*) filter (where f.rating <= 2))::bigint as disliked,
         (count(*) filter (where f.wants_ai = 'yes'))::bigint as ai_yes,
         (count(*) filter (where f.wants_ai = 'maybe'))::bigint as ai_maybe,
         (count(*) filter (where f.wants_ai = 'no'))::bigint as ai_no,
         (count(*) filter (where f.comment is not null and f.comment <> ''))::bigint as with_comment
    from public.feedback f
   where f.room_id is null
      or not exists (select 1 from public.participants t where t.room_id = f.room_id and t.display_name like 'TEST-%')
   group by 1, 2, 3, 4, 5
  union all
  select day, game_mode, relationship_type, locale, source, responses, rating_sum, liked, disliked, ai_yes, ai_maybe, ai_no, with_comment
    from public.metrics_feedback_archive
)
select day, game_mode, relationship_type, locale,
       sum(responses)::bigint as responses,
       round(sum(rating_sum)::numeric / nullif(sum(responses), 0), 2) as avg_rating,
       sum(liked)::bigint as liked, sum(disliked)::bigint as disliked,
       sum(ai_yes)::bigint as ai_yes, sum(ai_maybe)::bigint as ai_maybe, sum(ai_no)::bigint as ai_no,
       sum(with_comment)::bigint as with_comment,
       source
  from src
 group by day, game_mode, relationship_type, locale, source;

revoke all on public.metrics_daily_funnel, public.metrics_participant_status, public.metrics_feedback_summary from anon, authenticated;

-- ── Temizleme fonksiyonu ───────────────────────────────────────────────────────
-- Her çağrıda en fazla p_batch oda / solo oturumu işler (kalan varsa sonraki çağrı devam eder).
create or replace function public.cleanup_expired_data(
  p_room_days int default 14,   -- anonim web odaları (expires_at sonrası)
  p_solo_days int default 90,   -- anonim solo oturumlar
  p_rate_days int default 7,    -- IP özetleri
  p_batch     int default 500,
  p_user_days int default 90    -- kullanıcıya bağlı (mobil) oda ve solo geçmişi
) returns table (rooms_deleted int, solo_deleted int, rate_deleted int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rooms uuid[];
  v_solo  uuid[];
  v_n_rooms int := 0;
  v_n_solo  int := 0;
  v_n_rate  int := 0;
begin
  -- 1) Eski odalar: anonim web odaları p_room_days, kullanıcıya bağlı (kurucu ya da katılımcı giriş yapmış) odalar p_user_days sonra
  select coalesce(array_agg(id), '{}') into v_rooms from (
    select r.id from public.rooms r
     where r.expires_at < now() - make_interval(days => case
             when r.user_id is not null
               or exists (select 1 from public.participants p where p.room_id = r.id and p.user_id is not null)
             then p_user_days else p_room_days end)
     order by r.expires_at
     limit p_batch
  ) s;

  if cardinality(v_rooms) > 0 then
    -- Önce kişisel olmayan toplamları arşivle (TEST- odaları hariç)
    insert into public.metrics_funnel_archive (day, game_mode, relationship_type, locale, rooms_created, guest_joined, results_ready)
    select date_trunc('day', r.created_at)::date, r.game_mode::text, r.relationship_type, r.locale,
           count(*), count(*) filter (where g.room_id is not null), count(*) filter (where res.room_id is not null)
      from public.rooms r
      left join (select distinct room_id from public.participants where role = 'guest') g on g.room_id = r.id
      left join (select distinct room_id from public.results) res on res.room_id = r.id
     where r.id = any (v_rooms)
       and not exists (select 1 from public.participants p where p.room_id = r.id and p.display_name like 'TEST-%')
     group by 1, 2, 3, 4;

    insert into public.metrics_participant_archive (day, role, status, participants)
    select date_trunc('day', p.created_at)::date, p.role::text, p.status::text, count(*)
      from public.participants p
     where p.room_id = any (v_rooms)
       and not exists (select 1 from public.participants t where t.room_id = p.room_id and t.display_name like 'TEST-%')
     group by 1, 2, 3;

    insert into public.metrics_feedback_archive (day, game_mode, relationship_type, locale, source, responses, rating_sum, liked, disliked, ai_yes, ai_maybe, ai_no, with_comment)
    select date_trunc('day', f.created_at)::date, f.game_mode, f.relationship_type, f.locale, 'duo',
           count(*), sum(f.rating), count(*) filter (where f.rating >= 4), count(*) filter (where f.rating <= 2),
           count(*) filter (where f.wants_ai = 'yes'), count(*) filter (where f.wants_ai = 'maybe'), count(*) filter (where f.wants_ai = 'no'),
           count(*) filter (where f.comment is not null and f.comment <> '')
      from public.feedback f
     where f.room_id = any (v_rooms)
       and not exists (select 1 from public.participants t where t.room_id = f.room_id and t.display_name like 'TEST-%')
     group by 1, 2, 3, 4;

    delete from public.rooms where id = any (v_rooms);  -- participants, cevaplar, tahminler, sonuç, geri bildirim cascade
    v_n_rooms := cardinality(v_rooms);
  end if;

  -- 2) Eski solo oturumları: anonim p_solo_days, kullanıcıya bağlı p_user_days sonra
  select coalesce(array_agg(id), '{}') into v_solo from (
    select s.id from public.solo_sessions s
     where s.created_at < now() - make_interval(days => case when s.user_id is null then p_solo_days else p_user_days end)
     order by s.created_at
     limit p_batch
  ) s;

  if cardinality(v_solo) > 0 then
    insert into public.metrics_feedback_archive (day, game_mode, relationship_type, locale, source, responses, rating_sum, liked, disliked, ai_yes, ai_maybe, ai_no, with_comment)
    select date_trunc('day', f.created_at)::date, f.game_mode, f.relationship_type, f.locale, 'solo_' || coalesce(f.game, 'unknown'),
           count(*), sum(f.rating), count(*) filter (where f.rating >= 4), count(*) filter (where f.rating <= 2),
           count(*) filter (where f.wants_ai = 'yes'), count(*) filter (where f.wants_ai = 'maybe'), count(*) filter (where f.wants_ai = 'no'),
           count(*) filter (where f.comment is not null and f.comment <> '')
      from public.feedback f
     where f.solo_session_id = any (v_solo)
     group by 1, 2, 3, 4, 5;

    delete from public.solo_sessions where id = any (v_solo);  -- bağlı geri bildirimler cascade
    v_n_solo := cardinality(v_solo);
  end if;

  -- 3) Eski IP özetleri
  with del as (
    delete from public.rate_limits
     where id in (select id from public.rate_limits where created_at < now() - make_interval(days => p_rate_days) limit p_batch * 10)
    returning 1
  ) select count(*) into v_n_rate from del;

  return query select v_n_rooms, v_n_solo, v_n_rate;
end;
$$;

revoke all on function public.cleanup_expired_data(int, int, int, int, int) from public, anon, authenticated;
grant execute on function public.cleanup_expired_data(int, int, int, int, int) to service_role;

commit;
