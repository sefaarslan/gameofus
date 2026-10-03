# DATABASE_SCHEMA.md — Game of Us

Supabase Postgres veri modeli. **Gerçek şemanın tek kaynağı `supabase/migrations/*.sql` dosyalarıdır**;
bu doküman onların okunabilir özetidir. Çelişkide migration'lar geçerlidir. Tipler:
`types/database.types.ts`.

---

## 1. Genel İlkeler

- UUID primary key; zaman alanları `timestamptz`.
- Kritik duplicate kayıtlar unique constraint ile engellenir.
- Token DB'de plaintext tutulmaz, yalnızca `token_hash`.
- Reveal öncesi partner cevapları client'a ham veri olarak açılmaz; tüm yazma/okuma server-side
  endpoint'ler (service role) üzerinden yapılır. RLS açıktır, doğrudan client erişimi kısıtlıdır.
- **Tüm odalar 24 saat geçerlidir** (`expires_at`); premium ayrımı yoktur. Expire okuma anında
  `expires_at < now()` ile kontrol edilir.
- **Sorular silinmez, pasife alınır** (`questions.is_active = false`): `room_questions` cascade ile
  silinir, `answers`/`predictions` soruya cascade'siz bağlıdır.

---

## 2. Enum / Check Değerleri

| Ad | Değerler |
|---|---|
| `room_status` | `created`, `waiting_guest`, `guest_joined`, `owner_playing`, `guest_playing`, `owner_completed`, `guest_completed`, `result_ready`, `completed`, `expired` |
| `participant_role` | `owner`, `guest` |
| `participant_status` | `invited`, `joined`, `playing`, `completed` |
| `game_mode` | `secret_choice`, `prediction`, `orderline`, `mixed` (`questions.mode` yalnızca ilk üçünü kullanır) |
| `confidence_level` | `guess` (×1), `think` (×2), `sure` (×3) |
| `rooms.relationship_type` | `friend`, `dating`, `partner` (check; nullable) |
| `categories.relationship_types` | bu üç değerin boş olmayan alt kümesi (`text[]`) |
| `feedback.wants_ai` | `yes`, `maybe`, `no` |

`answer_value` / `predicted_value` (jsonb) formatları:

| Mod | Format |
|---|---|
| secret_choice | `{ "value": "yes" \| "unsure" \| "no" }` |
| prediction | `{ "option_id": "<question_options.id>" }` |
| orderline | `{ "order": ["<option_id>", …] }` (1. eleman en önemli/tercihli) |

---

## 3. Tablolar

### `users` — yalnızca mobil (Supabase Auth)

| Alan | Tip | Not |
|---|---|---|
| id | uuid | Supabase Auth UID |
| email | text | |
| is_premium | boolean | default false |
| room_credits | int | default 0 — **coin bakiyesi** için kullanılır |
| created_at | timestamptz | |

Planlanan (coin + tier modeli, bkz. PRD 12.2): `tier text default 'free' check in ('free','lite','premium')`,
`birth_date date null`, ayrıca `credit_transactions` (user_id, delta, reason, created_at) audit tablosu.
`premium_until` kaldırılmıştır.

### `rooms`

| Alan | Tip | Not |
|---|---|---|
| id | uuid | PK |
| room_code | text | unique, tahmin edilemez |
| status | room_status | |
| game_mode | game_mode | secret_choice / prediction / orderline / mixed |
| question_count | int | 5 veya 10 |
| owner_id | uuid null | participants.id |
| user_id | uuid null | users.id; anonim odalarda null |
| max_participants | int | default 2 |
| join_locked | boolean | oda dolunca true |
| locale | text | `tr` / `en` / `es`; oda kurulurken sabitlenir |
| category_id | uuid null | `categories.id` (odanın dilindeki satır) |
| relationship_type | text null | `friend` / `dating` / `partner`; eski odalarda ve alanı göndermeyen mobil build'lerde null |
| created_at | timestamptz | |
| expires_at | timestamptz | +24 saat |

`is_premium_room` kaldırılmıştır. Planlanan: `partner_birth_date date null` (yalnızca mobil, yaş doğrulama).

Index: `unique(room_code)`, `status`, `expires_at`, `user_id`, `category_id`.

### `participants`

