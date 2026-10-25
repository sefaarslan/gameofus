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
- **Oda kodu (`roomCode`):** linkteki kod ile elle yazılan kod **aynı değerdir** (ayrı kısa kod/takma ad yok). Yeni odalar **6 karakter** (charset `ABCDEFGHJKMNPQRSTUVWXYZ23456789`: 0/1/I/L/O yok; ≈887 milyon olasılık, modulo yanlılığı olmayan üretim); eski odalar 8 karakterlidir ve geçerli kalır. `[roomCode]` alan **tüm uçlar** (join, state, submit-turn, complete, results; ayrıca `feedback` gövdesindeki `roomCode`) kodu **normalize eder**: harf boyutu, tire, boşluk ve diğer işaretler yok sayılır, büyük harfe çevrilir (`k7m-2pq`, `K7M 2PQ`, `K7M2PQ` → `K7M2PQ`; `lib/room-code-utils.ts` → `normalizeRoomCode`). Yanıtlardaki `roomCode` her zaman kanonik biçimdir. Ayrı bir "kodu çözümle" ucu yoktur: istemci kodu normalize edip doğrudan `join`'e gönderir.
- **Kötüye kullanım sınırları (kod kısa olduğu için):** (1) `POST /rooms/{roomCode}/join` her deneme sayılır: **IP başına ve (giriş yapmışsa) kullanıcı başına dakikada 10**, aşılırsa `429 RATE_LIMITED`. (2) **Oda varlığı sızmaz.** Herkese açık uçlarda (`join`, `state`; link önizlemesi için oda zaten görünür) bulunamayan kod `404 ROOM_NOT_FOUND` ("Oda bulunamadı."). **Token gerektiren uçlarda (`results`, `submit-turn`, `complete`, `feedback`) "oda yok" ile "token yanlış" birebir aynı yanıtı verir: `403 INVALID_TOKEN` ("Geçersiz token.")**; oda durumları (`ROOM_EXPIRED`, `RESULT_NOT_READY`, `ALREADY_SUBMITTED`…) yalnızca kimlik doğrulandıktan **sonra** söylenir. (Geçersiz/süresi dolmuş JWT her durumda `401 UNAUTHORIZED`.) Başarısız denemeler (bulunamayan kod ya da yanlış token) aynı IP'den dakikada 10'u geçerse `429 RATE_LIMITED`; başarılı aramalar sayılmaz. (3) Oda dolunca `join_locked = true`; dolu odaya ikinci kişi `400 ROOM_FULL`. (4) Süresi dolan oda `400 ROOM_EXPIRED`.
- Partnerin cevabı tahmin kilitlenmeden ve sonuçlar hazır olmadan **ham şekilde dönmez**.
- Hata biçimi (HTTP 4xx/5xx):

```json
{ "error": { "code": "ROOM_EXPIRED", "message": "Bu odanın süresi dolmuş." } }
```

