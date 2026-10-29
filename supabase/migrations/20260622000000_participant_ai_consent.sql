-- =============================================================================
-- Hesapsız (web) oyuncunun yapay zekâ rızası
--
-- AI yorumu (mobil) odadaki İKİ oyuncunun verisini (ad, cevaplar, tahminler; varsa yaş aralığı, burç, İspanyolca odada cinsiyet)
-- üçüncü taraf bir modele gönderir. Rıza hesabı olan oyuncuda `users.ai_consent_at/version`'dadır; mobilden kurulmuş odaya web'den
-- katılan hesapsız oyuncunun rızası burada, katılım satırında tutulur (oda silinince cascade ile gider).
--
-- Sunucu kuralı: AI yorumu yalnızca odadaki her oyuncunun rızası varsa üretilir (eksikse coin düşmeden `403 AI_PARTNER_CONSENT_REQUIRED`).
-- Metin sürümü web için `web-ai-v1` (lib/ai/consent.ts); metin docs/legal/ai-consent-v2-draft.md ile uyumlu tutulur.
--
-- Kişisel olmayan metrik görünümlerine/arşiv tablolarına GİRMEZ.
-- =============================================================================
begin;

alter table public.participants
  add column if not exists ai_consent_at      timestamptz,
  add column if not exists ai_consent_version text;

comment on column public.participants.ai_consent_at is
  'Hesapsız (web) oyuncunun AI yorumu rızası; hesaplı oyuncuda users.ai_consent_at geçerlidir. Oda silinince gider.';

commit;
