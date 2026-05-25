# DATABASE_SCHEMA.md — Game of Us

Bu doküman Supabase Postgres veri modelini tanımlar. Migration üretiminde bu dosya esas alınmalıdır.

---

## 1. Genel İlkeler

- UUID primary key kullanılır.
- Zaman alanları `timestamptz` olmalıdır.
- Kritik duplicate kayıtlar unique constraint ile engellenir.
- Token DB'de plaintext tutulmaz, yalnızca hash tutulur.
- Reveal öncesi partner cevapları client'a ham veri olarak açılmaz.
- Ücretsiz oda 24 saat, premium oda 72 saat geçerlidir.

---

## 2. Enum / Check Değerleri

### room status

```txt
created
waiting_guest
guest_joined
owner_playing
guest_playing
owner_completed
guest_completed
result_ready
completed
expired
```

### participant role

```txt
owner
guest
```

### participant status

```txt
invited
joined
playing
completed
```

### game mode

```txt
secret_choice
prediction
orderline
mixed
```

MVP'de sadece `secret_choice` aktiftir.

### secret choice values

```txt
yes
unsure
no
```

### confidence level

```txt
guess
think
sure
```

---

## 3. Tablolar

## `users`

Yalnızca Faz 2 premium kullanıcıları için kullanılır. Supabase Auth UID ile ilişkilidir.

| Alan | Tip | Not |
|---|---|---|
| id | uuid | Supabase Auth UID |
| email | text | Kullanıcı e-postası |
| premium_until | timestamptz nullable | Premium bitiş zamanı |
| created_at | timestamptz | default now() |

---

## `rooms`

| Alan | Tip | Not |
|---|---|---|
| id | uuid | primary key |
| room_code | text | public link kodu, unique |
| status | text | room status |
| game_mode | text | MVP: secret_choice |
| question_count | int | seçilen soru sayısı |
| owner_id | uuid nullable | participants.id |
| user_id | uuid nullable | users.id, anonim odalarda null |
| is_premium_room | boolean | default false |
| max_participants | int | default 2 |
| join_locked | boolean | default false |
| locale | text | default 'tr' |
| created_at | timestamptz | default now() |
| expires_at | timestamptz | free: +24h, premium: +72h |

### Constraint / Index

```sql
unique(room_code)
index(status)
index(expires_at)
index(user_id)
```

---

## `participants`

| Alan | Tip | Not |
|---|---|---|
| id | uuid | primary key |
| room_id | uuid | rooms.id |
| role | text | owner / guest |
| display_name | text | yalnızca gösterim için |
| status | text | joined / playing / completed |
| token_hash | text | raw token değil, hash |
| last_seen_at | timestamptz nullable | opsiyonel |
| completed_at | timestamptz nullable | oyuncu bitirme zamanı |
| created_at | timestamptz | default now() |

### Constraint / Index

```sql
unique(room_id, role)
unique(room_id, token_hash)
index(room_id)
index(status)
```

---

## `questions`

| Alan | Tip | Not |
|---|---|---|
| id | uuid | primary key |
| mode | text | secret_choice / prediction / orderline |
| category | text | communication, social_life vb. |
| question_tr | text | Türkçe soru |
| question_en | text nullable | İngilizce soru, Faz 1'de opsiyonel |
| is_active | boolean | default true |
| created_at | timestamptz | default now() |

### Index

```sql
index(mode)
index(category)
index(is_active)
```

---

## `question_options`

Prediction modu için kullanılır. Secret Choice için seçenekler sabittir.

| Alan | Tip | Not |
|---|---|---|
| id | uuid | primary key |
| question_id | uuid | questions.id |
| option_tr | text | Türkçe seçenek |
| option_en | text nullable | İngilizce seçenek |
| sort_order | int | gösterim sırası |

### Constraint

```sql
unique(question_id, sort_order)
```

---

## `room_questions`

| Alan | Tip | Not |
|---|---|---|
| id | uuid | primary key |
| room_id | uuid | rooms.id |
| question_id | uuid | questions.id |
| round_order | int | oyun içi sıra |

### Constraint / Index

```sql
unique(room_id, round_order)
unique(room_id, question_id)
index(room_id)
```

---

## `answers`

| Alan | Tip | Not |
|---|---|---|
| id | uuid | primary key |
| room_id | uuid | rooms.id |
| question_id | uuid | questions.id |
| participant_id | uuid | participants.id |
| answer_value | jsonb | secret_choice için string value tutulabilir |
| locked_at | timestamptz | kilit zamanı |
| created_at | timestamptz | default now() |

### Constraint / Index

```sql
unique(room_id, question_id, participant_id)
index(room_id)
index(participant_id)
```

---

## `predictions`

| Alan | Tip | Not |
|---|---|---|
| id | uuid | primary key |
| room_id | uuid | rooms.id |
| question_id | uuid | questions.id |
| predictor_participant_id | uuid | tahmini yapan |
| target_participant_id | uuid | tahmin edilen |
| predicted_value | jsonb | secret_choice için string value |
| confidence_level | text | guess / think / sure |
| confidence_multiplier | int | 1 / 2 / 3 |
| locked_at | timestamptz | kilit zamanı |
| created_at | timestamptz | default now() |

### Constraint / Index

```sql
unique(room_id, question_id, predictor_participant_id, target_participant_id)
index(room_id)
index(predictor_participant_id)
index(target_participant_id)
```

---

## `results`

| Alan | Tip | Not |
|---|---|---|
| id | uuid | primary key |
| room_id | uuid | rooms.id |
| reading_score | numeric | 0-100 |
| details_json | jsonb | soru bazlı sonuçlar |
| created_at | timestamptz | default now() |

### Constraint

```sql
unique(room_id)
```

---

## `payments` — Faz 2

| Alan | Tip | Not |
|---|---|---|
| id | uuid | primary key |
| user_id | uuid | users.id |
| room_id | uuid nullable | ilgili oda varsa |
| provider | text | lemonsqueezy |
| provider_event_id | text | webhook event id |
| amount | numeric | 2.99 |
| currency | text | USD |
| status | text | pending / paid / failed / refunded |
| created_at | timestamptz | default now() |

### Constraint

```sql
unique(provider_event_id)
```

---

## `rate_limits` — Opsiyonel

| Alan | Tip | Not |
|---|---|---|
| id | uuid | primary key |
| ip_hash | text | IP hash |
| action | text | create_room vb. |
| count | int | istek sayısı |
| window_start | timestamptz | pencere başlangıcı |
| created_at | timestamptz | default now() |

---

## 4. Migration Notları

- `answers` ve `predictions` kayıtları kilitlendikten sonra güncellenmemelidir.
- Duplicate submit durumunda API aynı kaydı ikinci kez yazmamalı; uygun hata veya mevcut durum dönmelidir.
- Expire için cron gerekmez; `expires_at < now()` kontrolü okuma anında yapılır.
- Eski anonim oda temizleme job'u Faz 3'e bırakılır.