| Alan | Tip | Not |
|---|---|---|
| id | uuid | PK |
| room_id | uuid | rooms.id (cascade) |
| role | participant_role | |
| display_name | text | yalnızca gösterim |
| status | participant_status | |
| token_hash | text | SHA-256, ham token tutulmaz |
| last_seen_at, completed_at | timestamptz null | |
| created_at | timestamptz | |

Constraint: `unique(room_id, role)`, `unique(room_id, token_hash)`.

### `categories`

Satır bazlı locale: aynı kategorinin TR/EN/ES için ayrı satırı vardır.

| Alan | Tip | Not |
|---|---|---|
| id | uuid | PK |
| slug | text | dil bağımsız kimlik (`friend_test`, `communication`…) |
| name | text | o dildeki görünen ad |
| locale | text | `tr` / `en` / `es` |
| is_premium | boolean | slug bazında tüm dillerde aynı olmalı |
| relationship_types | text[] | kategorinin göründüğü ilişki türleri; default `{friend,dating,partner}` |
| sort_order | int | |
| created_at | timestamptz | |

Constraint: `unique(slug, locale)`, `check (relationship_types <@ {friend,dating,partner} and cardinality > 0)`.
Planlanan: `min_tier text` (free/lite/premium).

Güncel kategoriler (v2, 11): `friend_test`, `wild_scenarios`, `social_life` (friend) · `first_date`, `romance`
(dating) · `future`, `home_money` (partner) · `communication`, `lifestyle`, `values` (üçü) · `bold`
(dating + partner, premium). Ayrıntı: PRD Bölüm 20.

### `questions`

| Alan | Tip | Not |
|---|---|---|
| id | uuid | PK (v2 sorularda belirlenimci UUID v5) |
| mode | game_mode | secret_choice / prediction / orderline |
| category_id | uuid | categories.id (ilgili dildeki satır) |
| question_text | text | `locale` dilinde |
| locale | text | default 'tr' |
| translation_group_id | uuid null | aynı sorunun dilleri; yalnızca içerik yönetimi için |
| insight_tag | text null | AI yorumu için tema etiketi; v2'de dolu, eski sorularda null; kullanıcıya görünmez |
| is_active | boolean | **silme, pasife al** |
| created_at | timestamptz | |

Eski `category` (text) kolonu kaldırılmış, yerine `category_id` gelmiştir. Aktif set: 990 satır
(11 kategori × 30 soru × 3 dil; mod başına 10). Eski 150 soru pasiftir (`insight_tag is null`).

### `question_options`

Prediction ve Orderline için (her soruda tam **4** seçenek); Secret Choice'ta kullanılmaz.

| Alan | Tip | Not |
|---|---|---|
| id | uuid | PK |
| question_id | uuid | questions.id (cascade) |
| option_text | text | soru dilinde |
| sort_order | int | 1'den başlar; Orderline'da yalnızca görüntüleme sırası |

Constraint: `unique(question_id, sort_order)`.

### `room_questions`

`room_id`, `question_id` (düz FK, oda dilindeki soru), `round_order`.
Constraint: `unique(room_id, round_order)`, `unique(room_id, question_id)`.

### `answers`

`room_id`, `question_id`, `participant_id`, `answer_value jsonb`, `locked_at`, `created_at`.
Constraint: `unique(room_id, question_id, participant_id)`. Kilitlendikten sonra güncellenmez.

### `predictions`

`room_id`, `question_id`, `predictor_participant_id`, `target_participant_id`, `predicted_value jsonb`,
`confidence_level`, `confidence_multiplier` (1/2/3), `locked_at`, `created_at`.
Constraint: `unique(room_id, question_id, predictor_participant_id, target_participant_id)`.

### `results`

`room_id` (unique), `reading_score numeric` (0–100), `details_json jsonb` (soru bazlı sonuçlar), `created_at`.
Planlanan: `ai_commentary text null`.

### `feedback`

Sonuç ekranı mini anketi. Yazma yalnızca `POST /api/feedback` ile; **RLS açık, policy yok**.

| Alan | Tip | Not |
|---|---|---|
| id | uuid | PK |
| room_id, participant_id | uuid null | cascade; `unique(room_id, participant_id)`; solo anketinde null |
| solo_session_id | uuid null | `solo_sessions.id` (cascade); `unique`; `check`: ya (room_id + participant_id) ya `solo_session_id` dolu |
| game | text null | solo oyun adı (ör. `red_flag`); oda anketinde null |
| rating | smallint | 1–5 |
| wants_ai | text null | yes / maybe / no |
| comment | text null | ≤ 500 karakter |
| locale, game_mode, relationship_type | text null | oda meta verisi |
| platform | text | `web` / `mobile` |
| created_at, updated_at | timestamptz | |

