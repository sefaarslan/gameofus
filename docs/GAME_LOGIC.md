# GAME_LOGIC.md — Game of Us

Bu doküman oyun kurallarını, skor hesaplamasını ve mikro-reveal mantığını tanımlar.

---

## 1. Faz 1 Oyun Modları

Faz 1'de aktif oyun modları:

```txt
Secret Choice  (MVP'de öncelikli)
Prediction
Orderline
Karma          (Secret Choice + Prediction + Orderline karışımı)
```

Tüm modlar aynı birleştirilmiş tur mekaniğini kullanır (bkz. Bölüm 3).

---

## 2. Oyun Modları — Mekanik Detaylar

### Secret Choice

Her soruda kullanıcı kendi cevabını verir ve partnerinin cevabını tahmin eder.

Cevap değerleri (sabit, `question_options` kullanılmaz):

```txt
yes    → Evet
unsure → Kararsız
no     → Hayır
```

Veri formatı:
```json
{ "value": "yes" }
```

---

### Prediction

Her soruda senaryo bazlı 3–5 seçenek sunulur (`question_options` tablosundan).

- Oyuncu kendi seçeneğini işaretler.
- Partner için "o hangisini seçer?" tahminini aynı seçenekler arasından yapar.
- Doğru/yanlış binary'dir; yakın tahmin **yoktur**.

Veri formatı:
```json
{ "option_id": "<question_options.id>" }
```

---

### Orderline

Her soruda 4–5 kart önem veya tercih sırasına dizilir (`question_options` tablosundan).

- Oyuncu kartları kendi sıralamasına göre dizer (drag-and-drop veya sıra numarası).
- Partner için "o nasıl sıralar?" tahminini aynı kartlarla yapar.
- Dizideki 1. eleman en önemli / en tercihli karttır.
- `question_options.sort_order` yalnızca başlangıç görüntüleme sırasıdır; "doğru cevap" değildir.

Veri formatı:
```json
{ "order": ["<option_id_1>", "<option_id_2>", "<option_id_3>", "<option_id_4>"] }
```

---

### Karma

`room_questions` tablosunda Secret Choice, Prediction ve Orderline sorular karışık sıralanır.
Oyun ekranı her sorunun `questions.mode` değerine göre doğru bileşeni render eder.
Skor hesaplama her soru için kendi modunun kuralını uygular.

---

## 3. Birleştirilmiş Tur

Her oyuncu tek ekranda:

```txt
kendi cevabını verir      (moda göre: seçenek / kart sırası)
partner cevabını tahmin eder (aynı format)
güven seviyesi seçer
kilitler
```

Eski 4 adımlı yapı kullanılmaz:

```txt
A cevaplar → B tahmin → B cevaplar → A tahmin   ← KULLANILMAZ
```

Kullanılan yapı:

```txt
A: cevap + tahmin
B: cevap + tahmin
→ sonuç
```

---

## 4. Güven Seviyesi

| UI | Değer | Çarpan |
|---|---|---|
| Tahmin | guess | 1 |
| Sanırım | think | 2 |
| Eminim | sure | 3 |

Güven çarpanı okuma skoruna **dahil değildir**. Mikro-reveal mesajı ve oyun hissi için kullanılır.

---

## 5. Tahmin Sonucu — Mod Başına Kural

| Mod | Doğru | Yakın (okuma skorunda doğru sayılır) | Yanlış |
|---|---|---|---|
| Secret Choice | exact match | `yes↔unsure` veya `no↔unsure` | `yes↔no` |
| Prediction | exact option_id | — | farklı option_id |
| Orderline | tüm pozisyonlar eşleşiyor | ≤ 1 komşu takas farkı¹ | ≥ 2 pozisyon farklı |

¹ **Komşu takas (adjacent swap):** tam sıradan yalnızca yan yana iki öğenin yeri değiştirilmesiyle
elde edilebilecek sıra (Kendall tau mesafesi = 1).
Örnek: `[A,B,C,D]` tahmininde `[B,A,C,D]` → yakın; `[C,A,B,D]` → yanlış.

---

## 6. Okuma Skoru

Ana metrik:

```txt
okuma_skoru = doğru_tahmin_sayısı / toplam_tahmin_sayısı * 100
```

