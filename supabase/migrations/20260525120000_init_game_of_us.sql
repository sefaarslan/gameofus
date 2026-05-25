-- =============================================================================
-- Game of Us — Initial schema migration
-- Supabase / PostgreSQL
--
-- Bu migration CLAUDE.md ve PRD Bölüm 17'deki veri modeline dayanır.
-- Güvenlik yaklaşımı: kritik okuma/yazma işlemleri server-side endpoint'ler
-- (service_role) üzerinden yürütülür ve RLS'i bypass eder. anon/authenticated
-- rollerine yalnızca hassas olmayan veriler ve soft-realtime status için erişim
-- verilir. answers / predictions / results client'a doğrudan açılmaz.
-- =============================================================================

-- 0. Extensions ------------------------------------------------------------
create extension if not exists pgcrypto;  -- gen_random_uuid()

-- 1. Enum tipleri ----------------------------------------------------------
do $$ begin
  create type room_status as enum (
    'created', 'owner_playing', 'owner_completed', 'waiting_guest',
    'guest_joined', 'guest_playing', 'guest_completed',
    'result_ready', 'completed', 'expired'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type participant_status as enum ('invited', 'joined', 'playing', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type participant_role as enum ('owner', 'guest');
exception when duplicate_object then null; end $$;

do $$ begin
  create type game_mode as enum ('secret_choice', 'prediction', 'orderline', 'mixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type confidence_level as enum ('guess', 'think', 'sure');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

-- 2. Tablolar --------------------------------------------------------------

-- users: yalnızca kayıtlı / premium kullanıcılar (Faz 2). Supabase Auth ile.
create table if not exists public.users (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text,
  premium_until timestamptz,                 -- null = ücretsiz
  created_at    timestamptz not null default now()
);

-- rooms
create table if not exists public.rooms (
  id               uuid primary key default gen_random_uuid(),
  room_code        text not null unique,     -- paylaşılabilir, tahmin edilemez kod
  status           room_status not null default 'created',
  game_mode        game_mode not null default 'secret_choice',
  question_count   int not null check (question_count > 0),
  owner_id         uuid,                      -- participants(id) — FK aşağıda eklenir
  user_id          uuid references public.users (id) on delete set null, -- anonim oda: null
  is_premium_room  boolean not null default false,
  max_participants int not null default 2,
  join_locked      boolean not null default false,
  locale           text not null default 'tr',
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null      -- ücretsiz: +24h, premium: +72h
);

-- participants
create table if not exists public.participants (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.rooms (id) on delete cascade,
  role          participant_role not null,
  display_name  text,                         -- yalnızca gösterim; kimlik doğrulama DEĞİL
  status        participant_status not null default 'joined',
  token_hash    text not null,                -- ham token DB'de tutulmaz
  last_seen_at  timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  unique (room_id, role),
  unique (room_id, token_hash)
);

-- rooms.owner_id -> participants(id) (chicken-egg nedeniyle sonradan eklenir)
do $$ begin
  alter table public.rooms
    add constraint rooms_owner_id_fkey
    foreign key (owner_id) references public.participants (id) on delete set null;
exception when duplicate_object then null; end $$;

-- questions: soru bankası (seeds/questions.ts ile doldurulur)
create table if not exists public.questions (
  id            uuid primary key default gen_random_uuid(),
  mode          game_mode not null default 'secret_choice',
  category      text,
  question_text text not null,
  locale        text not null default 'tr',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- question_options: prediction / orderline modları için
create table if not exists public.question_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  option_text text not null,
  sort_order  int not null,
  unique (question_id, sort_order)
);

-- room_questions: odaya atanmış sorular ve sıraları
create table if not exists public.room_questions (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references public.rooms (id) on delete cascade,
  question_id uuid not null references public.questions (id),
  round_order int not null,
  unique (room_id, round_order),
  unique (room_id, question_id)
);

-- answers: oyuncu cevapları (reveal öncesi client'a açılmaz)
create table if not exists public.answers (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid not null references public.rooms (id) on delete cascade,
  question_id    uuid not null references public.questions (id),
  participant_id uuid not null references public.participants (id) on delete cascade,
  answer_value   jsonb not null,
  locked_at      timestamptz,
  created_at     timestamptz not null default now(),
  unique (room_id, question_id, participant_id)
);

-- predictions: tahminler + güven seviyesi
create table if not exists public.predictions (
  id                       uuid primary key default gen_random_uuid(),
  room_id                  uuid not null references public.rooms (id) on delete cascade,
  question_id              uuid not null references public.questions (id),
  predictor_participant_id uuid not null references public.participants (id) on delete cascade,
  target_participant_id    uuid not null references public.participants (id) on delete cascade,
  predicted_value          jsonb not null,
  confidence_level         confidence_level not null default 'guess',
  confidence_multiplier    int not null default 1 check (confidence_multiplier in (1, 2, 3)),
  locked_at                timestamptz,
  created_at               timestamptz not null default now(),
  unique (room_id, question_id, predictor_participant_id, target_participant_id)
);

-- results: okuma skoru + detay (server-side hesaplanır)
create table if not exists public.results (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null unique references public.rooms (id) on delete cascade,
  reading_score numeric not null,
  details_json  jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- payments: Lemon Squeezy ödemeleri (Faz 2)
create table if not exists public.payments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.users (id) on delete set null,
  room_id           uuid references public.rooms (id) on delete set null,
  provider          text not null default 'lemonsqueezy',
  provider_event_id text not null unique,     -- webhook idempotency
  amount            numeric not null,
  currency          text not null default 'USD',
  status            payment_status not null default 'pending',
  created_at        timestamptz not null default now()
);

-- rate_limits: anonim oda oluşturma abuse kontrolü (opsiyonel)
create table if not exists public.rate_limits (
  id           uuid primary key default gen_random_uuid(),
  key          text not null,                 -- IP hash / fingerprint hash / user_id
  action       text not null,                 -- create_room / join_room
  count        int not null default 0,
  window_start timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- 3. Yardımcı indeksler ----------------------------------------------------
create index if not exists idx_participants_room_id      on public.participants (room_id);
create index if not exists idx_room_questions_room_id    on public.room_questions (room_id, round_order);
create index if not exists idx_answers_room_id           on public.answers (room_id);
create index if not exists idx_predictions_room_id       on public.predictions (room_id);
create index if not exists idx_questions_active          on public.questions (mode, locale) where is_active;
create index if not exists idx_rooms_expires_at          on public.rooms (expires_at);
create index if not exists idx_rate_limits_key_action    on public.rate_limits (key, action, window_start);

-- =============================================================================
-- 4. Row Level Security
--
-- service_role RLS'i bypass eder -> tüm kritik işlemler (cevap/tahmin yazma,
-- sonuç hesaplama, token doğrulama) server-side endpoint'lerde service_role ile
-- yapılır. Aşağıdaki politikalar yalnızca client (anon/authenticated) için
-- geçerlidir.
-- =============================================================================

alter table public.users          enable row level security;
alter table public.rooms          enable row level security;
alter table public.participants   enable row level security;
alter table public.questions      enable row level security;
alter table public.question_options enable row level security;
alter table public.room_questions enable row level security;
alter table public.answers        enable row level security;
alter table public.predictions    enable row level security;
alter table public.results        enable row level security;
alter table public.payments       enable row level security;
alter table public.rate_limits    enable row level security;

-- --- questions / question_options: hassas değil, herkes okuyabilir ----------
drop policy if exists "questions_read_active" on public.questions;
create policy "questions_read_active" on public.questions
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists "question_options_read" on public.question_options;
create policy "question_options_read" on public.question_options
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.questions q
      where q.id = question_options.question_id and q.is_active = true
    )
  );

-- --- rooms: soft-realtime status + temel oda bilgisi okumaya açık -----------
-- Not: room_code erişim anahtarıdır; client sorgularını room_code ile scope'lar.
-- token gibi hassas alan rooms tablosunda tutulmaz.
drop policy if exists "rooms_read" on public.rooms;
create policy "rooms_read" on public.rooms
  for select to anon, authenticated
  using (true);

-- --- participants: yalnızca status realtime için SELECT'e açık --------------
-- token_hash sızmasın diye satır politikası + COLUMN-LEVEL grant kullanılır.
-- anon yalnızca status alanlarını okuyabilir, token_hash'i ASLA okuyamaz.
drop policy if exists "participants_read_status" on public.participants;
create policy "participants_read_status" on public.participants
  for select to anon, authenticated
  using (true);

revoke all on public.participants from anon, authenticated;
grant select (id, room_id, role, display_name, status, last_seen_at, completed_at, created_at)
  on public.participants to anon, authenticated;

-- --- answers / predictions / results: client'a KAPALI -----------------------
-- Hiçbir anon/authenticated politikası tanımlanmaz -> tüm erişim service_role
-- üzerinden (server-side endpoint). Partner cevabı reveal öncesi expose edilmez.
-- (results dahil; sonuç detayı yalnızca server endpoint'i token/JWT doğrulayıp döner.)

-- --- users: kayıtlı kullanıcı yalnızca kendi kaydını okuyabilir (Faz 2) ------
drop policy if exists "users_read_own" on public.users;
create policy "users_read_own" on public.users
  for select to authenticated
  using (auth.uid() = id);

-- --- payments / rate_limits: client'a KAPALI (service_role only) -------------
-- Politika tanımlanmadığı için anon/authenticated erişemez.

-- =============================================================================
-- 5. Realtime publication
--
-- PRD/CLAUDE.md: Realtime SADECE oda ve participant status değişiklikleri için.
-- answers / predictions / results Realtime'a ASLA eklenmez.
-- =============================================================================

do $$ begin
  alter publication supabase_realtime add table public.rooms;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.participants;
exception when duplicate_object then null; end $$;

-- Realtime payload'larının status değişikliklerini taşıyabilmesi için:
alter table public.rooms        replica identity full;
alter table public.participants replica identity full;

-- =============================================================================
-- Notlar:
-- * Cevap + tahmin tek API request ile yazılır (CLAUDE.md Bölüm 7.3) -> tek
--   server-side endpoint answers ve predictions tablolarına birlikte insert eder.
-- * room_questions ilk oyun başlangıcında tek seferde okunur (Bölüm 7.1/7.2);
--   soru geçişlerinde tekrar DB sorgusu yapılmaz.
-- * Sonuç hesaplama iki participant da 'completed' olunca server-side endpoint
--   ile yapılır ve results tablosuna tek kez (unique room_id) yazılır (Bölüm 7.5).
-- * Oda expire kontrolü okuma anında expires_at < now() ile yapılır; cron yok.
-- =============================================================================
