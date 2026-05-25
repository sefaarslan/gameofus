# API_SPEC.md — Game of Us

Bu doküman Next.js API route / server action sözleşmelerini tanımlar.

---

## 1. Genel API Kuralları

- Kritik işlemler server-side doğrulanır.
- API requestlerinde `room_code` ve gerekiyorsa `participant_token` kullanılır.
- Raw token DB'ye yazılmaz; token hash ile doğrulanır.
- Expired oda için tüm yazma işlemleri reddedilir.
- Partner cevapları reveal öncesi ham şekilde dönmez.
- Hata cevapları kullanıcı dostu ama veri sızdırmayacak şekilde olmalıdır.

---

## 2. Endpoint Listesi

```txt
POST /api/rooms/create
POST /api/rooms/[roomCode]/join
GET  /api/rooms/[roomCode]/state
POST /api/rooms/[roomCode]/submit-turn
POST /api/rooms/[roomCode]/complete
POST /api/rooms/[roomCode]/calculate-results
GET  /api/rooms/[roomCode]/results
POST /api/webhooks/lemonsqueezy   // Faz 2
```

---

## 3. `POST /api/rooms/create`

Yeni oda oluşturur ve owner participant oluşturur.

### Request

```json
{
  "displayName": "Sefa",
  "partnerName": "Esra",
  "gameMode": "secret_choice",
  "questionCount": 5,
  "locale": "tr"
}
```

### Validation

- `displayName` zorunlu.
- `gameMode` MVP'de yalnızca `secret_choice`.
- `questionCount` MVP için 5 veya 10 olabilir.
- IP rate limit kontrolü yapılır.

### Response

```json
{
  "roomCode": "x7k2p9qm4r",
  "roomUrl": "/game/room/x7k2p9qm4r",
  "participant": {
    "id": "uuid",
    "role": "owner",
    "displayName": "Sefa",
    "token": "raw-participant-token"
  }
}
```

### DB İşlemleri

- `rooms` insert
- `participants` owner insert
- `room_questions` insert
- token hash kaydı
- `expires_at = now() + 24 hours`

---

## 4. `POST /api/rooms/[roomCode]/join`

Odaya guest olarak katılır veya mevcut token ile devam eder.

### Request

```json
{
  "displayName": "Esra",
  "participantToken": "optional-existing-token"
}
```

### Kurallar

- Token geçerliyse mevcut participant döner.
- Token yoksa oda dolu mu kontrol edilir.
- Owner ismini yazarak owner olunamaz.
- Oda doluysa yeni participant oluşturulmaz.
- Guest oluşturulduktan sonra oda `guest_joined` olabilir.
- `join_locked = true` yapılabilir.

### Response

```json
{
  "roomCode": "x7k2p9qm4r",
  "participant": {
    "id": "uuid",
    "role": "guest",
    "displayName": "Esra",
    "token": "raw-participant-token"
  },
  "roomStatus": "guest_joined"
}
```

---

## 5. `GET /api/rooms/[roomCode]/state`

Oda ve oyuncu durumunu döner. Reveal öncesi cevap/tahmin içermez.

### Query / Header

```txt
participantToken required if player-specific state is needed
```

### Response

```json
{
  "room": {
    "roomCode": "x7k2p9qm4r",
    "status": "guest_joined",
    "gameMode": "secret_choice",
    "questionCount": 5,
    "expiresAt": "2026-05-26T10:00:00Z"
  },
  "participant": {
    "id": "uuid",
    "role": "owner",
    "displayName": "Sefa",
    "status": "playing"
  },
  "participants": [
    {
      "role": "owner",
      "displayName": "Sefa",
      "status": "playing"
    },
    {
      "role": "guest",
      "displayName": "Esra",
      "status": "joined"
    }
  ],
  "questions": [
    {
      "roundOrder": 1,
      "questionId": "uuid",
      "questionText": "Her gün mesajlaşmak senin için önemli mi?"
    }
  ],
  "progress": {
    "answeredCount": 2,
    "totalCount": 5
  }
}
```

### Güvenlik

- Partnerin `answers` / `predictions` ham verisi dönmez.
- Sadece gerekli status ve question bilgileri döner.

---

