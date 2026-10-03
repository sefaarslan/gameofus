-- =============================================================================
-- Solo oyun: setler (deste) — Red Flag Mayın Tarlası
-- Üreten: scripts/build-solo-packs-migration.mjs (seeds/solo). Elle düzenleme; seed'i değiştirip yeniden üret.
--
-- Her set 9 sabit kart (sabit sıra). Aynı settekiler aynı kartları oynar → yüzdeler karşılaştırılabilir.
--   friend-101..103   : "Arkadaşlık ilişkilerinde"
--   romantic-101..103 : "Gönül ilişkilerinde"
--   104-106           : ileride (mobilde açılacak); şimdilik içeriksiz.
-- Hangi senaryonun hangi sette/kaçıncı sırada olduğu solo_scenarios.pack_key / pack_position; oturum hangi seti
-- oynadığını solo_sessions.pack_key ile saklar. Hiçbir sette yer almayan senaryolar silinmez, pasife alınır.
-- =============================================================================
begin;

alter table public.solo_scenarios add column if not exists pack_key      text;
alter table public.solo_scenarios add column if not exists pack_position smallint;
alter table public.solo_sessions  add column if not exists pack_key      text;

create unique index if not exists uq_solo_scenarios_pack_slot
  on public.solo_scenarios (game, pack_key, pack_position, locale) where pack_key is not null;
create index if not exists idx_solo_scenarios_pack
  on public.solo_scenarios (game, pack_key, locale) where is_active and pack_key is not null;
create index if not exists idx_solo_sessions_pack on public.solo_sessions (pack_key) where pack_key is not null;

