-- =============================================================================
-- Geri bildirim: solo oyun oturumları için de kabul edilir
--
-- feedback artık ya bir oda katılımcısına (room_id + participant_id) ya da bir solo oyun oturumuna
-- (solo_session_id) bağlıdır. Mevcut oda anketi satırları ve unique(room_id, participant_id) aynen kalır.
-- Yazma yine yalnızca token doğrulayan POST /api/feedback üzerinden (RLS açık, policy yok).
-- metrics_feedback_summary görünümüne kaynak ayrımı için `source` kolonu eklenir (görünümün sonuna).
-- =============================================================================
begin;

alter table public.feedback alter column room_id drop not null;
alter table public.feedback alter column participant_id drop not null;

alter table public.feedback
  add column if not exists solo_session_id uuid references public.solo_sessions (id) on delete cascade;
alter table public.feedback
  add column if not exists game text;                       -- solo oyun adı (ör. 'red_flag'); oda anketinde null

alter table public.feedback drop constraint if exists feedback_target_check;
alter table public.feedback add constraint feedback_target_check
  check ((room_id is not null and participant_id is not null) or solo_session_id is not null);

-- Solo oturum başına tek kayıt (upsert onConflict için tam unique; null'lar çakışmaz)
alter table public.feedback drop constraint if exists feedback_solo_session_key;
alter table public.feedback add constraint feedback_solo_session_key unique (solo_session_id);

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
  count(*) filter (where f.comment is not null and f.comment <> '') as with_comment,
  case when f.solo_session_id is not null then 'solo_' || coalesce(f.game, 'unknown') else 'duo' end as source
from public.feedback f
where f.room_id is null
   or not exists (
     select 1 from public.participants t
     where t.room_id = f.room_id and t.display_name like 'TEST-%'
   )
group by 1, 2, 3, 4, 13;

revoke all on public.metrics_feedback_summary from anon, authenticated;

commit;