## 6. `POST /api/rooms/[roomCode]/submit-turn`

Tek soruda cevap + tahmin kaydeder.

### Request

```json
{
  "participantToken": "raw-token",
  "questionId": "uuid",
  "answerValue": "yes",
  "predictedValue": "unsure",
  "confidenceLevel": "think"
}
```

### Kurallar

- Participant token doğrulanır.
- Oda expire olmamış olmalı.
- Participant bu soruya daha önce cevap vermemiş olmalı.
- Cevap ve tahmin aynı transaction içinde yazılır.
- Tahminin hedefi otomatik olarak diğer participant olur.
- Partner cevabı varsa mikro-reveal sonucu döner.
- Partner cevabı yoksa fallback döner.

### Response — Partner cevabı varsa

```json
{
  "saved": true,
  "microReveal": {
    "available": true,
    "result": "near",
    "label": "Yakın tahmin",
    "points": 2,
    "message": "Yakındın! Partnerinin cevabına oldukça yaklaştın."
  }
}
```

### Response — Partner cevabı yoksa

```json
{
  "saved": true,
  "microReveal": {
    "available": false,
    "message": "Tahminin kaydedildi. Partner oynayınca birlikte göreceksiniz."
  }
}
```

### Not

Micro-reveal response içinde partnerin ham cevabı dönmemelidir. Gerekirse sadece kullanıcının zaten oynadığı ilgili sorunun türetilmiş sonucu döner.

---

## 7. `POST /api/rooms/[roomCode]/complete`

Participant status değerini completed yapar. Gerekirse sonuç hesaplamayı tetikler.

### Request

```json
{
  "participantToken": "raw-token"
}
```

### Response

```json
{
  "completed": true,
  "roomStatus": "owner_completed",
  "resultReady": false
}
```

İki participant da completed ise:

```json
{
  "completed": true,
  "roomStatus": "result_ready",
  "resultReady": true
}
```

---

## 8. `POST /api/rooms/[roomCode]/calculate-results`

Server-side internal endpoint olarak düşünülebilir. Client'ın doğrudan kullanması şart değildir.

### Kurallar

- İki participant completed değilse çalışmaz.
- Aynı oda için duplicate result oluşturmaz.
- `results.unique(room_id)` ile korunur.
- `rooms.status = result_ready` yapar.

### Response

```json
{
  "resultReady": true,
  "readingScore": 80
}
```

---

## 9. `GET /api/rooms/[roomCode]/results`

Sonuç ekranı için verileri döner.

### Request

```txt
participantToken required
```

### Kurallar

- Token doğrulanır.
- Oda `result_ready` veya `completed` değilse sonuç dönmez.
- Sadece ilgili oda participantları sonucu görebilir.

### Response

```json
{
  "readingScore": 80,
  "summaryText": "Birbirinizi oldukça iyi okudunuz!",
  "details": [
    {
      "roundOrder": 1,
      "questionText": "Her gün mesajlaşmak senin için önemli mi?",
      "yourAnswer": "yes",
      "partnerPrediction": "unsure",
      "result": "near",
      "label": "Yakın tahmin",
      "conversationPrompt": "Günlük iletişimin sizin için ne ifade ettiğini konuşabilirsiniz."
    }
  ]
}
```

---

## 10. Faz 2 — `POST /api/webhooks/lemonsqueezy`

Lemon Squeezy ödeme eventlerini işler.

### Kurallar

- Webhook signature doğrulanır.
- Duplicate event işlenmez.
- Ödeme başarılıysa `users.premium_until = now() + 3 days`.
- Payment kaydı oluşturulur.

### Response

```json
{
  "received": true
}
```

---

## 11. Standart Hata Cevapları

```json
{
  "error": {
    "code": "ROOM_EXPIRED",
    "message": "Bu odanın süresi dolmuş."
  }
}
```

Önerilen hata kodları:

```txt
ROOM_NOT_FOUND
ROOM_EXPIRED
ROOM_FULL
INVALID_TOKEN
ALREADY_SUBMITTED
QUESTION_NOT_FOUND
RESULT_NOT_READY
RATE_LIMITED
INVALID_PAYLOAD
INTERNAL_ERROR
```
