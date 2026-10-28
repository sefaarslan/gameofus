-- =============================================================================
-- Mobil geçmiş listelerinden "kaldır" (yumuşak silme): veri silinmez, yalnızca listeden gizlenir.
--
-- hidden_at (null = listede):
--   participants.hidden_at       : "Oyunlarım" listesinde ikili oda. Katılımcı satırı kullanıcıya özeldir; kurucu gizleyince
--                                  partnerin listesi etkilenmez.
--   solo_sessions.hidden_at      : "Oyunlarım" listesinde solo oyun. Oturum silinmediği için günlük set kuralı
--                                  (uq_solo_sessions_daily_completed) ve +50 coin idempotency'si aynen geçerli kalır.
--   ai_commentaries.hidden_at    : "Analizlerim" listesinde oda yorumu (yalnızca satın alanın listesi).
--   ai_solo_analyses.hidden_at   : "Analizlerim" listesinde solo analiz.
-- Saklama temizliği ve hesap silme bu sütunlardan etkilenmez (satırlar süresi gelince yine silinir).
-- =============================================================================
begin;

alter table public.participants      add column if not exists hidden_at timestamptz;
alter table public.solo_sessions     add column if not exists hidden_at timestamptz;
alter table public.ai_commentaries   add column if not exists hidden_at timestamptz;
alter table public.ai_solo_analyses  add column if not exists hidden_at timestamptz;

commit;
