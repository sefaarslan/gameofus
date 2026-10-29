-- =============================================================================
-- Veri temizliğini veritabanı içinden zamanla (pg_cron)
--
-- Şimdiye kadar /api/cron/cleanup (Vercel Cron, CRON_SECRET) günde bir cleanup_expired_data() çağırıyordu. Bu migration
-- aynı işi hosting'den bağımsız yapar: Vercel'den self-host'a geçince cron kalmaz, ayrı bir secret ya da HTTP çağrısı gerekmez.
--
-- Vercel Cron ile birlikte çalışması zararsızdır (silme idempotent); pg_cron çalıştığı doğrulanana kadar `vercel.json`
-- ve /api/cron/cleanup yerinde kalır. Doğrulama: docs/MIGRATION_VERCEL_TO_SELFHOST.md §3.
--
-- Saklama süreleri cleanup_expired_data()'nın parametre varsayılanlarındadır (14 / 90 / 7 / 500 / 90) ve lib/retention.ts ile
-- aynıdır; birini değiştirirsen diğerini ve Gizlilik Politikası'nı da güncelle.
--
-- ÖN KOŞUL: pg_cron etkin olmalı (Supabase Dashboard → Database → Extensions → pg_cron). Etkin değilse yalnızca fonksiyon
-- oluşur, zamanlama atlanır (NOTICE yazar); eklentiyi açtıktan sonra aşağıdaki DO bloğunu yeniden çalıştır.
-- =============================================================================
begin;

-- Route'taki döngünün SQL karşılığı: kalan iş bitene (ya da en çok 20 tura) kadar parti parti çalıştırır.
create or replace function public.cleanup_expired_data_all()
returns table (rooms_deleted bigint, solo_deleted bigint, rate_deleted bigint, rounds int)
language plpgsql
security definer
set search_path = public
as $$
declare
  c_batch constant int := 500;
  c_max_rounds constant int := 20;
  r record;
  v_rooms bigint := 0;
  v_solo  bigint := 0;
  v_rate  bigint := 0;
  v_round int := 0;
begin
  while v_round < c_max_rounds loop
    v_round := v_round + 1;
    select * into r from public.cleanup_expired_data(p_batch => c_batch);
    v_rooms := v_rooms + r.rooms_deleted;
    v_solo  := v_solo  + r.solo_deleted;
    v_rate  := v_rate  + r.rate_deleted;
    -- Parti dolmadıysa kalan iş yoktur (rate_limits partisi 10 kat büyüktür)
    exit when r.rooms_deleted < c_batch and r.solo_deleted < c_batch and r.rate_deleted < c_batch * 10;
  end loop;
  return query select v_rooms, v_solo, v_rate, v_round;
end;
$$;

revoke all on function public.cleanup_expired_data_all() from public, anon, authenticated;
grant execute on function public.cleanup_expired_data_all() to service_role;

-- Günlük 03:17 UTC (vercel.json ile aynı saat). Aynı adlı iş varsa yenisiyle değiştirilir.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'cleanup-expired-data';
    perform cron.schedule('cleanup-expired-data', '17 3 * * *', 'select public.cleanup_expired_data_all()');
  else
    raise notice 'pg_cron etkin değil: Dashboard → Database → Extensions → pg_cron aç, sonra bu DO bloğunu yeniden çalıştır.';
  end if;
end;
$$;

commit;