Hata kodları: `ROOM_NOT_FOUND` (404), `ROOM_EXPIRED` (400), `ROOM_FULL` (400), `ROOM_WEB_ONLY` (403), `INVALID_TOKEN` (403), `ALREADY_SUBMITTED`,
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
POST /api/solo/red-flag/start
POST /api/solo/[sessionId]/complete
GET  /api/solo/[sessionId]/ai-analysis   (mobil, Bearer JWT; AI analiz durumu, ücretsiz)
POST /api/solo/[sessionId]/ai-analysis   (mobil, Bearer JWT; 100 coin, satın al + üret)
GET  /api/solo/red-flag/card?g=&l=&p=&q=&fmt=
GET  /api/users/me                (mobil, Bearer JWT)
GET  /api/users/history           (mobil, Bearer JWT; oda geçmişi, son 90 gün; düz dizi)
GET  /api/users/solo-history      (mobil, Bearer JWT; + /[sessionId])
POST /api/users/coins/spend       (mobil, Bearer JWT)
POST /api/users/coins/earn        (mobil, Bearer JWT)
```

Ayrı bir `calculate-results` endpoint'i **yoktur**: sonuç, ikinci oyuncu `complete` çağırdığında aynı
istek içinde hesaplanır. Planlanan (mobil için): `POST /api/iap/verify`. Lemon Squeezy webhook'u **kullanılmaz**.

---

## 3. `GET /api/categories`

Sorgu: `locale` (`tr|en|es`, varsayılan `en`), opsiyonel `relationshipType` (`friend|dating|partner`;
geçersizse `INVALID_PAYLOAD`). Verilirse yalnızca o türe uygun kategoriler döner.

```json
[
  { "id": "uuid", "name": "Kanka Testi", "slug": "friend_test", "is_premium": false,
    "sort_order": 1, "relationship_types": ["friend"], "min_tier": "free", "min_age": 0, "locked": false }
]
```

`min_tier` (`free|lite|premium`) kategoriye erişim için gereken paket, `min_age` asgari yaş (Cesur = 18). **`locked`**: bu
istemci kategoriyi seçemez. Anonim web'de `min_tier ≠ free` olanlar kilitlidir (mobile yönlendirme); `Authorization: Bearer
<Supabase JWT>` ile kullanıcının tier'ına göre hesaplanır (`premium` ≥ `lite` ≥ `free`; tier yalnızca yükselir). Yaş koşulu
(`min_age`) burada değil, oda kurarken doğrulanır.

Web, kategorileri sayfa açılırken bir kez (tür filtresi olmadan) çekip tür değişince **istemcide**
filtreler; sunucu uyumu `rooms/create`'te yine doğrular.

---

## 4. `POST /api/rooms/create`

Oda ve owner participant oluşturur, soruları seçip `room_questions`'a yazar.

```json
{
  "displayName": "Sefa",
  "gameMode": "mixed",
  "questionCount": 10,
  "locale": "tr",
  "relationshipType": "friend",
  "categoryId": "uuid",
  "birthDate": "1990-01-31",
  "gender": "female"
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
- **Paket kilidi (mobil):** kategorinin `min_tier`'ı `free` değilse yalnızca giriş yapmış ve tier'ı yeterli kullanıcı seçebilir;
  anonim web veya yetersiz tier → `403 TIER_REQUIRED`. Coin düşümünden **önce** kontrol edilir.
- **Yaş koşulu:** `min_age > 0` olan kategoride (Cesur = 18) `relationshipType` zorunlu (kategori yalnızca `dating|partner`),
  **kurucu** (`birthDate` gövdede ya da profilden `users.birth_date`) asgari yaşta olmalı: tarih eksikse `400 AGE_VERIFICATION_REQUIRED`,
  küçükse `403 AGE_RESTRICTED`. Tarihler `YYYY-AA-GG`; geçersiz/gelecek → `INVALID_PAYLOAD`. `birthDate` (web ve mobil, opsiyonel) oyuncunun kendi doğum tarihidir: `participants.birth_date`'e yazılır (odayla birlikte silinir); mobilde ayrıca profile yazılır. **Asgari yaş 13**: daha küçük tarih `403 AGE_RESTRICTED` (oda açılmaz, tarih saklanmaz). **Karşı
  oyuncunun yaşı katılırken** doğrulanır (bkz. `join`). Oda yalnızca kurucunun bilgisini alır: `partnerName`, `partnerGender`,
  `partnerBirthDate` gönderilse bile **yok sayılır** (başkasının verisi toplanmaz; eski istemciler kırılmaz).
- **Cinsiyet (opsiyonel):** `gender` (kurucunun kendisi) `female` | `male`; boş/geçersiz = belirtilmedi (hata vermez). `participants.gender`'a
  yazılır (yalnızca bu oda için; profile yazılmaz). Karşı oyuncu katılırken (`POST /api/rooms/{roomCode}/join`) gövdede kendi `gender`'ını
  gönderebilir (gerektiğinde: sahne/AI).

**Soru seçimi:** Havuz = oda dili + `is_active` + ücretsiz + ilişki türüne uygun kategoriler. Seçilen kategori
önceliklidir; yetmezse yalnızca aynı havuzdan tamamlanır, hâlâ yetmezse `tr` havuzu. Tüm havuz çekilip
rastgele seçilir. Karma: 10 soruda 4 Secret Choice / 3 Prediction / 3 Orderline (5 soruda 3 / 1 / 1).

```json
{
  "roomCode": "X7K2P9QM",
  "roomUrl": "https://gameofus.app/game/room/X7K2P9QM",
  "participant": { "id": "uuid", "role": "owner", "displayName": "Sefa", "token": "raw-participant-token" }
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
- **Webden kurulan oda yalnızca web'e açıktır** (deneme amaçlı; kurucusu hesapsız, `rooms.user_id` boş): mobil kimlikle (`platform: "mobile"` + Bearer JWT) katılma `403 ROOM_WEB_ONLY` ("Bu oda web'de kurulmuş ve yalnızca web'den oynanabilir."). **Mobilden kurulan odaya hem mobil hem web katılabilir.** Hız limiti ve normalize için bkz. Bölüm 1.
- Aksi halde oda doluysa (`join_locked` ya da 2 participant) `ROOM_FULL`; değilse guest oluşturulur,
  `join_locked = true` ve `status = guest_joined` yapılır. Gövdede opsiyonel `gender` (`female|male`) ve `birthDate` (`YYYY-AA-GG`) katılanın **kendi** beyanıdır: `birthDate` `participants.birth_date`'e yazılır (odayla birlikte silinir); geçersiz → `400 INVALID_PAYLOAD`, **13 yaş altı → `403 AGE_RESTRICTED`** (katılımcı eklenmez).
- **Yaş koşullu oda (18+ kategori, ör. Cesur):** katılanın yaşı kendi hesabından doğrulanır. Mobil (JWT): profildeki `users.birth_date`;
  tarih yoksa `400 AGE_VERIFICATION_REQUIRED`, asgari yaşın altındaysa `403 AGE_RESTRICTED` (katılımcı eklenmez). Anonim web: doğum tarihi
  olmadığı için `400 AGE_VERIFICATION_REQUIRED` ("yalnızca mobil uygulamada oynanır"). Mevcut token ile yeniden giriş bu kontrolden etkilenmez.

```json
{ "roomCode": "X7K2P9QM",
  "participant": { "id": "uuid", "role": "guest", "displayName": "Esra", "token": "raw-token" },
  "roomStatus": "guest_joined" }
```

---

## 6. `GET /api/rooms/[roomCode]/state`

Oda, katılımcılar ve **tüm soruları (seçenekleriyle) tek seferde** döner; oyun boyunca istemci bunu bellekte
tutar. Token verilirse `participant` ve `progress` o oyuncuya göre dolar. Cevap/tahmin içermez.

**Katılımcı olmayan istek (token/JWT yok ya da eşleşmiyor — davet linkini açan, henüz katılmamış kişi) yalnızca asgari önizleme alır:** `room` (durum, mod, soru sayısı, dil, ilişki türü, bitiş), `participant: null`, `participants` yalnızca `{ role, status }` (**oyuncu adı yok**; dolu olup olmadığı anlaşılır), **`questions: []`**, `progress` sıfır. Oyuncu adları ve sorular yalnızca token/JWT ile doğrulanan katılımcıya döner (kod tahmin edilirse bilgi sızmaz). Katıldıktan sonra istemci token ile yeniden çağırıp tam veriyi alır.

**Kimlik (mobil):** token yoksa `Authorization: Bearer <Supabase JWT>` ile de oyuncu belirlenir: `participants.user_id`
giriş yapmış kullanıcıyla eşleşen katılımcı o kullanıcıdır (başka cihazda/yeniden kurulumda oyuna devam). Token yolu
öncelikli (JWT doğrulaması yalnızca token yoksa yapılır). Oda hâlâ süre kontrolüne tabidir (`ROOM_EXPIRED`, 400).
JWT gönderildiği hâlde oyuncu belirlenemezse: **geçersiz/süresi dolmuş JWT → `401 UNAUTHORIZED`**, geçerli JWT ama bu odanın
katılımcısı değil → **`403 INVALID_TOKEN`**. Hiç kimlik göndermeyen (web/anonim) istek eskisi gibi `200` ve `participant: null` alır.

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

**Kimlik:** katılımcı token'ı (`Authorization: Bearer <token>` ya da gövdede `participantToken`) **ya da (mobil) giriş yapmış kullanıcının
Supabase JWT'si**: token yoksa `participants.user_id` JWT kullanıcısıyla eşleşen katılımcı o oyuncudur (başka cihazdan/yeniden kurulumdan sonra
yarım kalan oyuna devam). Token öncelikli; web anonim akışı değişmez. Hatalar: geçersiz/süresi dolmuş JWT `401 UNAUTHORIZED`,
geçerli JWT ama bu odanın katılımcısı değil `403 INVALID_TOKEN`, hiç kimlik yok `400 INVALID_TOKEN`, **oda süresi dolmuşsa JWT ile de
`400 ROOM_EXPIRED`** (devam etmek yalnızca aktif odada). Aynı hesap odada iki rolde de varsa (kendi odasına kendi hesabıyla katılmak) JWT
hangi oyuncu olduğunu belirleyemez → `403 INVALID_TOKEN` (token ile yazılır).

Kurallar: kimlik doğrulanır; soru bu odaya ait olmalı (`QUESTION_NOT_FOUND`); aynı soruya ikinci cevap
`ALREADY_SUBMITTED`; cevap ve tahmin birlikte yazılır; oyuncunun ilk gönderimi participant ve oda
durumunu `playing` yapar. Bağımsız yazma/okuma adımları paralel çalışır.

Yanıt (her zaman aynı; **anlık sonuç yoktur** — sunucu partnerin cevabını okumaz, doğru/yakın/ıskaladı/puan dönmez):

```json
{ "saved": true, "microReveal": { "available": false, "message": "Tahminin kaydedildi. Yanıtlar, tüm sorular bitince birlikte görünecek." } }
```

`microReveal` alanı yalnızca eski istemcilerin yanıt şeklini bozmamak için kalır (her zaman `available: false`); yeni istemciler
yok sayar ve kilitleyince doğrudan sonraki soruya geçer (ara kart yok). Yanıtlar iki taraf da bitirince `results`'ta açılır.

---

## 8. `POST /api/rooms/[roomCode]/complete`

Oyuncuyu `completed` yapar. Kimlik `submit-turn` ile aynıdır (katılımcı token'ı **ya da** mobil JWT; hata kodları ve süresi dolmuş oda davranışı aynı).
**İlk bitiren:** `participants` ve `rooms.status` (`owner_completed`/
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

Kimlik zorunlu: katılımcı token'ı **ya da (mobil) giriş yapmış kullanıcının Supabase JWT'si** (`participants.user_id`
eşleşmesi). Oda `result_ready`/`completed` değilse `RESULT_NOT_READY`. **Süresi dolmuş odalar yalnızca JWT ile açılır**
(geçmiş: saklama süresi, `expires_at` + 90 gün boyunca); token ile süresi dolmuş odada `ROOM_EXPIRED`. Odada katılımcısı
olmayan JWT → `403 INVALID_TOKEN`; geçersiz/süresi dolmuş JWT → `401 UNAUTHORIZED`; hiç kimlik yok → `403 INVALID_TOKEN`.

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

## 10b. Solo oyun: Red Flag Mayın Tarlası

Doğru cevap yoktur; sonuç yalnızca Green/Yellow/Red dağılımından türeyen tolerans profilidir. Web'de anonim (token),
mobilde aynı endpoint'ler `platform: "mobile"` ile kullanılır (coin/AI ileride eklenecektir).

### `POST /api/solo/red-flag/start`

```json
{ "locale": "tr", "platform": "web" | "mobile", "pack": "friend-101" }
```

- `pack` zorunlu: `friend-101…106`, `romantic-101…106`; geçersizse `INVALID_PAYLOAD`. Webde yalnızca 101-103 açık;
  diğerleri `403 PACK_UNAVAILABLE` ("mobilde açılacak").
- IP hash'e göre saatte 30 / günde 100 başlatma sınırı (`RATE_LIMITED`). `locale` geçersizse `en`.
- `platform: "mobile"` ise geçerli Supabase JWT (`Authorization: Bearer`) zorunlu (`401`); oturum `user_id`'ye bağlanır, mobilde tüm setler
  oynanabilir. İçeriği olmayan set (ör. 104-106) → `404 PACK_UNAVAILABLE`.
- Sunucu, setin 9 kartını sabit sırayla (`pack_position`) döndürür (rastgelelik yok), oturumu (`pack_key`) ve anonim token'ı oluşturur. Kart geçişleri istemcide
  yapılır; cevaplar bu endpoint'e değil `complete`'e gider.

```json
{ "sessionId": "uuid", "token": "raw-token", "locale": "tr", "pack": "friend-101",
  "scenarios": [ { "id": "uuid", "text": "Sevgilin, eski sevgilisinin hediyesini hâlâ rafta saklıyor." } ] }
```

Yanıt `201`. `scenarios` kart sırasıdır.

### `POST /api/solo/[sessionId]/complete`

`Authorization: Bearer <token>` (veya gövdede `participantToken`).

```json
{ "answers": { "<scenarioId>": "green", "<scenarioId>": "red" } }
```

- `answers` tam olarak oturumun 9 senaryosunu içermeli, değerler `green|yellow|red`; aksi halde `INVALID_PAYLOAD`.
  Bilinmeyen oturum `SESSION_NOT_FOUND` (404), yanlış token `INVALID_TOKEN` (403). **İdempotent:** tamamlanmış oturum
  aynı sonucu döndürür.

```json
{ "counts": { "green": 2, "yellow": 2, "red": 5 }, "tolerance": 33, "grid": "RRYRGRRYG" }
```

`tolerance = round((green×2 + yellow)/18 × 100)`. `grid`: kart sırasıyla 9 harf (G/Y/R). Sunucu başlık/cümle
döndürmez: istemci ve paylaşım görseli, Red sayısına göre sabit metni (`solo.verdicts.<red>`) kendi dilinde seçer.

**Mobil (kullanıcıya bağlı oturum) yanıtına `reward` eklenir:** `{ "earned": 20, "balance": 520 }` veya ödül yoksa
`{ "earned": 0, "reason": "already_rewarded" | "daily_limit" }`. Kural: **+20 coin, her set için kullanıcı başına yalnızca bir
kez** (aynı seti tekrar oynamak ödülsüz), **günde en fazla 3 ödüllü oyun**; idempotent (aynı oturum tekrar `complete` edilirse
ek coin yok). Web (anonim) yanıtında `reward` alanı yoktur.

### `GET /api/users/solo-history` ve `GET /api/users/solo-history/[sessionId]` (mobil)

`Authorization: Bearer <Supabase JWT>`. Liste: kullanıcının tamamlanmış solo oyunları (en yeni önce, en fazla 100):
`{ items: [{ sessionId, gameType, aiStatus, pack, locale, completedAt, coinsEarned, grid, counts, tolerance }] }`. `gameType` oyun türü
(`solo_sessions.game`, şimdilik hep `"red_flag"`), `aiStatus` AI analiz durumu (`none | generating | ready | failed`; liste için tek sorguyla hesaplanır, N tane GET gerekmez). Ayrıntı: aynı alanlar +
`cards: [{ id, text, flag }]` (kart sırasıyla metin ve seçilen bayrak). Başkasının/web oturumu `404 SESSION_NOT_FOUND`.

### `GET /api/solo/red-flag/card`

Paylaşım görseli (PNG, `next/og`): `g` (9 harf `[GYR]`, aksi 400), `l` (`tr|en|es`), `fmt=og` ile yatay 1200×630
link önizlemesi (varsayılan 1080×1920 story). Story'de isteğe bağlı `q` = virgülle ayrılmış en fazla 3
`<G|Y|R><senaryo uuid>`: her bayraktan bir senaryo metni DB'den okunup karta eklenir (geçersiz/bilinmeyen id
yok sayılır). Uzun süreli cache; cevap verisi içermez, yalnızca oyuncunun paylaşmak için seçtiği senaryo metinleri.

---

## 10b. `GET /api/cron/cleanup` (dahili, Vercel Cron)

`Authorization: Bearer <CRON_SECRET>` zorunlu (env yoksa `503`, yanlışsa `401`). Süresi dolmuş anonim verileri siler (bkz.
`docs/DATABASE_SCHEMA.md`, `lib/retention.ts`) ve `{ ok, rooms, solo, rateLimits, rounds }` döner. İstemciler çağırmaz.

## 10a. Mobil: kullanıcı ve coin endpoint'leri

Kimlik: `Authorization: Bearer <Supabase JWT>` (Google/Apple girişi). Web anonimdir ve bunları **hiç çağırmaz**.
Geçersiz/eksik JWT → `401 UNAUTHORIZED`. Coin yazımı yalnızca sunucuda, atomik ve idempotent (`apply_coins`, SQL).
Ekonomi: kayıt +500 (Auth trigger'ı, otomatik) · reklam +100 (günde en fazla 5) · oda −250 · AI yorum −100 · solo AI −100 ·
solo +20 (solo `complete` içinde, bkz. gelecek iş). **Miktarı istemci göndermez**, yalnızca `reason`.

- `GET /api/users/me` → `{ id, coins, tier, birthDate, aiConsent }` (`aiConsent`: `{ version, at }` ya da rıza yoksa `null`)
- `GET /api/users/history` → **düz dizi** (sarmalayıcı yok), en yeni önce (`created_at` azalan), en çok 100:
  `[{ roomCode, locale, relationshipType, status, role, partnerName, readingScore, completedAt, createdAt, gameMode, questionCount, expiresAt, expired, resultReady }]`.
  Kullanıcının (`participants.user_id`) tüm odaları; yalnızca `created_at` son 90 gün içinde olanlar. `status` ham `rooms.status`
  (`created … result_ready | completed | expired`); `role` `owner|guest`; `partnerName` karşı oyuncunun adı (yoksa/hesabını sildiyse `null`);
  `readingScore`/`completedAt` yalnızca sonuç hazırsa dolu (aksi `null`); `expired`/`resultReady` kolaylık alanları. Hata: JWT yoksa/geçersizse
  `401 UNAUTHORIZED` (katılımcı token'ı kabul edilmez). Sonuç ayrıntısı için `GET /api/rooms/{roomCode}/results` aynı JWT ile açılır (süresi dolmuş odada da).
- `PATCH /api/users/me` `{ "birthDate": "YYYY-AA-GG" }` → profil doğum tarihi (geçersiz `400`, 13 yaş altı `403 AGE_RESTRICTED`)
- `DELETE /api/users/me` `{ "confirm": true }` → `{ deleted: true }` — **hesap silme** (App Store 5.1.1(v) / Google Play). Silinen: kurulan odalar
  (içeriğiyle), solo oyunlar, coin kayıtları, kullanıcı ve Auth kaydı. Başkalarının odalarındaki katılım anonimleştirilir
  (ad kaldırılır, `user_id` null). `purchases` satırları kalır, kullanıcıdan ayrılır (yasal muhasebe). Onay yoksa `400`.
- `POST /api/users/coins/spend` `{ "reason": "ai_commentary" | "solo_ai", "refId": "…" }` → `{ balance, applied, spent }`;
  yetersiz bakiye `402 INSUFFICIENT_COINS`; aynı `refId` ikinci kez düşmez (`applied: false`). Oda coin'i `rooms/create`
  içinde düşülür.
- `POST /api/users/coins/earn` `{ "reason": "ad_reward", "refId": "…" }` → `{ balance, applied, earned }`; günlük sınır
  `429 AD_LIMIT_REACHED`.
- `POST /api/rooms/[roomCode]/join` (mobil): `platform: "mobile"` + Bearer JWT zorunlu (`401`); misafir katılımcı `user_id`'ye bağlanır
  (geçmiş ve hesap silme için). Katılımcı token'ı gövdede `participantToken` ile gönderilir (Authorization'da JWT varsa).
- `POST /api/rooms/create` (mobil): `platform: "mobile"` + Bearer JWT zorunlu (`401`); oda −250 coin düşülür
  (`402 INSUFFICIENT_COINS`), oda başarısız olursa iade edilir, `rooms.user_id` bağlanır. `platform` göndermeyen anonim
  web istekleri ücretsizdir ve değişmez.

## 10c. AI yorum (ikili sonuç) — YALNIZCA MOBİL

Web'de hiçbir yerde yoktur: web arayüzünde buton/kart/ipucu yok; `state`, `results`, `history` yanıtlarında AI ile ilgili alan yok.
Hesapsız (katılımcı token'lı) web oyuncusu yorumu hiçbir yoldan göremez (partneri mobildeyse ondan rica eder; ürün tarafında bir şey yapılmaz).
Model/sağlayıcı ortam değişkenlerinde (kodda değil): `AI_PRIMARY` (varsayılan `groq:openai/gpt-oss-120b`), `AI_FALLBACK` (isteğe bağlı,
ör. `openrouter:google/gemini-2.5-flash-lite` ya da `groq:qwen/qwen3.8-27b`), `GROQ_API_KEY`, `OPENROUTER_API_KEY`,
`AI_DAILY_LIMIT_GROQ` (ücretsiz katman koruması için günlük yumuşak sınır, varsayılan 60). Kod: `lib/ai/`.

**Kimlik (GET ve POST):** yalnızca geçerli Supabase JWT. Katılımcı token'lı ya da kimliksiz istek → `403 AI_MOBILE_ONLY`; geçersiz/süresi dolmuş
JWT → `401 UNAUTHORIZED`; geçerli JWT ama bu odanın katılımcısı değil, oda yok ya da aynı hesap iki rolde → hepsi aynı `403 INVALID_TOKEN`
(oda varlığı sızmaz).

- `POST /api/users/ai-consent` `{ "version": "<rıza metni sürümü>" }` (1-32 karakter: harf, rakam, `.` `_` `-`) → `{ ok: true }`.
  Sunucu sürümü yalnızca saklar (`users.ai_consent_at/version`); metin mobilde. Rıza yoksa POST `403 AI_CONSENT_REQUIRED`.
- `GET /api/rooms/[roomCode]/ai-commentary` → 200 `{ status: "none"|"generating"|"ready"|"failed", purchasedByMe, content?, createdAt? }`.
  Odanın her katılımcısına ücretsiz (satın alan da, partner de). `none` hata değildir. `content` yalnızca `ready`. Süresi dolmuş oda da
  saklama süresi içinde JWT ile okunabilir (POST için de aynısı geçerli).
- `POST /api/rooms/[roomCode]/ai-commentary` (gövde yok), sıra:
  1. Kimlik → hız sınırı (kullanıcı başına dakikada 5, günde 20; `429 RATE_LIMITED`) → katılımcı → rıza.
  2. Sonuç hazır değilse (`result_ready`/`completed` değil) `409 RESULT_NOT_READY`. **`expires_at` geçmiş odada da satın alma mümkündür** (`ROOM_EXPIRED` yoktur): sonuç, odanın saklama süresi (90 gün) boyunca açılabilir; oda silinmişse (saklama süresi geçmişse) oda bulunamaz ve diğer kimlik hatalarıyla aynı `403 INVALID_TOKEN` döner.
  3. Zaten `ready` kayıt varsa `200 { status:"ready", content, applied:false }` (**coin düşmez**; ikinci kişi okur). `generating` varsa `202 { status:"generating" }`.
  4. Sağlayıcı kapasitesi yoksa `503 AI_UNAVAILABLE` (**coin düşmeden**, `refunded:false`).
  5. Yarış-güvenli `generating` satırı açılır (odada aynı anda tek aktif kayıt), sonra coin düşer: `reason:"ai_commentary"`, `refId:"<oda kodu>:<attempt>"`,
     100 coin; yetersizse satır silinir, `402 INSUFFICIENT_COINS`.
  6. Ana modelle üretilir (~20 sn zaman aşımı; geçersiz çıktıda bir kez düzeltme turu); olmazsa yedek model. Başarılı: `200 { status:"ready", content, balance, applied:true, purchasedByMe:true }`.
  7. Başarısız: satır `failed`, coin iadesi (`reason:"ai_commentary_refund"`, aynı `refId`; iade yalnızca düşüm gerçekten yapıldıysa), `503 AI_UNAVAILABLE` + `refunded:true`.
     Yeniden denemede `attempt` artar (yeni coin referansı).
  8. 2 dakikadan uzun `generating` kalan (sunucu çökmesi) kayıtlar GET/POST sırasında `failed` sayılır ve iade edilir (tembel temizlik).
- `GET /api/users/ai-reports` (JWT) → **düz dizi**, yeniden eskiye (iki tür birlikte), en çok 100. Her satırda `type` vardır:
  `{ type:"room", roomCode, partnerName, relationshipType, headline, createdAt }` (oda yorumu) ve
  `{ type:"solo", sessionId, gameType, pack, headline, createdAt }` (solo analiz, bkz. §10d). Yalnızca kullanıcının SATIN ALDIĞI `ready`
  kayıtlar (partnerin aldıkları çıkmaz). `type` alanı geriye dönük uyumludur (eski istemci yok sayar; oda satırları aynı alanları taşır). JWT'siz `401`.

`content` biçimi (oda dilinde, `rooms.locale`): `{ headline: string, summary: string, strengths: string[3], blindSpots: string[2..3], conversationStarters: string[3], awards: { title: string, text: string }[3..4] }`.
`awards` (prompt v2.0, 2026-10-23) eğlenceli "ödül" kartlarıdır (`title` ≤ 60 karakter, çoğu zaman baştaki bir emojiyle; `text` tek cümle). **Eski kayıtlarda `awards` yoktur**: istemci alanın eksikliğini tolere etmeli (yoksa bölümü gizle). Ton v2.0'dan itibaren daha eğlenceli ve somuttur; uzunluk sınırları: headline ≤ 180, summary ≤ 1400, strengths/blindSpots ≤ 420/460, conversationStarters ≤ 300 karakter.
Sıralama (orderline) sorularında olgular "cevap" değil "sıralama" olarak anlatılır (1 = en önemli).
Sunucu Zod ile doğrular; yüzde, soru numarası ve JSON kırıntısı gibi içerik kuralları da denetlenir.

**Modele giden veri:** oyuncu adları (≤30 karakter, tek satır, veri olarak), kodda çözülmüş "olgu kartları" (cevaplar/tahminler soru ve seçenek METNİYLE,
benzerlik, "eminim ama ıskaladı" anları), ilişki türü, oda dili, yaş aralığı (ham doğum tarihi **asla**) ve cinsiyet yalnızca İspanyolca odalarda
(dil bilgisi için). Kimlik, token, e-posta gönderilmez. Loglara yalnızca hata türü ve süre girer.

**Veri saklama:** yorum odaya bağlıdır (oda 90 gün sonra silinince gider); satın alan hesabını silerse onun satın aldığı yorumlar da silinir.
`ai_usage_daily`: sağlayıcı başına günlük istek/token toplamı (kişisel veri yok).

---

## 10d. Solo oyunlar için AI analizi — YALNIZCA MOBİL

Oda yorumuyla (§10c) aynı ilkeler ve durum makinesi; **oyundan bağımsız** tasarım. Oturum kimliği tek alandır (`sessionId`); oyun türü sunucuda
oturumdan (`solo_sessions.game`) okunur, istemci göndermez. Şimdilik tek adaptör: `red_flag`. Yeni solo oyun = yeni **oyun adaptörü**
(`lib/ai/solo/<oyun>.ts`) + `lib/ai/solo/registry.ts`'e tek satır; route, tablo (`ai_solo_analyses`), coin/iade akışı, rıza, hata kodları ve mobil
bileşenler DEĞİŞMEZ. Kod: `lib/ai/solo/` (`types`, `registry`, `red-flag`, `envelope`, `prompt`, `generate`, `store`), çekirdek `lib/ai/structured.ts`.

**Kimlik (GET ve POST):** yalnızca geçerli Supabase JWT. Oturum token'ı ile gelen / kimliksiz istek → `403 AI_MOBILE_ONLY`; geçersiz JWT → `401 UNAUTHORIZED`.
Oturum yok, başkasının oturumu ya da anonim web oturumu (`user_id` boş) → hepsi AYNI `404 SESSION_NOT_FOUND` (varlık sızmaz). Oyun türü kayıtlı değilse
`400 INVALID_PAYLOAD` (500 değil).

- `GET /api/solo/{sessionId}/ai-analysis` → 200 `{ status: "none"|"generating"|"ready"|"failed", purchasedByMe, gameType, content?, createdAt? }`.
  `none` hata değildir. `content` yalnızca `ready`. Takılmış (2 dk) `generating` kayıtlar okuma sırasında `failed` sayılır ve iade edilir.
- `POST /api/solo/{sessionId}/ai-analysis` (gövde yok), sıra: kimlik → hız sınırı (kullanıcı başına dakikada 5, günde 20; `429 RATE_LIMITED`) → oturum sahipliği
  → rıza (`403 AI_CONSENT_REQUIRED`; aynı `ai-v1`) → oturum tamamlanmamışsa `409 RESULT_NOT_READY` → zaten `ready` ise `200 { status:"ready", gameType, content,
  applied:false }` (coin düşmez), `generating` ise `202 { status:"generating", gameType }` → kapasite yoksa `503 AI_UNAVAILABLE` (coin düşmeden, `refunded:false`)
  → yarış-güvenli tek aktif kayıt → coin düş (`reason:"solo_ai"`, 100 coin; `refId = "<sessionId>:<attempt>"`: yeniden denemede `attempt` artar, bedava deneme olmaz;
  yetersizse `402 INSUFFICIENT_COINS`, kayıt silinir) → ana model, olmazsa yedek model → başarı: `200 { status:"ready", gameType, content, balance, applied:true, purchasedByMe:true }`;
  başarısızlık: satır `failed`, coin iadesi (`reason:"solo_ai_refund"`, aynı `refId`; yalnızca düşüm yapıldıysa) ve `503 AI_UNAVAILABLE` + `refunded:true` + `gameType`.
- `GET /api/users/solo-history` (+ detay): her öğede `gameType` ve `aiStatus`. `GET /api/users/ai-reports`: `type:"solo"` satırları (bkz. §10c).

**İçerik zarfı (oyundan bağımsız; `content`):**
```json
{ "gameType": "red_flag", "headline": "…", "summary": "…",
  "sections": [ { "id": "green_zone", "kind": "bullets", "title": "Rahat bölgen", "items": ["…"] },
                { "id": "self_questions", "kind": "questions", "title": "Kendine sor", "items": ["…", "…"] } ] }
```
- `kind`: `text` (`text` alanı), `bullets` (`items[]`), `questions` (`items[]`). **İstemci bilinmeyen `kind`/`id`'yi yok sayar**; sıra sunucudan gelir.
- `title` sunucuda oturum diline göre (tr/en/es) verilir, mobil yazı eklemez. Boş bölümler zarfa girmez (ör. kırmızı kart yoksa `red_lines` gelmez).
- `items` en çok 4 (şemada zorlanır). **AI çıktısında sayı, yüzde, emoji ya da ızgara yoktur**: 3×3 ızgara, bayrak oranları, tolerans çubuğu oyunun kendi sonuç
  verisinden (`complete` / `solo-history`) çizilir.
- Red Flag bölümleri: `green_zone` (bullets), `red_lines` (bullets), `gray_areas` (bullets), `self_questions` (questions, 2-4).

**Modele giden veri (Red Flag):** set kategorisi (arkadaşlık/sevgili), 9 kartın senaryo metni (herkese açık içerik) + tema + seçilen bayrak, kodda hesaplanmış sayılar
(Green/Yellow/Red adedi, tolerans, profil türü). Ad, cinsiyet, doğum tarihi, e-posta, kimlikler GİTMEZ; solo AI'a cinsiyet gitmez (CLAUDE.md §9). Prompt sürümü
`solo-v1.0` (`ai_solo_analyses.prompt_version`).

**Saklama:** analiz oturuma bağlıdır; oturum silinince (90 günlük temizlik, hesap silme) ve satın alan kullanıcı silinince analiz de silinir (cascade).
Migration: `20260617000000_ai_solo_analysis.sql`.

---

## 10. `POST /api/feedback`

Sonuç ekranı mini anketi. Bir katılımcı oda başına tek kayıt tutar (upsert); önce puan, sonra AI ilgisi/yorum
aynı satıra eklenir. Yalnızca sonuçlar hazır olduktan sonra kabul edilir. Cevap/tahmin içeriği saklanmaz.

```json
{ "roomCode": "X7K2P9QM", "rating": 5, "wantsAi": "yes", "comment": "Çok eğlenceliydi", "platform": "web" }
```

- **Solo oyun anketi:** `roomCode` yerine `soloSessionId` gönderilir; token oturumun `token_hash`'ine karşı doğrulanır
  (`INVALID_TOKEN`), bilinmeyen oturum `SESSION_NOT_FOUND`, tamamlanmamış oturum `RESULT_NOT_READY`. Oturum başına tek
  kayıt (`solo_session_id` unique, upsert).
- Token zorunlu (`INVALID_TOKEN`). `rating`: 1–5 tamsayı. `wantsAi`: `yes|maybe|no` (opsiyonel).
  `comment` ≤ 500 karakter (kırpılır). `platform`: `mobile` ise `mobile`, aksi halde `web`.
- Oda `result_ready`/`completed` değilse `RESULT_NOT_READY`.
- Yalnızca gönderilen alanlar yazılır; önceki değerler (ör. yorum) korunur.

Yanıt `201`: `{ "saved": true }`.