-- Arkadaşlık setlerini tamamlayan yeni senaryolar
insert into public.solo_scenarios (id, game, scenario_key, translation_group_id, locale, scenario_text, insight_tag) values
  ('7c8519c2-b6b2-5ac1-98a0-0b48429129a9', 'red_flag', 'boundaries:11', 'b23e2446-57a9-5d28-9cf7-1263e0f8f748', 'tr', 'Mesajına hemen cevap veremediğinde arkadaşın üstelemiyor, “Müsait olunca yaz” diyor.', 'boundaries'),
  ('9fcc463f-4a8b-5b5f-90f8-c7e3561e1f70', 'red_flag', 'boundaries:11', 'b23e2446-57a9-5d28-9cf7-1263e0f8f748', 'en', 'When you can''t reply right away, your friend doesn''t push and says “Write back when you''re free.”', 'boundaries'),
  ('adcdd98b-d1e3-5861-b2ac-66ea1a49b721', 'red_flag', 'boundaries:11', 'b23e2446-57a9-5d28-9cf7-1263e0f8f748', 'es', 'Cuando no puedes responder enseguida, tu amigo no insiste y te dice «escríbeme cuando puedas».', 'boundaries'),
  ('1f93ad76-671b-53e6-bca9-6ee29565786b', 'red_flag', 'boundaries:12', '6612794b-2480-51a1-9921-dbcb38610db9', 'tr', 'Söylediği bir şaka seni rahatsız ettiğinde arkadaşın hemen özür diliyor ve bir daha tekrarlamıyor.', 'boundaries'),
  ('4ea027c9-cd3d-5eb9-ab29-d4e7921c62cd', 'red_flag', 'boundaries:12', '6612794b-2480-51a1-9921-dbcb38610db9', 'en', 'When a joke of theirs makes you uncomfortable, your friend apologizes right away and doesn''t repeat it.', 'boundaries'),
  ('9201f911-b7d8-58b0-afcc-2c529a7f37b6', 'red_flag', 'boundaries:12', '6612794b-2480-51a1-9921-dbcb38610db9', 'es', 'Cuando una broma suya te incomoda, tu amigo se disculpa enseguida y no la repite.', 'boundaries'),
  ('b5a396b5-2537-5f5a-a72a-ff11f7344167', 'red_flag', 'jealousy:11', 'b4e8c4bd-fe0e-568c-bbbb-ba49b08613ab', 'tr', 'Yeni bir arkadaş grubuna katıldığında arkadaşın “Çok sevindim, bir gün tanıştır bizi” diyor.', 'jealousy'),
  ('771639fd-cbcf-5780-926d-730819048f23', 'red_flag', 'jealousy:11', 'b4e8c4bd-fe0e-568c-bbbb-ba49b08613ab', 'en', 'When you join a new group of friends, your friend says “I''m so happy for you, introduce us sometime.”', 'jealousy'),
  ('7293cbbd-6958-5110-9d27-d6d386e4543d', 'red_flag', 'jealousy:11', 'b4e8c4bd-fe0e-568c-bbbb-ba49b08613ab', 'es', 'Cuando te unes a un nuevo grupo de amigos, tu amigo dice «me alegro mucho, preséntanos algún día».', 'jealousy'),
  ('4c06c0e2-bda4-5ad1-a86a-c8861d8afab0', 'red_flag', 'jealousy:12', '4c58db45-f783-5d9e-9c0d-a348b035fb38', 'tr', 'Başka bir arkadaşınla tatile çıkacağını söylediğinde arkadaşın “Tamam, iyi eğlenin” deyip birkaç gün mesaj atmıyor.', 'jealousy'),
  ('dbe98f6c-f2c4-526d-9ac4-7179c57789c4', 'red_flag', 'jealousy:12', '4c58db45-f783-5d9e-9c0d-a348b035fb38', 'en', 'When you tell your friend you''re going on holiday with someone else, they say “Okay, have fun” and don''t text for a few days.', 'jealousy'),
  ('e65ea4f0-7f77-5c53-8f07-bd5a113f7840', 'red_flag', 'jealousy:12', '4c58db45-f783-5d9e-9c0d-a348b035fb38', 'es', 'Cuando dices que te vas de vacaciones con otro amigo, tu amigo responde «vale, pasadlo bien» y pasa unos días sin escribir.', 'jealousy'),
  ('f1ce0c5b-6658-59ad-bd2c-36aae1909395', 'red_flag', 'money_lifestyle:11', '44b1e475-5f89-5751-b3b8-7c04d2bda0eb', 'tr', 'Ortak yaptığınız bir harcamada arkadaşın hesabı hemen çıkarıp “Payım şu kadar” diye net bir mesaj atıyor.', 'money_lifestyle'),
  ('44213999-8d62-559c-982f-a4fad7e39505', 'red_flag', 'money_lifestyle:11', '44b1e475-5f89-5751-b3b8-7c04d2bda0eb', 'en', 'After a shared expense, your friend works out the split right away and texts you a clear “My share is this much.”', 'money_lifestyle'),
  ('ca7f3086-7e8e-56cb-bace-0a0c659652db', 'red_flag', 'money_lifestyle:11', '44b1e475-5f89-5751-b3b8-7c04d2bda0eb', 'es', 'Tras un gasto compartido, tu amigo calcula enseguida la cuenta y te manda un mensaje claro: «mi parte es esta».', 'money_lifestyle')
on conflict (id) do nothing;

