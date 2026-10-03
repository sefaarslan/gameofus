# API_SPEC.md — Game of Us

Next.js API route sözleşmeleri. **Gerçek davranışın kaynağı `app/api/**` kodudur**; bu doküman onların
özetidir. Web ve mobil (ayrı repo) aynı route'ları kullanır.

---

## 1. Genel Kurallar

- Tüm route'lar CORS destekler (`OPTIONS` → 204; `GET, POST, OPTIONS`; `Content-Type, Authorization`).
- Kritik işlemler (cevap/tahmin yazma, sonuç hesaplama, anket, token doğrulama) **server-side**'dır
  (service role). Client Supabase'e doğrudan yazmaz.
- **Kimlik:** `participant_token` (ham değer client'ta; DB'de yalnızca SHA-256 `token_hash`). Token'ı
  `Authorization: Bearer <token>` başlığıyla gönder; geriye dönük uyum için gövde (`participantToken`) ya da
  `GET` isteklerinde `?participantToken=` fallback'i de kabul edilir (web istemcisi şu an bunu kullanır;
  hardening'de header'a taşınması hedeflenir). Token DB'de plaintext tutulmaz.
- Expire olmuş odada yazma ve okuma reddedilir (`ROOM_EXPIRED`).
- Partnerin cevabı tahmin kilitlenmeden ve sonuçlar hazır olmadan **ham şekilde dönmez**.
- Hata biçimi (HTTP 4xx/5xx):

```json
{ "error": { "code": "ROOM_EXPIRED", "message": "Bu odanın süresi dolmuş." } }
```

Hata kodları: `ROOM_NOT_FOUND` (404), `ROOM_EXPIRED`, `ROOM_FULL`, `INVALID_TOKEN` (403), `ALREADY_SUBMITTED`,
`QUESTION_NOT_FOUND` (404), `RESULT_NOT_READY`, `RATE_LIMITED` (429), `INVALID_PAYLOAD`, `INTERNAL_ERROR` (500).

---

## 2. Endpoint Listesi

```txt
GET  /api/categories?locale=&relationshipType=
POST /api/rooms/create
POST /api/rooms/[roomCode]/join
GET  /api/rooms/[roomCode]/state
POST /api/rooms/[roomCode]/submit-turn
POST /api/rooms/[roomCode]/complete
GET  /api/rooms/[roomCode]/results
POST /api/feedback
```

Ayrı bir `calculate-results` endpoint'i **yoktur**: sonuç, ikinci oyuncu `complete` çağırdığında aynı
istek içinde hesaplanır. Planlanan (mobil için): `GET /api/users/me`, `POST /api/users/coins/spend`,
`POST /api/users/coins/earn`, `POST /api/iap/verify`, `GET /api/rooms/[roomCode]/ai-commentary`,
`DELETE /api/users/me`. Lemon Squeezy webhook'u **kullanılmaz**.

---

## 3. `GET /api/categories`

Sorgu: `locale` (`tr|en|es`, varsayılan `en`), opsiyonel `relationshipType` (`friend|dating|partner`;
geçersizse `INVALID_PAYLOAD`). Verilirse yalnızca o türe uygun kategoriler döner.

```json
[
  { "id": "uuid", "name": "Kanka Testi", "slug": "friend_test", "is_premium": false,
    "sort_order": 1, "relationship_types": ["friend"] }
]
```

Web, kategorileri sayfa açılırken bir kez (tür filtresi olmadan) çekip tür değişince **istemcide**
filtreler; sunucu uyumu `rooms/create`'te yine doğrular.

---

## 4. `POST /api/rooms/create`

Oda ve owner participant oluşturur, soruları seçip `room_questions`'a yazar.

```json
{
  "displayName": "Sefa",
  "partnerName": "Esra",
  "gameMode": "mixed",
  "questionCount": 10,
  "locale": "tr",
  "relationshipType": "friend",
  "categoryId": "uuid"
}
```

Doğrulama:

