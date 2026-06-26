-- =============================================================================
-- Seed: 25 çok dilli soru (TR / EN / ES)
-- Her semantik soru translation_group_id ile üç dilde bağlanır.
-- Dağılım: communication×4, first_date×4, social_life×4, lifestyle×5,
--          values×4, bold×4  →  25 × 3 dil = 75 satır
-- Mode: tümü secret_choice (Faz 1 önceliği)
-- =============================================================================

DO $$
DECLARE
  -- TR kategori ID'leri
  tr_comm   uuid; tr_first  uuid; tr_social uuid;
  tr_life   uuid; tr_val    uuid; tr_bold   uuid;
  -- EN kategori ID'leri
  en_comm   uuid; en_first  uuid; en_social uuid;
  en_life   uuid; en_val    uuid; en_bold   uuid;
  -- ES kategori ID'leri
  es_comm   uuid; es_first  uuid; es_social uuid;
  es_life   uuid; es_val    uuid; es_bold   uuid;
  -- her soru grubu için geçici translation_group_id
  tg uuid;
BEGIN

  -- Kategori ID'lerini yükle ------------------------------------------------
  SELECT id INTO tr_comm   FROM public.categories WHERE slug='communication' AND locale='tr';
  SELECT id INTO tr_first  FROM public.categories WHERE slug='first_date'    AND locale='tr';
  SELECT id INTO tr_social FROM public.categories WHERE slug='social_life'   AND locale='tr';
  SELECT id INTO tr_life   FROM public.categories WHERE slug='lifestyle'     AND locale='tr';
  SELECT id INTO tr_val    FROM public.categories WHERE slug='values'        AND locale='tr';
  SELECT id INTO tr_bold   FROM public.categories WHERE slug='bold'          AND locale='tr';

  SELECT id INTO en_comm   FROM public.categories WHERE slug='communication' AND locale='en';
  SELECT id INTO en_first  FROM public.categories WHERE slug='first_date'    AND locale='en';
  SELECT id INTO en_social FROM public.categories WHERE slug='social_life'   AND locale='en';
  SELECT id INTO en_life   FROM public.categories WHERE slug='lifestyle'     AND locale='en';
  SELECT id INTO en_val    FROM public.categories WHERE slug='values'        AND locale='en';
  SELECT id INTO en_bold   FROM public.categories WHERE slug='bold'          AND locale='en';

  SELECT id INTO es_comm   FROM public.categories WHERE slug='communication' AND locale='es';
  SELECT id INTO es_first  FROM public.categories WHERE slug='first_date'    AND locale='es';
  SELECT id INTO es_social FROM public.categories WHERE slug='social_life'   AND locale='es';
  SELECT id INTO es_life   FROM public.categories WHERE slug='lifestyle'     AND locale='es';
  SELECT id INTO es_val    FROM public.categories WHERE slug='values'        AND locale='es';
  SELECT id INTO es_bold   FROM public.categories WHERE slug='bold'          AND locale='es';

  -- =========================================================================
  -- İLETİŞİM / COMMUNICATION / COMUNICACIÓN (4 soru)
  -- =========================================================================

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_comm, 'Kötü bir gün geçirince sessiz mi kalırsın, yoksa konuşmak mı istersin?', 'tr', tg, true),
    ('secret_choice', en_comm, 'When you''ve had a bad day, do you prefer silence or talking it out?',   'en', tg, true),
    ('secret_choice', es_comm, 'Cuando tienes un mal día, ¿prefieres el silencio o hablar?',             'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_comm, 'Önemli kararları birlikte almak senin için vazgeçilmez mi?',                  'tr', tg, true),
    ('secret_choice', en_comm, 'Is making important decisions together non-negotiable for you?',               'en', tg, true),
    ('secret_choice', es_comm, '¿Para ti es imprescindible tomar decisiones importantes juntos?',             'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_comm, '"Seninle konuşmam gerekiyor" cümlesi sende endişe yaratır mı?',               'tr', tg, true),
    ('secret_choice', en_comm, 'Does "we need to talk" make you feel anxious?',                               'en', tg, true),
    ('secret_choice', es_comm, '¿"Tenemos que hablar" te pone ansioso/a?',                                    'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_comm, 'Tartışma sırasında ara vermek bazen gerekli midir?',                          'tr', tg, true),
    ('secret_choice', en_comm, 'Is taking a break during an argument sometimes necessary?',                   'en', tg, true),
    ('secret_choice', es_comm, '¿Es necesario a veces hacer una pausa durante una discusión?',               'es', tg, true);

  -- =========================================================================
  -- İLK ADIM / FIRST DATE / PRIMERA CITA (4 soru)
  -- =========================================================================

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_first, 'Randevudan önce karşı tarafı sosyal medyada araştırır mısın?',               'tr', tg, true),
    ('secret_choice', en_first, 'Do you check someone''s social media before a date?',                        'en', tg, true),
    ('secret_choice', es_first, '¿Revisas las redes sociales de alguien antes de una cita?',                  'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_first, 'İlk buluşmada nereye gidileceğine sen karar vermek ister misin?',            'tr', tg, true),
    ('secret_choice', en_first, 'Do you prefer to be the one who picks the spot on a first date?',            'en', tg, true),
    ('secret_choice', es_first, '¿Prefieres ser tú quien elija el lugar en una primera cita?',                'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_first, 'İlk buluşmada fazla kişisel detay paylaşmak erken olur mu?',                 'tr', tg, true),
    ('secret_choice', en_first, 'Is sharing too many personal details on a first date too soon?',              'en', tg, true),
    ('secret_choice', es_first, '¿Compartir demasiados detalles personales en la primera cita es demasiado pronto?', 'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_first, 'İlk buluşmada birlikte gülmek her şeyden daha önemli midir?',                'tr', tg, true),
    ('secret_choice', en_first, 'Is laughter the most important thing on a first date?',                      'en', tg, true),
    ('secret_choice', es_first, '¿La risa es lo más importante en una primera cita?',                         'es', tg, true);

  -- =========================================================================
  -- SOSYAL HAYAT / SOCIAL LIFE / VIDA SOCIAL (4 soru)
  -- =========================================================================

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_social, 'Partnerinin habersiz seni ziyaret etmesi hoşuna gider mi?',                 'tr', tg, true),
    ('secret_choice', en_social, 'Do you enjoy it when your partner shows up unannounced?',                   'en', tg, true),
    ('secret_choice', es_social, '¿Te gusta que tu pareja aparezca sin avisar?',                              'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_social, 'Tanımadığın kişilerle dolu bir ortamda rahat hisseder misin?',              'tr', tg, true),
    ('secret_choice', en_social, 'Do you feel comfortable in a room full of people you don''t know?',        'en', tg, true),
    ('secret_choice', es_social, '¿Te sientes cómodo/a en un ambiente lleno de desconocidos?',               'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_social, 'Partnerinin eski yakın arkadaşlarıyla aranızın iyi olması önemli midir?',   'tr', tg, true),
    ('secret_choice', en_social, 'Is it important to get along well with your partner''s old close friends?', 'en', tg, true),
    ('secret_choice', es_social, '¿Es importante llevarse bien con los amigos íntimos de tu pareja?',         'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_social, 'Ortamlara zaman zaman partneriniz olmadan katılmak sizi rahatlatır mı?',   'tr', tg, true),
    ('secret_choice', en_social, 'Does attending social events without your partner sometimes feel freeing?', 'en', tg, true),
    ('secret_choice', es_social, '¿A veces te resulta liberador ir a eventos sociales sin tu pareja?',       'es', tg, true);

  -- =========================================================================
  -- YAŞAM TARZI / LIFESTYLE / ESTILO DE VIDA (5 soru)
  -- =========================================================================

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_life, 'İş ve özel hayatı net biçimde ayırt etmek senin için önemli midir?',         'tr', tg, true),
    ('secret_choice', en_life, 'Is keeping your work and personal life clearly separate important to you?',   'en', tg, true),
    ('secret_choice', es_life, '¿Es importante para ti mantener bien separadas la vida laboral y personal?', 'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_life, 'Günlük rutininin bozulması seni rahatsız eder mi?',                           'tr', tg, true),
    ('secret_choice', en_life, 'Does having your daily routine disrupted bother you?',                        'en', tg, true),
    ('secret_choice', es_life, '¿Te molesta que se interrumpa tu rutina diaria?',                             'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_life, 'Minimalist bir yaşam tarzı sana çekici gelir mi?',                            'tr', tg, true),
    ('secret_choice', en_life, 'Does a minimalist lifestyle appeal to you?',                                  'en', tg, true),
    ('secret_choice', es_life, '¿Te atrae un estilo de vida minimalista?',                                    'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_life, 'Teknolojiden zaman zaman uzaklaşmak sana iyi gelir mi?',                      'tr', tg, true),
    ('secret_choice', en_life, 'Does disconnecting from technology now and then do you good?',                'en', tg, true),
    ('secret_choice', es_life, '¿Desconectarte de la tecnología de vez en cuando te hace bien?',              'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_life, 'Evcil hayvan sahibi olmak yaşam kalitenizi artırır mı?',                      'tr', tg, true),
    ('secret_choice', en_life, 'Does having a pet improve your quality of life?',                             'en', tg, true),
    ('secret_choice', es_life, '¿Tener una mascota mejora tu calidad de vida?',                               'es', tg, true);

  -- =========================================================================
  -- DEĞERLER / VALUES / VALORES (4 soru)
  -- =========================================================================

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_val, 'Yaşam hedefleri örtüşmeyen biriyle uzun vadeli mutlu olunabilir mi?',          'tr', tg, true),
    ('secret_choice', en_val, 'Can you be truly happy long-term with someone whose life goals don''t align with yours?', 'en', tg, true),
    ('secret_choice', es_val, '¿Puedes ser genuinamente feliz a largo plazo con alguien cuyos objetivos de vida no coinciden con los tuyos?', 'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_val, 'Bir ilişkide doğum günleri için özel plan yapılması önemli midir?',            'tr', tg, true),
    ('secret_choice', en_val, 'Is making special plans for birthdays important in a relationship?',            'en', tg, true),
    ('secret_choice', es_val, '¿Es importante hacer planes especiales para los cumpleaños en una relación?',  'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_val, 'Güvensizlik bir ilişkiyi bitirecek kadar ciddi bir sorundur?',                 'tr', tg, true),
    ('secret_choice', en_val, 'Is mistrust serious enough to end a relationship?',                            'en', tg, true),
    ('secret_choice', es_val, '¿La desconfianza es un problema lo suficientemente grave como para terminar una relación?', 'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_val, 'Hayatını değiştirecek büyük kararlarda partnerinin onayı şart mı?',            'tr', tg, true),
    ('secret_choice', en_val, 'Do you need your partner''s approval for life-changing decisions?',            'en', tg, true),
    ('secret_choice', es_val, '¿Necesitas la aprobación de tu pareja para decisiones que cambian tu vida?',   'es', tg, true);

  -- =========================================================================
  -- CESUR SORULAR / BOLD QUESTIONS / PREGUNTAS ATREVIDAS (4 soru — premium)
  -- =========================================================================

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_bold, 'Bir ilişkide her zaman birinin diğerinden daha çok sevdiğini düşünüyor musun?', 'tr', tg, true),
    ('secret_choice', en_bold, 'Do you think one person always loves the other more in a relationship?',        'en', tg, true),
    ('secret_choice', es_bold, '¿Crees que en una relación siempre hay quien ama más al otro?',                 'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_bold, 'Partnerin senden bir şey sakladığını hissetseydin sormaktan çekinir miydin?',  'tr', tg, true),
    ('secret_choice', en_bold, 'If you sensed your partner was hiding something, would you hesitate to ask?',  'en', tg, true),
    ('secret_choice', es_bold, 'Si sintieras que tu pareja te oculta algo, ¿dudarías en preguntarle?',         'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_bold, 'Fiziksel yakınlık, ilişkide duygusal bağlılığın bir göstergesidir?',           'tr', tg, true),
    ('secret_choice', en_bold, 'Is physical intimacy a sign of emotional closeness in a relationship?',        'en', tg, true),
    ('secret_choice', es_bold, '¿La intimidad física es una señal de conexión emocional en una relación?',     'es', tg, true);

  tg := gen_random_uuid();
  INSERT INTO public.questions (mode, category_id, question_text, locale, translation_group_id, is_active) VALUES
    ('secret_choice', tr_bold, 'Geçmiş ilişkilerin detayları partnerinizle paylaşılmalı mıdır?',               'tr', tg, true),
    ('secret_choice', en_bold, 'Should the details of past relationships be shared with your partner?',        'en', tg, true),
    ('secret_choice', es_bold, '¿Deberían compartirse los detalles de relaciones pasadas con tu pareja?',      'es', tg, true);

END;
$$;
