-- =============================================================================
-- Günlük Red Flag seti (yalnızca mobil)
--
-- solo_sessions.set_date : günlük kipte oynanan oturumun "set günü" (kullanıcının yerel takvim günü). Serbest kipte (web) boş.
-- solo_daily_sets        : her kategori için günün seti; ilk istekte sunucu yazar, sonra sabit kalır (set sayısı değişse bile
--                          geçmiş kaymaz, dünün seti bugün tekrar çıkmaz). RLS açık, policy yok (yalnızca service role).
-- Benzersiz indeks       : bir kullanıcı aynı günün aynı setini (= kategorisini) yalnızca bir kez TAMAMLAYABİLİR.
-- =============================================================================
begin;

alter table public.solo_sessions add column if not exists set_date date;

create unique index if not exists uq_solo_sessions_daily_completed
  on public.solo_sessions (user_id, pack_key, set_date)
  where status = 'completed' and set_date is not null and user_id is not null;

create table if not exists public.solo_daily_sets (
  category   text not null,
  set_date   date not null,
  pack_key   text not null,
  created_at timestamptz not null default now(),
  primary key (category, set_date)
);

alter table public.solo_daily_sets enable row level security;

commit;
