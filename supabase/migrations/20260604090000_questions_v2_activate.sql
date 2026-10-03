-- =============================================================================
-- Soru seti v2 — 6/6: doğrula + aktifleştir
-- Üreten: scripts/build-questions-migration.mjs (seeds/v2). Elle düzenleme; seed'i değiştirip yeniden üret.
-- =============================================================================

-- Önceki parçaların hepsi çalıştırılmış olmalı. Doğrulama başarısızsa hiçbir şey değişmez (istisna → rollback).
begin;

do $$
declare n int;
begin
  select count(*) into n from public.questions where insight_tag is not null;
  if n <> 990 then
    raise exception 'Beklenen 990 yeni soru, bulunan % — önceki parçalar eksik olabilir', n;
  end if;

  if exists (select 1 from public.questions where insight_tag is not null and category_id is null) then
    raise exception 'Kategorisi eşleşmeyen yeni soru var';
  end if;

  if exists (
    select 1 from public.questions q
    where q.insight_tag is not null and q.mode in ('prediction', 'orderline')
      and (select count(*) from public.question_options o where o.question_id = q.id) <> 4
  ) then
    raise exception 'Seçenek sayısı 4 olmayan prediction/orderline sorusu var';
  end if;

  if exists (
    select 1 from public.questions q
    where q.insight_tag is not null and q.mode = 'secret_choice'
      and exists (select 1 from public.question_options o where o.question_id = q.id)
  ) then
    raise exception 'Seçeneği olan secret_choice sorusu var';
  end if;
end $$;

-- Eski sorular (insight_tag null) pasife alınır: silinmez, mevcut odalar/sonuçlar/geçmiş bozulmaz.
update public.questions set is_active = false where insight_tag is null and is_active;
-- Yeni sorular aktifleşir.
update public.questions set is_active = true where insight_tag is not null and not is_active;

commit;
