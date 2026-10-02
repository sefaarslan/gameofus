-- =============================================================================
-- Kullanıcı geri bildirimi + davranış metrikleri
--
-- feedback: sonuç ekranındaki mini anket. Katılımcı başına oda başına tek satır
--   (unique(room_id, participant_id)); anonim kalır, kimlik yalnızca participant_id.
--   Cevap/tahmin İÇERİĞİ tutulmaz (CLAUDE.md §9 analitik kuralı) — yalnızca puan,
--   AI ilgisi, kısa yorum ve oda meta verisi (dil, mod, ilişki türü).
--   Yazma yalnızca token doğrulayan POST /api/feedback üzerinden (admin client);
--   RLS açık ve hiç policy yok → anon/authenticated doğrudan okuyamaz/yazamaz.
--
-- metrics_*: panelden (SQL editor) bakmak için görünümler. security_invoker +
--   revoke ile anon/authenticated erişimi kapalı. 'TEST-%' isimli katılımcısı
--   olan odalar (geliştirme/test) metriklerden hariç tutulur.
-- =============================================================================

create table if not exists public.feedback (
  id                uuid primary key default gen_random_uuid(),
  room_id           uuid not null references public.rooms (id) on delete cascade,
  participant_id    uuid not null references public.participants (id) on delete cascade,
  rating            smallint not null check (rating between 1 and 5),
  wants_ai          text check (wants_ai in ('yes', 'maybe', 'no')),
  comment           text check (char_length(comment) <= 500),
  locale            text,
  game_mode         text,
  relationship_type text,
  platform          text not null default 'web',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (room_id, participant_id)
);

alter table public.feedback enable row level security;

create index if not exists idx_feedback_created_at on public.feedback (created_at);

-- ── Görünümler ───────────────────────────────────────────────────────────────

-- Günlük huni: oda açılan → partner katılan → sonucu hazır olan
create or replace view public.metrics_daily_funnel
with (security_invoker = true) as
select
  date_trunc('day', r.created_at)::date                              as day,
  r.game_mode,
  r.relationship_type,
  r.locale,
  count(*)                                                           as rooms_created,
  count(*) filter (where g.room_id is not null)                      as guest_joined,
  count(*) filter (where res.room_id is not null)                    as results_ready,
  round(100.0 * count(*) filter (where g.room_id is not null) / nullif(count(*), 0), 1)
                                                                     as join_rate_pct,
  round(100.0 * count(*) filter (where res.room_id is not null)
        / nullif(count(*) filter (where g.room_id is not null), 0), 1)
                                                                     as completion_rate_pct
from public.rooms r
left join (select distinct room_id from public.participants where role = 'guest') g
       on g.room_id = r.id
left join (select distinct room_id from public.results) res
       on res.room_id = r.id
where not exists (
  select 1 from public.participants p
  where p.room_id = r.id and p.display_name like 'TEST-%'
)
group by 1, 2, 3, 4;

-- Katılımcı durumu: oyuncular nerede takılıyor (joined/playing/completed)
create or replace view public.metrics_participant_status
with (security_invoker = true) as
select
  date_trunc('day', p.created_at)::date as day,
  p.role,
  p.status,
  count(*)                              as participants
from public.participants p
join public.rooms r on r.id = p.room_id
where not exists (
  select 1 from public.participants t
  where t.room_id = r.id and t.display_name like 'TEST-%'
)
group by 1, 2, 3;

-- Geri bildirim özeti: günlük puan ortalaması + AI ilgisi dağılımı
create or replace view public.metrics_feedback_summary
with (security_invoker = true) as
select
  date_trunc('day', f.created_at)::date                 as day,
  f.game_mode,
  f.relationship_type,
  f.locale,
  count(*)                                              as responses,
  round(avg(f.rating), 2)                               as avg_rating,
  count(*) filter (where f.rating >= 4)                 as liked,
  count(*) filter (where f.rating <= 2)                 as disliked,
  count(*) filter (where f.wants_ai = 'yes')            as ai_yes,
  count(*) filter (where f.wants_ai = 'maybe')          as ai_maybe,
  count(*) filter (where f.wants_ai = 'no')             as ai_no,
  count(*) filter (where f.comment is not null and f.comment <> '') as with_comment
from public.feedback f
where not exists (
  select 1 from public.participants t
  where t.room_id = f.room_id and t.display_name like 'TEST-%'
)
group by 1, 2, 3, 4;

revoke all on public.metrics_daily_funnel       from anon, authenticated;
revoke all on public.metrics_participant_status from anon, authenticated;
revoke all on public.metrics_feedback_summary   from anon, authenticated;