Yakın tahminler doğru tahmin sayılır.

Örnek:

```txt
Toplam tahmin: 10
Doğru + yakın: 8
Okuma skoru: 80
```

---

## 7. Mikro-reveal Mantığı

Mikro-reveal yalnızca şu koşullarda çalışır:

```txt
Kullanıcı kendi cevabını ve tahminini kilitledi
Partner aynı soruya daha önce cevap verdi
```

Partner cevabı yoksa:

```txt
Tahminin kaydedildi. Partner oynayınca birlikte göreceksiniz.
```

Partner cevabı varsa (tüm modlar için aynı gösterim):

```txt
Doğru bildin   ← correct
Yakındın       ← near (yalnızca Secret Choice ve Orderline)
Iskaladın      ← miss
```

### Mikro-reveal points

Puan UI hissi için kullanılabilir, ana skora dahil değildir.

```txt
correct: confidence_multiplier * 2
near:    confidence_multiplier * 1
miss:    0
```

---

## 8. Result Details JSON

Sonuç detayları `results.details_json` alanında saklanır. Tüm modlar aynı yapıyı kullanır;
`answer` ve `prediction` alanlarındaki değer formatı moda göre değişir.

```json
[
  {
    "questionId": "uuid",
    "mode": "secret_choice",
    "roundOrder": 1,
    "questionText": "Her gün mesajlaşmak senin için önemli mi?",
    "owner": {
      "answer": { "value": "yes" },
      "prediction": { "value": "unsure" },
      "predictionResult": "near"
    },
    "guest": {
      "answer": { "value": "unsure" },
      "prediction": { "value": "yes" },
      "predictionResult": "near"
    },
    "conversationPrompt": "Günlük iletişimin sizin için ne ifade ettiğini konuşabilirsiniz."
  },
  {
    "questionId": "uuid",
    "mode": "prediction",
    "roundOrder": 2,
    "questionText": "Bu hafta sonu boş vaktinde ne yaparsın?",
    "owner": {
      "answer": { "option_id": "uuid-a" },
      "prediction": { "option_id": "uuid-b" },
      "predictionResult": "miss"
    },
    "guest": {
      "answer": { "option_id": "uuid-b" },
      "prediction": { "option_id": "uuid-b" },
      "predictionResult": "correct"
    },
    "conversationPrompt": "Haftasonunu nasıl geçirdiğinizi konuşabilirsiniz."
  },
  {
    "questionId": "uuid",
    "mode": "orderline",
    "roundOrder": 3,
    "questionText": "Bir ilişkide en önemli özellikleri sırala:",
    "owner": {
      "answer": { "order": ["uuid-sadakat", "uuid-empati", "uuid-mizah", "uuid-zeka"] },
      "prediction": { "order": ["uuid-sadakat", "uuid-mizah", "uuid-empati", "uuid-zeka"] },
      "predictionResult": "near"
    },
    "guest": {
      "answer": { "order": ["uuid-empati", "uuid-sadakat", "uuid-zeka", "uuid-mizah"] },
      "prediction": { "order": ["uuid-sadakat", "uuid-empati", "uuid-zeka", "uuid-mizah"] },
      "predictionResult": "near"
    },
    "conversationPrompt": "İlişkide neye değer verdiğinizi karşılaştırabilirsiniz."
  }
]
```

---

## 9. Konuşma Önerisi

Her sonuç kartında yumuşak bir konuşma önerisi gösterilir.

Örnek:

```txt
Bu konuda beklentilerinizin nerede benzeştiğini konuşabilirsiniz.
```

Yasak ton:

```txt
Bu cevap ilişkinizde problem olduğunu gösteriyor.
```

---

## 10. Sonuç Ekranı Mesaj Tonu

Okuma skoruna göre örnek metinler:

### 80-100

```txt
Birbirinizi oldukça iyi okumuşsunuz!
```

### 50-79

```txt
Bazı yerlerde iyi yakalamışsınız, bazı cevaplar ise güzel sohbet konusu olabilir.
```

### 0-49

```txt
Birbirinizi şaşırtan cevaplar var. Bu oyunun en eğlenceli kısmı da burada başlıyor.
```

Asla ilişki teşhisi yapılmaz.
