-- =============================================================================
-- Seed: soru bankası
-- Secret Choice (50) · Prediction (15 × 4 seçenek) · Orderline (10 × 4 kart)
-- Tüm sorular locale = 'tr' (İngilizce Faz 2'de eklenir)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. SECRET CHOICE — 50 soru (sabit seçenekler: yes/unsure/no)
-- ---------------------------------------------------------------------------

insert into public.questions (mode, category, question_text, locale, is_active) values
  -- communication
  ('secret_choice', 'communication', 'Her gün mesajlaşmak senin için önemli mi?',               'tr', true),
  ('secret_choice', 'communication', 'Günaydın mesajı almak hoşuna gider mi?',                  'tr', true),
  ('secret_choice', 'communication', 'Geç cevap verilmesi seni rahatsız eder mi?',               'tr', true),
  ('secret_choice', 'communication', 'Telefonda konuşmak yazışmadan daha iyi midir?',            'tr', true),
  ('secret_choice', 'communication', 'Gün içinde haberleşmek önemli midir?',                     'tr', true),
  ('secret_choice', 'communication', 'Partnerin yoğun olduğunda az yazması seni üzer mi?',      'tr', true),
  ('secret_choice', 'communication', 'Hislerini açıkça konuşmak senin için kolay mı?',          'tr', true),
  ('secret_choice', 'communication', 'Bir sorun olduğunda hemen konuşmak ister misin?',         'tr', true),
  ('secret_choice', 'communication', 'Küçük detayları hatırlamak senin için önemli mi?',        'tr', true),
  ('secret_choice', 'communication', 'İyi geceler mesajı almak hoşuna gider mi?',               'tr', true),
  -- first_date
  ('secret_choice', 'first_date',    'İlk buluşmada el ele tutuşmak doğal mı?',                 'tr', true),
  ('secret_choice', 'first_date',    'İlk buluşmada uzun saatler geçirmek hoşuna gider mi?',    'tr', true),
  ('secret_choice', 'first_date',    'İlk buluşmada fotoğraf çekmek ister misin?',              'tr', true),
  ('secret_choice', 'first_date',    'İlk buluşmada ikinci buluşmayı konuşmak doğru mu?',       'tr', true),
  ('secret_choice', 'first_date',    'İlk buluşmada eski ilişkilerden bahsetmek sorun olur mu?','tr', true),
  ('secret_choice', 'first_date',    'İlk buluşmada hesabı paylaşmak normal midir?',            'tr', true),
  ('secret_choice', 'first_date',    'İlk buluşmada çok soru sormak hoşuna gider mi?',          'tr', true),
  ('secret_choice', 'first_date',    'İlk buluşmada sessizlik seni rahatsız eder mi?',          'tr', true),
  ('secret_choice', 'first_date',    'İlk buluşmada spontane plan değişikliği hoşuna gider mi?','tr', true),
  ('secret_choice', 'first_date',    'İlk buluşmada telefonla fazla ilgilenilmesi seni rahatsız eder mi?', 'tr', true),
  -- social_life
  ('secret_choice', 'social_life',   'Partnerin sık arkadaşlarıyla çıkması normal midir?',      'tr', true),
  ('secret_choice', 'social_life',   'Karşı cins yakın arkadaş olabilir mi?',                   'tr', true),
  ('secret_choice', 'social_life',   'Sosyal medyada ilişki paylaşmak ister misin?',            'tr', true),
  ('secret_choice', 'social_life',   'Partnerin yalnız tatile gitmesi normal midir?',           'tr', true),
  ('secret_choice', 'social_life',   'Kalabalık arkadaş ortamları hoşuna gider mi?',            'tr', true),
  ('secret_choice', 'social_life',   'Partnerinin arkadaşlarıyla yakın olmak ister misin?',     'tr', true),
  ('secret_choice', 'social_life',   'Sosyal medyada çok aktif olmak seni rahatsız eder mi?',   'tr', true),
  ('secret_choice', 'social_life',   'Ortak arkadaş çevresi ilişki için önemli midir?',         'tr', true),
  ('secret_choice', 'social_life',   'Partnerinin planlarını önceden bilmek ister misin?',      'tr', true),
  ('secret_choice', 'social_life',   'Her hafta dışarı çıkmak sana iyi gelir mi?',              'tr', true),
  -- lifestyle
  ('secret_choice', 'lifestyle',     'Hafta sonunu evde geçirmek hoşuna gider mi?',             'tr', true),
  ('secret_choice', 'lifestyle',     'Spontane planları sever misin?',                          'tr', true),
  ('secret_choice', 'lifestyle',     'Erken kalkmayı sever misin?',                             'tr', true),
  ('secret_choice', 'lifestyle',     'Gelecekte yurt dışında yaşamak ister misin?',             'tr', true),
  ('secret_choice', 'lifestyle',     'Evde birlikte yemek yapmak hoşuna gider mi?',             'tr', true),
  ('secret_choice', 'lifestyle',     'Planlı yaşamak senin için önemli midir?',                 'tr', true),
  ('secret_choice', 'lifestyle',     'Tatilde dinlenmek gezmekten daha mı keyiflidir?',         'tr', true),
  ('secret_choice', 'lifestyle',     'Ev düzeni senin için çok önemli midir?',                  'tr', true),
  ('secret_choice', 'lifestyle',     'Yeni yerler denemeyi sever misin?',                       'tr', true),
  ('secret_choice', 'lifestyle',     'Yoğun bir günün sonunda yalnız kalmak ister misin?',      'tr', true),
  -- values
  ('secret_choice', 'values',        'Bir ilişkide özel alan önemli midir?',                    'tr', true),
  ('secret_choice', 'values',        'Aile ilişkileri senin için çok önemli midir?',            'tr', true),
  ('secret_choice', 'values',        'Kariyer ilişkiden önce gelebilir mi?',                    'tr', true),
  ('secret_choice', 'values',        'Duygusal destek ilişkide en önemli şeylerden biri midir?','tr', true),
  ('secret_choice', 'values',        'Kıskançlık bazen sevgi göstergesi olabilir mi?',          'tr', true),
  ('secret_choice', 'values',        'Para yönetimi ilişkide açıkça konuşulmalı mı?',           'tr', true),
  ('secret_choice', 'values',        'Özür dilemek senin için kolay mı?',                       'tr', true),
  ('secret_choice', 'values',        'Partnerinle her şeyi paylaşmak ister misin?',             'tr', true),
  ('secret_choice', 'values',        'Güven zamanla mı oluşur?',                                'tr', true),
  ('secret_choice', 'values',        'Küçük sürprizler ilişkiyi canlı tutar mı?',               'tr', true);

-- ---------------------------------------------------------------------------
-- 2. PREDICTION — 15 soru × 4 seçenek
-- Her blok: question INSERT (CTE) → question_options INSERT
-- ---------------------------------------------------------------------------

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('prediction', 'lifestyle', 'Bu hafta sonu boş vaktinde ne yaparsın?', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Evde dinlenir, bir şeyler izlerim',      1),
  ('Arkadaşlarla dışarı çıkarım',            2),
  ('Spor yapar ya da yürüyüşe çıkarım',      3),
  ('Yeni bir yer keşfederim',                4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('prediction', 'lifestyle', 'Uzun ve yorucu bir günün ardından nasıl dinlenirsin?', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Yalnız sessizce oturur, zihnimi boşaltırım', 1),
  ('Sevdiğim biriyle sohbet ederim',             2),
  ('Egzersiz yapar ya da hareket ederim',        3),
  ('Bir şeyler yerim ve uyurum',                 4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('prediction', 'lifestyle', 'Tatilde önceliğin ne olur?', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Tamamen dinlenirim, plaj veya otel',          1),
  ('Kültür gezisi, müze ve tarihi yerler',        2),
  ('Macera ve aktif aktiviteler',                 3),
  ('Restoran ve yerel lezzetler',                 4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('prediction', 'lifestyle', 'Sürpriz bir tam gün boş kalsan ne yaparsın?', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Bol bol uyur, dinlenirim',                    1),
  ('Film veya dizi maratonu yaparım',             2),
  ('Arkadaşlara ulaşır, spontane buluşurum',     3),
  ('Doğaya çıkar, yürürüm',                       4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('prediction', 'lifestyle', 'Sabah kalkınca ilk ne yaparsın?', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Hemen telefona bakarım',           1),
  ('Kahve ya da çay, sessizce',        2),
  ('Duş alırım',                       3),
  ('Egzersiz veya yürüyüş',            4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('prediction', 'first_date', 'İlk buluşma için ideal yer ne olur?', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Kahve dükkanı — sakin, rahat',         1),
  ('Yürüyüş ya da park — açık hava',       2),
  ('Restoran — akşam yemeği',              3),
  ('Aktivite — bowling, müze, atölye',     4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('prediction', 'first_date', 'Akşam planı yapılırken ne tercih edersin?', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Evde yemek yapıp film izlemek',               1),
  ('Dışarıda yemek ve şehirde vakit geçirmek',    2),
  ('Arkadaşlarla büyük bir buluşma',              3),
  ('Sanat, konser veya etkinliğe katılmak',       4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('prediction', 'first_date', 'Hediye alacaksan nasıl seçersin?', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Önceden sorar, yanlış almam',                  1),
  ('Uzun düşünür, özel bir şey bulurum',           2),
  ('En pratik ve kullanışlı olanı alırım',         3),
  ('Deneyim hediye ederim (etkinlik, yemek)',      4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('prediction', 'communication', 'Bir sorun olduğunda nasıl başa çıkarsın?', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Hemen çözüm arar, aksiyon alırım',     1),
  ('Konuşur, birinden görüş alırım',       2),
  ('Bir süre düşünür, olgunlaştırırım',    3),
  ('Kafamı dağıtır, sonra dönerim',        4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('prediction', 'communication', 'Bir anlaşmazlıkta ilk adımı nasıl atarsın?', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Hemen konuşmak isterim, bekleyemem',       1),
  ('Karşı tarafın gelmesini beklerim',         2),
  ('Birlikte oturalım, konuşalım derim',       3),
  ('Sakinleşmek için biraz süre veririm',      4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('prediction', 'communication', 'Sosyal medyayı nasıl kullanırsın?', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Günde birkaç kez açar, bakar kapatırım',  1),
  ('Çok sık, neredeyse hep açık',             2),
  ('Nadiren, sadece gerektiğinde',            3),
  ('Neredeyse hiç kullanmam',                 4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('prediction', 'social_life', 'Yeni bir yerde yemek yiyeceksin, nasıl seçersin?', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Google harita yorumlarına bakarım',  1),
  ('Arkadaşıma sorarım',                 2),
  ('Gözüme çarpan yere girerim',         3),
  ('Sosyal medyada araştırırım',         4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('prediction', 'social_life', 'Yakın arkadaşların seni nasıl tanımlar?', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Güvenilir ve sadık',       1),
  ('Eğlenceli ve sosyal',      2),
  ('Sakin ve dinlendirici',    3),
  ('Meraklı ve yaratıcı',      4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('prediction', 'values', 'Bir filmi ya da diziyi seçerken ne istersin?', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Duygusal ve derin hikaye',          1),
  ('Aksiyon ve görsel şölen',           2),
  ('Komedi ve hafif eğlence',           3),
  ('Düşündüren, mesajlı bir konu',      4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('prediction', 'values', 'Rutin mi spontanlık mı — sana hangisi daha yakın?', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Planlı ve organize yaşarım',          1),
  ('Spontane ve anın akışında giderim',   2),
  ('İkisini dengelerim',                  3),
  ('Duruma göre değişiyor',               4)
) as v(option_text, sort_order);

-- ---------------------------------------------------------------------------
-- 3. ORDERLINE — 10 soru × 4 kart
-- sort_order yalnızca başlangıç görüntüleme sırasıdır; "doğru sıra" değildir.
-- ---------------------------------------------------------------------------

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('orderline', 'values', 'Bir ilişkide en önemli özellikleri sırala:', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Sadakat', 1),
  ('Empati',  2),
  ('Mizah',   3),
  ('Zeka',    4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('orderline', 'lifestyle', 'Stresi azaltmak için başvurduğun yolları sırala:', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Uyku',      1),
  ('Egzersiz',  2),
  ('Müzik',     3),
  ('Sohbet',    4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('orderline', 'lifestyle', 'İdeal bir hafta sonu için olmazsa olmaz şeyler — sırala:', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Dinlenme',        1),
  ('Sosyalleşme',     2),
  ('Doğa',            3),
  ('Kişisel zaman',   4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('orderline', 'values', 'Bir partnerde seni en çok etkileyen şeyler — sırala:', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Dürüstlük',  1),
  ('Mizah',      2),
  ('Empati',     3),
  ('Özgüven',    4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('orderline', 'lifestyle', 'Tatilde tercih ettiğin aktiviteler — önem sırasına göre:', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Yeme içme', 1),
  ('Keşif',     2),
  ('Dinlenme',  3),
  ('Kültür',    4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('orderline', 'values', 'Mutlu bir ilişkinin temelleri — önem sırasına göre:', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Güven',              1),
  ('İletişim',           2),
  ('Fiziksel yakınlık',  3),
  ('Ortak ilgiler',      4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('orderline', 'values', 'Bu değerleri hayatındaki önem sırasına göre diz:', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Aile',              1),
  ('Kariyer',           2),
  ('Arkadaşlar',        3),
  ('Kişisel gelişim',   4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('orderline', 'communication', 'Birinin seni iyi tanıdığını hissettiren şeyler — sırala:', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Detayları hatırlamak', 1),
  ('Dinlemek',             2),
  ('Zaman ayırmak',        3),
  ('Sürpriz yapmak',       4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('orderline', 'values', 'İlişkide zorlayan konular — kolaydan zora sırala:', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Farklı hobiler',       1),
  ('Farklı sosyal enerji', 2),
  ('Para yönetimi',        3),
  ('Gelecek planları',     4)
) as v(option_text, sort_order);

with q as (
  insert into public.questions (mode, category, question_text, locale, is_active)
  values ('orderline', 'lifestyle', 'Güzel bir akşam için tercih sıran:', 'tr', true)
  returning id
)
insert into public.question_options (question_id, option_text, sort_order)
select q.id, v.option_text, v.sort_order from q,
(values
  ('Yemek',   1),
  ('Müzik',   2),
  ('Sohbet',  3),
  ('Film',    4)
) as v(option_text, sort_order);
