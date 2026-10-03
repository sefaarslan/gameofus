-- Red Flag Mayın Tarlası: "money_lifestyle:1" senaryosu (ortak birikim hedefi) pasife alınır.
-- Silinmez: bu senaryo çıkmış oturumların (solo_sessions.scenario_ids) geçmişi korunur.
update public.solo_scenarios
   set is_active = false
 where game = 'red_flag'
   and scenario_key = 'money_lifestyle:1';

do $$
declare n int;
begin
  select count(*) into n from public.solo_scenarios
   where game = 'red_flag' and scenario_key = 'money_lifestyle:1' and not is_active;
  if n <> 3 then
    raise exception 'beklenen 3 dilde pasif satır, bulunan %', n;
  end if;
end $$;
