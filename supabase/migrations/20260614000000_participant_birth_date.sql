-- =============================================================================
-- Oyuncunun KENDİ doğum tarihi (isteğe bağlı; oda kurarken web ve mobilde): yorumları kişiselleştirmek için.
--
--  * participants.birth_date: yalnızca bu oyuncunun kendi beyanı (kimse başkası adına girmez). Hesap profiline yazılmaz (mobilde
--    profil `users.birth_date` zaten ayrıdır); odayla birlikte tutulur ve oda silinince gider; metrik görünümlerine/arşive girmez.
--  * delete_user_account(): başkalarının odalarındaki katılım anonimleştirilirken doğum tarihi de silinir.
--
-- Çalıştırma sırası: ÖNCE bu migration, sonra kodu yayınla (kod bu sütuna yazar), en son 20260615_drop_partner_fields.
-- =============================================================================
begin;

alter table public.participants
  add column if not exists birth_date date;

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
     set display_name = null, gender = null, birth_date = null, user_id = null
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