Cevap/tahmin içeriği saklanmaz.

### `solo_scenarios` / `solo_sessions` — solo oyunlar (Red Flag Mayın Tarlası)

Ayrı model; `questions` ile karıştırılmaz. RLS açık, policy yok (erişim yalnızca token doğrulayan sunucu endpoint'leri).

`solo_scenarios`: `id`, `game` (default `red_flag`), `scenario_key` (`tema:sıra`), `translation_group_id`, `locale`,
`scenario_text`, `insight_tag` (`boundaries | trust | communication | jealousy | money_lifestyle | respect`),
`is_active`, `created_at`. `unique(game, scenario_key, locale)`. `pack_key` (ör. `friend-101`, `romantic-103`) + `pack_position` (1-9): senaryonun hangi sette/kaçıncı sırada olduğu; `unique(game, pack_key, pack_position, locale)` (pack_key doluysa). Aktif set: 54 senaryo × 3 dil = 162 aktif satır, 6 set × 9 kart (65 senaryodan 11'i emekli/pasif; migration'lar `20260607000000`, `20260608000000`)
(belirlenimci UUID v5; migration `20260605000000_solo_red_flag.sql`, `scripts/build-solo-migration.mjs` üretir).

`solo_sessions`: `id`, `game`, `locale`, `pack_key` (oynanan set), `platform` (`web | mobile`), `user_id` (web'de null), `token_hash`,
`scenario_ids uuid[]` (kart sırası), `answers jsonb` (`{scenarioId: "green"|"yellow"|"red"}`), `status`
(`started | completed`), `coins_awarded int` (mobil; oturum başına bir kez), `ai_analysis text` (planlı),
`created_at`, `completed_at`.

### `purchases` — mobil IAP (Lemon Squeezy / `payments` kullanılmaz)

`user_id`, `product_type` (`premium_package` / `room_credit_pack`; coin+tier modelinde Lite/Premium
paketleri için genişletilecek), `provider` (`app_store` / `play_store`), `provider_transaction_id`
(unique), `amount`, `currency`, `status`, `created_at`. RLS: kullanıcı yalnızca kendi satırını okur.

### `rate_limits`

`key` (IP hash), `action` (`create_room`), `count`, `window_start`, `created_at`.
Limitler: IP başına saatte 10, günde 50 oda.

---

## 4. Metrik görünümleri

`security_invoker = true`; `anon`/`authenticated` erişimi `revoke` edilmiştir. Katılımcı adı `TEST-%` ile
başlayan odalar hariç tutulur. Supabase SQL editöründen okunur.

| Görünüm | İçerik |
|---|---|
| `metrics_daily_funnel` | gün × mod × ilişki türü × dil: açılan oda, partner katılan, sonucu hazır olan, katılım ve tamamlama yüzdesi |
| `metrics_participant_status` | gün × rol × durum: katılımcı sayısı (oyuncular nerede takılıyor) |
| `metrics_feedback_summary` | gün × mod × tür × dil (+ `source`: `duo` / `solo_<oyun>`): yanıt sayısı, ortalama puan, beğenen/beğenmeyen, AI ilgisi dağılımı, yorumlu sayısı |

---

## 5. Migration Notları

- Migration'lar tarih damgalı dosyalardır; sıra önemlidir. Soru seti v2 migration'ları üretilir
  (`scripts/build-questions-migration.mjs`): `…_questions_v2_schema` → `…part1..4` (sorular pasif eklenir) →
  `…activate` (sayı/kategori/seçenek doğrulaması + eskileri pasife alıp yenileri aktifleştirir, atomik).
  Üretilen dosyaları elle düzenleme; `seeds/v2` düzeltip yeniden üret.
- Geri dönüş: eski set silinmediği için `update questions set is_active = (insight_tag is null);` eski seti geri getirir.
- `answers` ve `predictions` kayıtları kilitlendikten sonra güncellenmez.
- Duplicate submit'te aynı kayıt ikinci kez yazılmaz.
- Eski anonim oda temizleme job'u ileri bir fazdadır.
