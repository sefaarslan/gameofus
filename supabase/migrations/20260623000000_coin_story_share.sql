-- =============================================================================
-- Coin ekonomisi güncellemesi (PRD 12.2, karar 2026-11-03):
--   reklam +50 (günde 3) · story paylaşımı +25 (günde 1) · oda −250 · AI yorum −150 · solo AI −150
-- Fiyatlar ve ödüller kodda (lib/coins.ts); veritabanında yalnızca yeni hareket nedeni `story_share` eklenir.
-- =============================================================================
begin;

alter table public.credit_transactions drop constraint if exists credit_transactions_reason_check;
alter table public.credit_transactions add constraint credit_transactions_reason_check
  check (reason in (
    'signup_bonus', 'ad_reward', 'story_share', 'room_create', 'room_create_refund',
    'ai_commentary', 'ai_commentary_refund', 'solo_reward', 'solo_ai', 'solo_ai_refund',
    'purchase', 'admin_adjust'));

commit;
