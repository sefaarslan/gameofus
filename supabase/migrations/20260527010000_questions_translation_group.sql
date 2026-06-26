-- =============================================================================
-- questions: translation_group_id ekleme
--
-- Aynı sorunun farklı dillerdeki karşılıklarını (TR/EN/ES) birbirine bağlamak
-- için opsiyonel bir grup kimliği. Kültüre özgü sorularda null bırakılabilir.
-- Oyun akışında (room_questions / answers / predictions) KULLANILMAZ;
-- yalnızca soru bankası içerik yönetimi içindir.
-- Mevcut sorgular bu kolonu seçmediği için tamamen geriye dönük uyumludur.
-- =============================================================================

alter table public.questions
  add column if not exists translation_group_id uuid;

create index if not exists idx_questions_translation_group
  on public.questions (translation_group_id)
  where translation_group_id is not null;
