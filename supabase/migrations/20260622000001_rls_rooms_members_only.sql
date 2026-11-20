-- =============================================================================
-- RLS sıkılaştırma: `rooms` ve `participants` artık herkese açık okunamaz.
--
-- Sorun: ilk şemadaki `rooms_read using (true)` ve `participants_read_status using (true)` politikaları, tarayıcıya gömülü
-- anon anahtarıyla PostgREST üzerinden TÜM odaların `room_code`, `user_id` değerlerini ve oyuncu adlarını listelemeye izin
-- veriyordu. `room_code` erişim anahtarı olduğu için API'deki deneme sınırları (join/room_miss) tamamen atlatılabiliyordu.
--
-- Yeni model:
--   * anon: `rooms` ve `participants` üzerinde hiçbir yetki yok.
--   * authenticated: yalnızca KENDİ katıldığı odaların `rooms` satırını okuyabilir (Realtime `postgres_changes` bu politikayla
--     filtrelenir; mobil uygulama yalnızca `rooms.status` UPDATE olaylarını dinler). `participants` tablosuna hiç erişim yok.
--   * Web Realtime kullanmaz; tüm okuma/yazma service role ile sunucu uçlarından yapılır (değişmez).
-- `is_room_member` SECURITY DEFINER: politika, `participants`'a (yetkisi kapalı) çağıranın rolüyle erişmek zorunda kalmasın.
-- =============================================================================
begin;

create or replace function public.is_room_member(p_room uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.participants p
    where p.room_id = p_room and p.user_id = auth.uid()
  );
$$;

revoke all on function public.is_room_member(uuid) from public, anon;
grant execute on function public.is_room_member(uuid) to authenticated;

-- rooms
drop policy if exists "rooms_read" on public.rooms;
drop policy if exists "rooms_read_members" on public.rooms;
create policy "rooms_read_members" on public.rooms
  for select to authenticated
  using (public.is_room_member(id));
revoke all on public.rooms from anon;

-- participants: client'a tamamen kapalı (ad, durum vb. sunucu uçlarından gelir)
drop policy if exists "participants_read_status" on public.participants;
revoke all on public.participants from anon, authenticated;

commit;
