# UX_FLOW.md — Game of Us

Bu doküman MVP ekran akışlarını ve kullanıcı deneyimi kurallarını tanımlar.

---

## 1. UX İlkeleri

- Mobil öncelikli tasarım.
- İlk kullanıcı 10 saniyede oyunu anlamalı.
- Login zorunlu olmamalı.
- Oyun linkle hızlı paylaşılmalı.
- Seçenekler büyük ve dokunulabilir olmalı.
- Akış kısa hissettirmeli.
- Cevap ve tahmin tek ekranda tamamlanmalı.
- Sonuç dili yargılayıcı değil, sıcak ve konuşma başlatıcı olmalı.
- Masaüstünde ekran boş kalmamalı; 2/3 kolon düzen kullanılabilir.

---

## 2. Ekranlar

```txt
Landing
Create Game
Share Link
Join Room
Game Screen
Micro Reveal
Waiting
Results Overview
Detailed Results
Premium Mock
Error States
```

---

## 3. Landing Page

### Amaç

Kullanıcıya oyunu hızlı anlatmak ve oyun başlatmaya yönlendirmek.

### İçerik

- Hero başlık
- Alt açıklama
- Oyun Başlat CTA
- Nasıl Çalışır
- Oyun modları kısa açıklama
- Sonuç önizlemesi
- Premium mock teaser

### CTA

```txt
Oyun Başlat
Start Game
```

---

## 4. Create Game Screen

### Alanlar

```txt
İsmin
Partner adı opsiyonel
Oyun modu
Soru sayısı
```

MVP'de oyun modu default:

```txt
Secret Choice
```

Soru sayısı:

```txt
Hızlı Oyun: 5 soru
Klasik Oyun: 10 soru
```

### CTA

```txt
Oyun linki oluştur
Create game link
```

### Hata durumları

- İsim boş
- Soru sayısı geçersiz
- Rate limit
- Bağlantı hatası

---

## 5. Share Link Screen

### İçerik

- Davet linki
- Linki kopyala
- WhatsApp ile paylaş
- Oda durumu
- Cevaplamaya başla butonu

### Status mesajları

```txt
Partner henüz katılmadı.
Partner katıldı.
Sen oyuna başlayabilirsin.
```

---

## 6. Join Room Screen

### Amaç

Linki açan guest'in odaya katılması.

### Alanlar

```txt
İsmin
Katıl butonu
```

### Kurallar

- İsim yalnızca display içindir.
- Owner ismini yazmak owner yapmaz.
- Oda doluysa hata ekranı gösterilir.
- Aynı cihazdan dönen kullanıcı token ile otomatik devam eder.

---

## 7. Game Screen

### Yapı

Her soru tek ekranda iki bölümden oluşur:

```txt
Progress
Soru kartı
Bölüm 1: Kendi cevabın
Bölüm 2: Partner tahminin
Güven seviyesi
Tahmini kilitle CTA
```

### Secret Choice seçenekleri

```txt
Evet
Kararsız
Hayır
```

### Güven seviyesi

```txt
Tahmin
Sanırım
Eminim
```

### CTA

```txt
Tahmini kilitle
Lock guess
```

### Loading

```txt
Tahminin kaydediliyor...
Partnerin cevabı kontrol ediliyor...
```

---

## 8. Micro Reveal Screen

### Partner cevabı varsa

Gösterilecekler:

```txt
Doğru bildin / Yakın tahmin / Iskaladın
Kazanılan puan
Kısa sıcak mesaj
Sonraki soru CTA
```

Partner cevabı ham olarak gösterilmek zorunda değildir. Gösterilecekse yalnızca kullanıcının kilitlediği ilgili soru için gösterilir.

### Partner cevabı yoksa

```txt
Tahminin kaydedildi.
Partner oynayınca birlikte göreceksiniz.
```

CTA:

```txt
Sonraki soru
```

---

## 9. Waiting Screen

### Amaç

Turunu bitiren kullanıcının partneri beklediğini anlaması.

### İçerik

```txt
Sen tamamladın
Partner oynuyor / bekleniyor
Linki tekrar gönder
Sonuçlar iki taraf da tamamlayınca açılacak
```

---

## 10. Results Overview

### İçerik

```txt
Okuma Skoru
Sıcak özet metni
Detayları Gör
Tekrar Oyna
Premium mock teaser
```

### Ton

Kullanıcıyı yargılamaz.

Kötü örnek:

```txt
İlişkiniz zayıf görünüyor.
```

İyi örnek:

```txt
Bazı cevaplarda birbirinizi şaşırtmışsınız. Bu güzel bir konuşma başlangıcı olabilir.
```

---

## 11. Detailed Results

Her soru için kart:

```txt
Soru
Senin cevabın
Partnerin tahmini
Sonuç etiketi
Konuşma önerisi
```

Etiketler:

```txt
Doğru bildi
Yakın tahmin
Iskaladı
```

---

## 12. Premium Mock

Faz 1'de ödeme aktif değildir. Sadece kullanıcı niyeti ölçülür.

### İçerik

```txt
Daha uzun oyunlar
3 günlük oyun gecesi
Daha fazla soru
Premium yakında
```

CTA:

```txt
İlgileniyorum
Notify me / Coming soon
```

---

## 13. Error States

Gerekli ekranlar:

```txt
Geçersiz link
Oda süresi doldu
Oda dolu
Partner henüz katılmadı
Bağlantı koptu
Sonuçlar henüz hazır değil
Oyun zaten tamamlandı
Rate limit
```

Her hata ekranında kullanıcıya net ve kısa açıklama verilir.
