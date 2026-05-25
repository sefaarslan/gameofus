# MVP_SCOPE.md — Game of Us

Bu doküman MVP kapsamını net tutmak için hazırlanmıştır. Amaç, Claude Code'un gereksiz özellik eklemesini engellemektir.

---

## 1. MVP'nin Amacı

MVP'nin temel amacı şu varsayımı test etmektir:

```txt
İnsanlar partnerine veya yakın olduğu bir kişiye bu oyun linkini göndermek isteyecek mi?
```

Teknik mükemmellikten önce test edilmesi gereken davranış:

```txt
Oda oluşturma → link paylaşma → partner katılımı → oyun tamamlama → sonuç görme
```

---

## 2. Faz 1'de Olacaklar

- Landing page
- Mobil öncelikli responsive UI
- Türkçe ve İngilizce arayüz
- Anonim oda oluşturma
- Link paylaşımı
- WhatsApp paylaşımı
- Guest join
- Token + hash anonim kimlik modeli
- Secret Choice oyun modu
- 5 ve 10 soruluk oyun seçeneği
- Birleştirilmiş tur
- Güven seviyesi
- Mikro-reveal
- Waiting screen
- Server-side sonuç hesaplama
- Results overview
- Detailed results
- Premium mock ekran
- 50 soruluk soru bankası
- Soft realtime status
- Temel rate limit
- Temel error states

---

## 3. Faz 1'de Olmayacaklar

- Zorunlu login
- Gerçek ödeme entegrasyonu
- Supabase Auth zorunlu akış
- Lemon Squeezy gerçek ödeme
- Prediction modu
- Orderline modu
- Karma oyun
- Chat
- Dating profili
- Swipe
- Public profil
- Sosyal feed
- Arkadaş listesi
- AI soru üretimi
- Admin panel
- Push notification
- Native mobil app
- Full realtime canlı oyun
- Timer'lı oyun
- Abonelik sistemi
- Geçmiş oyunlar
- PWA install prompt

---

## 4. Faz 2'ye Bırakılanlar

- Supabase Auth
- Lemon Squeezy ödeme
- Premium hak yönetimi
- 3 günlük premium
- Sınırsız oda
- Prediction modu
- Orderline modu
- Karma oyun
- Sonuç paylaşım kartları
- Referral / davet akışı

---

## 5. Faz 3'e Bırakılanlar

- AI destekli soru önerileri
- Admin panel
- PWA install prompt
- Geçmiş oyunlar
- Eski anonim oda temizleme job'u
- HttpOnly cookie hardening
- Gelişmiş analytics
- A/B test sistemi

---

## 6. MVP Başarı Kriterleri

İlk 100 oda için hedefler:

```txt
Partner katılım oranı: en az %50
Tamamlanan oyun oranı: en az %35
Premium mock CTA tıklama/niyet: en az %5
```

---

## 7. Ürün Tonu

Game of Us:

```txt
sıcak
oyuncu
yargılayıcı olmayan
konuşma başlatıcı
hafif ve hızlı
```

Game of Us değildir:

```txt
ilişki testi
terapi aracı
dating app
chat app
psikolojik analiz ürünü
```
