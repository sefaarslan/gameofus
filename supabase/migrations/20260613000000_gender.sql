-- =============================================================================
-- Cinsiyet (opsiyonel): sahne modunda çöp adam karakterini çizmek ve AI yorumunda dil bilgisi/doğal ifade için.
--
--  * participants.gender: oyuncunun kendi seçimi ('female' | 'male'); null = belirtilmedi (nötr karakter, nötr dil).
--  * rooms.partner_gender: kurucunun partner için girdiği değer; partner katılınca participants.gender'a kopyalanır
--    (partner kendi değerini katılırken gönderirse o geçerlidir). Yalnızca bu odada tutulur; oda silinince gider.
--  * Hesaba/profile yazılmaz; metrik görünümlerine ve arşiv tablolarına girmez.
--  * delete_user_account(): başkalarının odalarındaki katılım anonimleştirilirken cinsiyet de silinir.
-- =============================================================================
begin;

alter table public.participants
  add column if not exists gender text;
alter table public.participants
  drop constraint if exists participants_gender_check;
alter table public.participants
  add constraint participants_gender_check check (gender is null or gender in ('female', 'male'));

alter table public.rooms
  add column if not exists partner_gender text;
alter table public.rooms
  drop constraint if exists rooms_partner_gender_check;
alter table public.rooms
  add constraint rooms_partner_gender_check check (partner_gender is null or partner_gender in ('female', 'male'));

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
     set display_name = null, gender = null, user_id = null
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
