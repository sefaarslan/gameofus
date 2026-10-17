-- =============================================================================
-- Karşı oyuncunun bilgisini oda kurarken toplamayı bırak: her oyuncu kendi bilgisini kendisi girer.
--
--  * rooms.partner_gender / rooms.partner_birth_date: kurucunun başkası adına girdiği veri (üçüncü kişi verisi) kaldırılır.
--  * Partner cinsiyeti, katılırken katılanın kendi beyanıyla participants.gender'a yazılır (isteğe bağlı).
--  * 18+ kategorilerde partner yaşı oda kurarken değil, KATILIRKEN katılanın kendi hesabındaki doğum tarihiyle doğrulanır
--    (POST /api/rooms/{roomCode}/join → AGE_VERIFICATION_REQUIRED / AGE_RESTRICTED).
--
-- Not: ÖNCE 20260614_participant_birth_date, sonra uygulama sürümünü yayınla (kod artık bu sütunlara dokunmaz), EN SON bu migration.
-- =============================================================================
begin;

alter table public.rooms drop column if exists partner_gender;
alter table public.rooms drop column if exists partner_birth_date;

commit;