-- Set yerleşimi (3 dilde aynı slot)
update public.solo_scenarios s
   set pack_key = v.pack_key, pack_position = v.pos
  from (values
  ('boundaries:1', 'romantic-103', 2),
  ('boundaries:2', 'romantic-103', 4),
  ('boundaries:3', 'friend-101', 5),
  ('boundaries:5', 'romantic-101', 4),
  ('boundaries:6', 'friend-101', 9),
  ('boundaries:7', 'romantic-102', 8),
  ('boundaries:9', 'friend-103', 4),
  ('boundaries:10', 'romantic-101', 8),
  ('trust:1', 'friend-101', 3),
  ('trust:2', 'romantic-102', 7),
  ('trust:3', 'romantic-103', 7),
  ('trust:4', 'friend-102', 2),
  ('trust:5', 'romantic-101', 5),
  ('trust:6', 'friend-102', 4),
  ('trust:7', 'romantic-101', 2),
  ('trust:8', 'friend-101', 7),
  ('trust:9', 'romantic-103', 9),
  ('trust:10', 'friend-103', 7),
  ('communication:1', 'romantic-101', 1),
  ('communication:2', 'friend-103', 3),
  ('communication:3', 'romantic-102', 2),
  ('communication:4', 'friend-103', 6),
  ('communication:5', 'romantic-103', 6),
  ('communication:6', 'friend-102', 8),
  ('communication:8', 'romantic-102', 5),
  ('communication:9', 'friend-101', 2),
  ('jealousy:1', 'romantic-101', 3),
  ('jealousy:2', 'friend-103', 9),
  ('jealousy:4', 'romantic-103', 3),
  ('jealousy:5', 'romantic-101', 7),
  ('jealousy:6', 'friend-102', 9),
  ('jealousy:7', 'romantic-102', 9),
  ('jealousy:8', 'romantic-102', 1),
  ('jealousy:9', 'friend-103', 5),
  ('money_lifestyle:2', 'friend-102', 7),
  ('money_lifestyle:4', 'romantic-103', 8),
  ('money_lifestyle:5', 'friend-101', 1),
  ('money_lifestyle:6', 'romantic-101', 9),
  ('money_lifestyle:8', 'friend-103', 8),
  ('money_lifestyle:9', 'romantic-103', 1),
  ('money_lifestyle:10', 'romantic-102', 4),
  ('respect:1', 'friend-102', 3),
  ('respect:2', 'romantic-101', 6),
  ('respect:3', 'romantic-102', 6),
  ('respect:4', 'friend-101', 8),
  ('respect:5', 'romantic-103', 5),
  ('respect:7', 'friend-101', 6),
  ('respect:8', 'romantic-102', 3),
  ('respect:9', 'friend-103', 2),
  ('boundaries:11', 'friend-102', 1),
  ('boundaries:12', 'friend-103', 1),
  ('jealousy:11', 'friend-102', 6),
  ('jealousy:12', 'friend-101', 4),
  ('money_lifestyle:11', 'friend-102', 5)
  ) as v(scenario_key, pack_key, pos)
 where s.game = 'red_flag' and s.scenario_key = v.scenario_key;

-- Hiçbir sette yer almayanlar pasife alınır (silinmez; geçmiş oturumlar bu kimliklere başvurabilir)
update public.solo_scenarios
   set is_active = false
 where game = 'red_flag' and scenario_key in ('boundaries:4', 'boundaries:8', 'communication:7', 'communication:10', 'jealousy:3', 'jealousy:10', 'money_lifestyle:1', 'money_lifestyle:3', 'money_lifestyle:7', 'respect:6', 'respect:10');

do $$
declare
  p text; l text; n int;
begin
  foreach p in array array['friend-101', 'friend-102', 'friend-103', 'romantic-101', 'romantic-102', 'romantic-103'] loop
    foreach l in array array['tr', 'en', 'es'] loop
      select count(*) into n from public.solo_scenarios
       where game = 'red_flag' and pack_key = p and locale = l and is_active;
      if n <> 9 then
        raise exception 'set % (%): beklenen 9 aktif kart, bulunan %', p, l, n;
      end if;
    end loop;
  end loop;

  select count(*) into n from public.solo_scenarios where game = 'red_flag' and is_active and pack_key is null;
  if n <> 0 then
    raise exception 'sette olmayan aktif senaryo kaldı: %', n;
  end if;

  select count(*) into n from public.solo_scenarios where game = 'red_flag' and is_active;
  if n <> 162 then
    raise exception 'beklenen 162 aktif senaryo satırı, bulunan %', n;
  end if;
end $$;

commit;