- `displayName` zorunlu. `gameMode`: `secret_choice | prediction | orderline | mixed` (geçersizse `secret_choice`).
- `questionCount`: 5 veya 10 (aksi halde 5). `locale`: oda dili (varsayılan `en`).
- `relationshipType` **opsiyonel** (alanı göndermeyen eski mobil build'ler için); gönderilirse
  `friend|dating|partner` olmalı, yoksa `INVALID_PAYLOAD`. Gönderilmezse oda `null` türle kurulur.
- `categoryId` opsiyonel. Hem `categoryId` hem `relationshipType` varsa kategori o türe uygun olmalı
  (`categories.relationship_types`), yoksa `INVALID_PAYLOAD`.
- IP hash'e göre saatte 10 / günde 50 oda sınırı (`RATE_LIMITED`).

**Soru seçimi:** Havuz = oda dili + `is_active` + ücretsiz + ilişki türüne uygun kategoriler. Seçilen kategori
önceliklidir; yetmezse yalnızca aynı havuzdan tamamlanır, hâlâ yetmezse `tr` havuzu. Tüm havuz çekilip
rastgele seçilir. Karma: 10 soruda 4 Secret Choice / 3 Prediction / 3 Orderline (5 soruda 3 / 1 / 1).

```json
{
  "roomCode": "X7K2P9QM",
  "roomUrl": "https://gameofus.app/game/room/X7K2P9QM",
  "participant": { "id": "uuid", "role": "owner", "displayName": "Sefa",
                   "partnerName": "Esra", "token": "raw-participant-token" }
}
```

Yanıt `201`. `roomUrl` `APP_BASE_URL` ortam değişkeninden üretilir; istemci paylaşım linkini kendisi de
`/<roomLocale>/game/room/<roomCode>` biçiminde kurar.

---

## 5. `POST /api/rooms/[roomCode]/join`

```json
{ "displayName": "Esra", "participantToken": "optional-existing-token" }
```

- Token geçerliyse mevcut participant aynı token ile döner (cihaz yeniden açılışı).
- Aksi halde oda doluysa (`join_locked` ya da 2 participant) `ROOM_FULL`; değilse guest oluşturulur,
  `join_locked = true` ve `status = guest_joined` yapılır.

```json
{ "roomCode": "X7K2P9QM",
  "participant": { "id": "uuid", "role": "guest", "displayName": "Esra", "token": "raw-token" },
  "roomStatus": "guest_joined" }
```

---

## 6. `GET /api/rooms/[roomCode]/state`

Oda, katılımcılar ve **tüm soruları (seçenekleriyle) tek seferde** döner; oyun boyunca istemci bunu bellekte
tutar. Token verilirse `participant` ve `progress` o oyuncuya göre dolar. Cevap/tahmin içermez.

```json
{
  "room": { "roomCode": "X7K2P9QM", "status": "guest_joined", "gameMode": "mixed",
            "questionCount": 10, "expiresAt": "2026-10-04T10:00:00Z", "locale": "tr",
            "relationshipType": "friend" },
  "participant": { "id": "uuid", "role": "owner", "displayName": "Sefa", "status": "playing" },
  "participants": [ { "role": "owner", "displayName": "Sefa", "status": "playing" },
                    { "role": "guest", "displayName": "Esra", "status": "joined" } ],
  "questions": [
    { "roundOrder": 1, "questionId": "uuid", "mode": "prediction",
      "questionText": "…", "options": [ { "id": "uuid", "optionText": "…", "sortOrder": 1 } ] }
  ],
  "progress": { "answeredCount": 2, "totalCount": 10 }
}
```

`options` Secret Choice'ta `null`'dır. `relationshipType` eski odalarda `null`.

---

## 7. `POST /api/rooms/[roomCode]/submit-turn`

Tek soruda cevap **ve** tahmini **tek istekte** kaydeder (kilitler).

```json
{
  "questionId": "uuid",
  "answerValue":    { "value": "yes" },
  "predictedValue": { "value": "unsure" },
  "confidenceLevel": "think"
}
```

`answerValue` / `predictedValue` biçimi moda göre: `{value}` · `{option_id}` · `{order:[…]}`.
`confidenceLevel`: `guess | think | sure` (geçersizse `guess`).

Kurallar: token doğrulanır; soru bu odaya ait olmalı (`QUESTION_NOT_FOUND`); aynı soruya ikinci cevap
`ALREADY_SUBMITTED`; cevap ve tahmin birlikte yazılır; oyuncunun ilk gönderimi participant ve oda
durumunu `playing` yapar. Bağımsız yazma/okuma adımları paralel çalışır.

Yanıt — partner o soruya zaten cevap verdiyse (ham cevap dönmez, yalnızca türetilmiş sonuç):

```json
{ "saved": true,
  "microReveal": { "available": true, "result": "near", "label": "Yakın tahmin", "points": 2,
                   "message": "Yakındın! …" } }
```

`result`: `correct` (puan = çarpan × 2) · `near` (çarpan × 1) · `miss` (0). Partner henüz oynamadıysa:

```json
{ "saved": true, "microReveal": { "available": false, "message": "Tahminin kaydedildi. …" } }
```

---

## 8. `POST /api/rooms/[roomCode]/complete`

Oyuncuyu `completed` yapar. **İlk bitiren:** `participants` ve `rooms.status` (`owner_completed`/
`guest_completed`) paralel güncellenir. **İkinci bitiren:** sonuç aynı istekte server-side hesaplanır:
`results` satırı yazılır, ardından `rooms.status = result_ready`. Duplicate sonuç oluşmaz
(`unique(room_id)`); idempotenttir.

```json
{ "completed": true, "resultReady": false }
```

İkinci oyuncuda `resultReady: true`. (Sonucun yazılması oda durumunun `result_ready`'ye çevrilmesinden önce
yapılır; başarısız olursa oda "hazır" görünmez.)

---

## 9. `GET /api/rooms/[roomCode]/results`

Token zorunlu. Oda `result_ready`/`completed` değilse `RESULT_NOT_READY`.

```json
{
  "readingScore": 80,
  "scoreLabel": "Birbirinizi gerçekten iyi tanıyorsunuz.",
  "myScore": 100,
  "room": { "roomCode": "X7K2P9QM", "gameMode": "mixed", "questionCount": 10, "relationshipType": "friend" },
  "me": { "id": "uuid", "role": "owner", "displayName": "Sefa" },
  "partner": { "role": "guest", "displayName": "Esra" },
  "questions": [
    { "questionId": "uuid", "roundOrder": 1, "mode": "secret_choice", "questionText": "…",
      "options": null,
      "myAnswer": { "value": "yes" }, "partnerAnswer": { "value": "yes" },
      "myPrediction": { "predictedValue": { "value": "unsure" }, "confidenceLevel": "think", "result": "near" },
      "partnerPredictionOfMe": { "predictedValue": { "value": "yes" }, "confidenceLevel": "sure", "result": "correct" } }
  ]
}
```

Okuma skoru = (doğru + yakın) / toplam tahmin × 100; güven çarpanı skora yansımaz. `scoreLabel` skora göre
5 kademeli sıcak bir metindir (≥90, ≥70, ≥50, ≥30, <30).

---

## 10. `POST /api/feedback`

Sonuç ekranı mini anketi. Bir katılımcı oda başına tek kayıt tutar (upsert); önce puan, sonra AI ilgisi/yorum
aynı satıra eklenir. Yalnızca sonuçlar hazır olduktan sonra kabul edilir. Cevap/tahmin içeriği saklanmaz.

```json
{ "roomCode": "X7K2P9QM", "rating": 5, "wantsAi": "yes", "comment": "Çok eğlenceliydi", "platform": "web" }
```

- Token zorunlu (`INVALID_TOKEN`). `rating`: 1–5 tamsayı. `wantsAi`: `yes|maybe|no` (opsiyonel).
  `comment` ≤ 500 karakter (kırpılır). `platform`: `mobile` ise `mobile`, aksi halde `web`.
- Oda `result_ready`/`completed` değilse `RESULT_NOT_READY`.
- Yalnızca gönderilen alanlar yazılır; önceki değerler (ör. yorum) korunur.

Yanıt `201`: `{ "saved": true }`.
