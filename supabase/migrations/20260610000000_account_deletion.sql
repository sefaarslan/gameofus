-- =============================================================================
-- Hesap silme (App Store 5.1.1(v) / Google Play) + katılımcı-kullanıcı bağlantısı
--
--  * participants.user_id: giriş yapmış (mobil) oyuncular oda katılımcısına bağlanır (kurucu ve misafir);
--    geçmiş ve hesap silme bunun üzerinden çalışır. Web oyuncuları anonim kalır (null).
--  * purchases.user_id artık zorunlu değil ve silmede KOPARILIR (satır silinmez): satın alma kayıtları
--    (işlem kimliği, tutar, para birimi, tarih) yasal muhasebe yükümlülüğü için kullanıcıdan ayrılmış halde tutulur.
--  * delete_user_account(): kullanıcının kurduğu odaları siler, başkalarının odalarındaki katılımını anonimleştirir,
--    solo oturumlarını ve geri bildirimlerini siler, kullanıcı kaydını (coin hareketleriyle) kaldırır.
--    Auth kaydını (auth.users) API route silir.
-- =============================================================================
begin;

alter table public.participants
  add column if not exists user_id uuid references public.users (id) on delete set null;
create index if not exists idx_participants_user on public.participants (user_id) where user_id is not null;

-- purchases: kullanıcı silinince satır kalır, bağlantı kopar
alter table public.purchases alter column user_id drop not null;
alter table public.purchases drop constraint if exists purchases_user_id_fkey;
alter table public.purchases
  add constraint purchases_user_id_fkey foreign key (user_id) references public.users (id) on delete set null;

create or replace function public.delete_user_account(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Başkalarının odalarındaki geri bildirimleri sil, katılımı anonimleştir (oda diğer oyuncuya ait kalır)
  delete from public.feedback
   where participant_id in (select id from public.participants where user_id = p_user);

  -- Kurulan odalar: oda ve içindeki her şey (katılımcılar, cevaplar, tahminler, sonuç, geri bildirim) silinir
  delete from public.rooms where user_id = p_user;

  update public.participants
     set display_name = null, user_id = null
   where user_id = p_user;

  -- Solo oyunlar (cevaplar, AI metni) ve ona bağlı geri bildirimler (cascade)
  delete from public.solo_sessions where user_id = p_user;

  -- Kullanıcı kaydı: credit_transactions cascade ile silinir; purchases bağlantısı kopar
  delete from public.users where id = p_user;
end;
$$;

revoke all on function public.delete_user_account(uuid) from public, anon, authenticated;
grant execute on function public.delete_user_account(uuid) to service_role;

commit;
