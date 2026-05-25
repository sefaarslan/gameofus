# CLAUDE.md — Game of Us

Bu dosya, Claude Code'un (ve diğer AI ajanlarının) bu projede çalışırken uyması gereken
kuralları, mimari kararları ve konvansiyonları tanımlar. Kod yazmadan önce bu dosyadaki
kuralların tamamı geçerli kabul edilir. Çelişki olduğunda PRD esas alınır; PRD'de net olmayan
bir teknik karar varsa buradaki yaklaşım uygulanır.

---

## 1. Ürün Özeti

**Game of Us**, iki kişinin birbirini daha iyi tanıması için tasarlanmış link bazlı bir web
oyunudur. Oyuncular bir oda oluşturur, linki partnerine gönderir; her iki taraf da tek bir turda
hem kendi cevabını verir hem partnerinin cevabını tahmin eder. İki taraf da turunu tamamlayınca
sonuçlar açılır.

Temel oyun döngüsü: **cevapla → tahmin et → sonucu birlikte gör**.

Bu ürün bir dating app, chat app veya eşleşme uygulaması **değildir**. Amaç iki kişi arasında
daha iyi konuşmalar başlatmak ve birbirini tahmin etme deneyimini oyunlaştırmaktır.

### Önemli ürün ilkeleri (koda yansıması gerekenler)
- Ücretsiz oyun **tamamen anonimdir**, login gerektirmez.
- Login yalnızca ödeme/premium akışında zorunludur; Supabase Auth Faz 1'de kurulur, aktif ödeme Faz 2'dedir.
- Link paylaşımı ana büyüme döngüsüdür; akış mümkün olduğunca kısa ve az tıklamalı olmalı.
- Sonuç ekranı yargılayıcı olmamalı; "mükemmel eşleşme" değil "birbirinizi ne kadar iyi
  okudunuz?" mesajı verir.
- Mobil öncelikli, masaüstü destekli responsive tasarım.
- Türkçe ve İngilizce MVP'den itibaren desteklenir.
- **Dil kilitleme (oyun akışında):** Kullanıcı bir oda oluşturduktan sonra dil değiştiricisi
  (`AppHeader`) game sayfalarında (`/game/`) gizlenir. Bu sayede oyun süresince locale sabit kalır.
- **Oda locale'i:** Oda hangi dilde oluşturulduysa (`rooms.locale`) paylaşım linki o locale'i
  içerir (`/${roomLocale}/game/room/${roomCode}`). Konuk farklı bir locale URL'siyle girerse
  oda sayfası otomatik olarak doğru locale'e yönlendirir (`window.location.replace`).
- **Ücretsiz oda limiti:** Ücretsiz kullanıcılar tarayıcı başına yalnızca bir oda
  oluşturabilir. `localStorage.setItem("gou_my_room", roomCode)` ile kaydedilir; `/create`
  sayfası açılışta bu key'i kontrol eder ve varsa kullanıcıyı premium uyarı ekranına
  yönlendirir. Bu client-side bir UX katmanıdır; server-side rate limit kuralları ayrıca geçerlidir.

---

## 2. Teknoloji Stack

### Frontend
- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Stitch** ile tasarlanan ekranlardan üretilen arayüz. Hazır component kütüphanesi
  (shadcn/ui vb.) **kullanılmaz**; arayüz bileşenleri Stitch tasarımlarından gelir.
- **next-intl** ile çoklu dil. Dil `Accept-Language` header'ından otomatik algılanır; URL
  prefix (`/tr`, `/en`) ile manuel override desteklenir.

### Backend
- **Supabase**: Postgres, Realtime, Auth (Faz 1 — premium akış için), Edge Functions (opsiyonel).
- **Next.js server-side API route / server action**: oda oluşturma, cevap/tahmin kaydetme,
  sonuç hesaplama, token doğrulama.

### Deploy
- **Vercel**

### Ödeme (Faz 2)
- **Lemon Squeezy** — tek seferlik **$2.99**, 3 günlük premium hak.
- Faz 1'de ödeme entegrasyonu **aktif değildir**; premium ekran yalnızca mock olarak gösterilir.

---

## 3. Mimari Kuralları

### Kritik işlemler server-side yapılır
Aşağıdaki işlemler **client-only hesaplamaya asla bırakılmaz**, server-side doğrulanır:
- Cevap yazma
- Tahmin yazma
- Sonuç hesaplama
- Premium hak kontrolü ve güncelleme
- Token doğrulama

> Kural: Cevap, tahmin, sonuç ve premium hak gibi kritik işlemler server-side doğrulanmalıdır.

### Edge Function opsiyoneldir
Faz 1 için Edge Function zorunlu değildir. Sonuç hesaplama ve token doğrulama Next.js API route /
server action ile yapılabilir. Edge Function Faz 2'de Lemon Squeezy webhook ve premium hak
güncellemesi için kullanılabilir.

### Realtime kapsamı sınırlıdır
Supabase Realtime **yalnızca soft realtime durum güncellemeleri** için kullanılır. (Detay için
bkz. Bölüm 7 — Performans & Veri Akışı Kuralları.)

---

## 4. Kimlik Doğrulama Modeli

### Anonim model (ücretsiz oyun)
- Login gerekmez; roller **`participant_token`** ile doğrulanır.
- Token'ın **ham değeri yalnızca client'ta** saklanır; DB'de yalnızca **`token_hash`** tutulur.
- Token **URL query parametresi olarak taşınmamalıdır**.
- Token DB'de **plaintext tutulmamalıdır**.
- Kimlik doğrulama **isim eşleştirmesine bırakılmaz**. `display_name` yalnızca ekranda gösterim
  içindir; farklı cihazdan aynı ismi giren kişi otomatik owner olamaz.
- Aynı cihazdan dönen oyuncu local token ile kaldığı yerden devam eder.
- MVP'de ve production hardening'de HttpOnly cookie tercih
  edilebilir.

### Kayıtlı kullanıcı modeli (premium, Faz 1)
- Supabase Auth (e-posta/şifre, Google OAuth, Apple OAuth) ile yönetilir; oturum Supabase JWT
  ile korunur.
- Premium odalar `user_id` ile ilişkilendirilir; premium hak `users.premium_until` ile
  kontrol edilir.

### Public link yapısı
- Public link yalnızca `room_code` içerir: `/game/room/{room_code}`
- Owner/guest kimliği URL üzerinden açıkça taşınmaz.
- `room_code` kısa olabilir ama brute force'a açık olmamalı (tahmin edilemez olmalı).

---

## 5. Oyun Akışı & Durumlar

### Birleştirilmiş tur (kritik — tüm modlarda geçerli)
Her oyuncu **tek turda** hem kendi cevabını verir hem partnerini tahmin eder. Eski 4 turlu yapı
(A cevaplar → B tahmin → B cevaplar → A tahmin) **kullanılmaz**; akış 2 tura iner.
Bu kural Secret Choice, Prediction ve Orderline için aynıdır.

Tek soru ekranında sıra:
1. Oyuncu kendi cevabını verir (gizli tutulur). Moda göre format:
   - Secret Choice: Evet / Kararsız / Hayır
   - Prediction: çoktan seçmeli seçenek (`question_options`'dan)
   - Orderline: kartları sürükle-bırak veya sıra numarası ile diz
2. Aynı ekranda partnerinin cevabını **aynı format** ile tahmin eder.
3. Tahmine güven seviyesi ekler.
4. Tahmini kilitler.
5. Partner zaten cevapladıysa **anlık mikro-reveal**; aksi halde "tahminin kaydedildi" bilgisi.

### Güven seviyesi
- `guess` (tahmin) — çarpan ×1
- `think` (sanırım) — çarpan ×2
- `sure` (eminim) — çarpan ×3

**Önemli:** Güven çarpanı yalnızca mikro-reveal/anlatım içindir; **okuma skoruna yansımaz**
(bkz. Bölüm 6).

### Mikro-reveal kuralları
- Yalnızca oyuncu kendi cevabını ve tahminini **kilitledikten sonra** hesaplanır.
- Yalnızca partner o soruyu **zaten cevaplamışsa** gösterilir.
- Sadece ilgili sorunun türetilmiş sonucunu gösterir (doğru / yakın / ıskaladı + puan).
- Partnerin tüm cevaplarını veya oynanmamış sorulara ait bilgiyi **açığa çıkarmaz**.
- Partner verisi yoksa akışı **bloke etmez** (fallback: "tahminin kaydedildi").

### Room status değerleri
`created`, `owner_playing`, `owner_completed`, `waiting_guest`, `guest_joined`,
`guest_playing`, `guest_completed`, `result_ready`, `completed`, `expired`

### Participant status değerleri
`invited`, `joined`, `playing`, `completed`

> Not: Birleştirilmiş tur nedeniyle ayrı `answering` / `predicting` durumları **yoktur**;
> tek `playing` durumunda hem cevaplanır hem tahmin edilir.

---

## 6. Sonuç Mantığı

### Ana metrik: Okuma Skoru
```
okuma_skoru = doğru_tahmin_sayısı / toplam_tahmin_sayısı * 100
```

Yakın tahminler okuma skorunda **doğru** sayılır. Tüm paketlerde sonuç hesaplama aynıdır;
detaylı analiz, kategori kırılımı veya istatistik yoktur.

### Mod başına doğru / yakın / yanlış

| Mod | Doğru | Yakın (okuma skorunda doğru sayılır) | Yanlış |
|---|---|---|---|
| Secret Choice | exact match | `yes↔unsure` veya `no↔unsure` | `yes↔no` |
| Prediction | exact option_id eşleşmesi | — (yakın yok; binary) | farklı option_id |
| Orderline | tüm pozisyonlar eşleşiyor | ≤ 1 komşu takas farkı¹ | ≥ 2 pozisyon farklı |

¹ **Komşu takas (adjacent swap):** tam sıradan yalnızca yan yana iki öğenin yeri değiştirilmesiyle
elde edilebilecek sıra (Kendall tau mesafesi = 1).
Örnek: `[A,B,C,D]` tahmininde `[B,A,C,D]` → yakın; `[C,A,B,D]` → yanlış.

### Sonuç kuralları
- Sonuç yalnızca **iki participant da oyunu tamamladıktan sonra** hesaplanır.
- Hesaplama **server-side** yapılır.
- Aynı oda için **duplicate result oluşturulmaz** (`unique(room_id)`).
- Sonuç ekranı yalnızca oda `result_ready` durumuna geçtiğinde açılır.

---

## 7. Performans & Veri Akışı Kuralları

Bu kurallar uygulama hızını ve gereksiz ağ/DB yükünü azaltmayı hedefler. Kod yazarken bunlara
özellikle dikkat edilmelidir:

1. **Sorular tek seferde yüklenir.** Oyundaki tüm `room_questions` ilk oyun başlangıcında **tek
   seferde** yüklenir. Oyun boyunca sorular client tarafında bellekte tutulur.

2. **Soru geçişinde DB'ye gidilmez.** Kullanıcı sorular arasında ilerlerken tekrar DB'den soru
   çekilmez; navigasyon yalnızca client state üzerinden yapılır.

3. **Tek request ile kayıt.** Cevap ve tahmin, **her soru sonunda tek bir API request** ile
   kaydedilir. Cevap ve tahmin için ayrı ayrı çağrı yapılmaz; aynı endpoint'e birlikte yazılır.

4. **Realtime sadece durum için.** Realtime yalnızca **participant ve room status
   değişiklikleri** için kullanılır (`rooms.status`, `participants.status`, opsiyonel
   `participants.last_seen_at`). `answers`, `predictions`, partnerin gerçek cevapları/tahminleri
   ve reveal öncesi sonuç detayları **Realtime'a açılmaz**.

5. **Sonuç hesaplama server-side ve tek tetiklemeli.** Sonuç hesaplama, **iki oyuncu da
   `completed`** durumuna geçtiğinde **server-side endpoint** ile yapılır. Hesaplama client'ta
   tekrar edilmez ve aynı oda için yalnızca bir kez çalışır.

---

## 8. Veri Modeli (Özet)

Tam şema için PRD Bölüm 17 esas alınır. Temel tablolar ve kritik constraint'ler:

| Tablo | Amaç | Kritik constraint |
|---|---|---|
| `users` | Yalnızca kayıtlı/premium kullanıcılar (Supabase Auth) | — |
| `rooms` | Oyun odaları | `unique(room_code)` |
| `participants` | Owner/guest kayıtları | `unique(room_id, role)`, `unique(room_id, token_hash)` |
| `questions` | Soru bankası | — |
| `question_options` | Prediction modu seçenekleri | `unique(question_id, sort_order)` |
| `room_questions` | Odaya atanmış sorular ve sıraları | `unique(room_id, round_order)`, `unique(room_id, question_id)` |
| `answers` | Oyuncu cevapları | `unique(room_id, question_id, participant_id)` |
| `predictions` | Tahminler + güven seviyesi | `unique(room_id, question_id, predictor_participant_id, target_participant_id)` |
| `results` | Okuma skoru + detay JSON | `unique(room_id)` |
| `payments` | Lemon Squeezy ödemeleri (Faz 2) | `unique(provider_event_id)` |
| `rate_limits` | Abuse kontrol (opsiyonel) | — |

### answer_value / predicted_value JSONB formatı

`answers.answer_value` ve `predictions.predicted_value` alanları JSONB'dir. Mod başına format:

| Mod | Format |
|---|---|
| secret_choice | `{ "value": "yes" \| "unsure" \| "no" }` |
| prediction | `{ "option_id": "<question_options.id>" }` |
| orderline | `{ "order": ["<option_id1>", "<option_id2>", ...] }` |

Orderline'da `order` dizisi oyuncunun kendi öncelik sıralamasını temsil eder;
1. eleman en önemli/tercihli karttır.

### Veri yazma kuralları
- Bir participant aynı odada aynı soruya **yalnızca bir cevap** verebilir.
- Cevap/tahmin **kilitlendikten sonra değiştirilemez**.
- Partner cevabı, tahmin kilitlenmeden **hiçbir şekilde client'a dönmez**.

---

## 9. Güvenlik & Gizlilik

- Partnerin gerçek cevabı, tahmin kilitlenmeden önce **asla** client'a dönmez.
- `answers` ve `predictions` tabloları client tarafından doğrudan partner verisi okumak için
  kullanılamaz; bu işlemler token/JWT doğrulayan server-side endpoint üzerinden yürütülür.
- Minimum RLS beklentileri:
  - Kullanıcı yalnızca kendi participant kaydını okuyabilir.
  - Kullanıcı yalnızca kendi cevabını/tahminini oluşturabilir.
  - Kullanıcı partnerin cevabını reveal öncesi okuyamaz.
  - Oda doluysa token'ı olmayan üçüncü kişi içeriğe erişemez.
  - Premium kullanıcı yalnızca kendi `user_id`'sine bağlı odaları yönetir.
- Expire kontrolü **okuma anında** `expires_at < now()` ile yapılır; cron job gerekmez.
- Ücretsiz oda **24 saat**, premium oda **72 saat** sonra inaktif sayılır.
- Analytics event'lerinde **bireysel cevap içeriği tutulmaz**, yalnızca davranış metrikleri.

### Abuse / rate limit (başlangıç limitleri)
- Aynı IP/IP-hash için saatte max **10**, günde max **50** oda oluşturma.
- Aynı oda için max **2** participant; oda dolunca `join_locked = true`.

---

## 10. Oyun Modları

### Secret Choice (Faz 1 — MVP önceliği)
- Soru: bir senaryo / davranış sorusu.
- Cevap seçenekleri sabittir: **Evet / Kararsız / Hayır** (`yes / unsure / no`).
- Oyuncu kendi seçeneğini verir, partner için aynı 3'ten birini tahmin eder.
- `question_options` kullanılmaz; seçenekler hardcode'dur.
- Veri formatı: `answer_value: { "value": "yes" }`.

### Prediction (Faz 1)
- Soru: senaryo bazlı, çoktan seçmeli (3–5 seçenek).
- Seçenekler `question_options` tablosundan çekilir.
- Oyuncu "sen ne yaparsın?" sorusuna kendi seçeneğini işaretler.
- Partner için "o hangisini seçer?" tahminini aynı seçenekler arasından yapar.
- Doğru/yanlış binary'dir; yakın tahmin yok.
- Veri formatı: `answer_value: { "option_id": "<question_options.id>" }`.

### Orderline (Faz 1)
- Soru: 4–5 kartı önem/tercih sırasına diz.
- Kartlar `question_options` tablosundan çekilir; `sort_order` yalnızca görüntüleme sırasıdır.
- Oyuncu kartları kendi sıralamasına göre dizer (drag-and-drop veya sıra numarası seçimi).
- Partner için "o nasıl sıralar?" tahminini aynı kartlarla yapar.
- Doğru/yakın/yanlış kuralı Bölüm 6'daki tabloya göre uygulanır.
- Veri formatı: `answer_value: { "order": ["<option_id_1>", "<option_id_2>", ...] }`.
- `order` dizisinin 1. elemanı en tercihli / önemli karttır.

### Karma (Faz 1)
- Oda oluşturulurken "Karma" modu seçilirse, `room_questions`'a Secret Choice +
  Prediction + Orderline soruları karışık olarak atanır.
- Her soru ekranı `questions.mode` değerine göre doğru UI bileşenini render eder.
- Skor hesaplama: her soru kendi modunun doğru/yakın/yanlış kuralına göre değerlenir.

---

## 11. Geliştirme Fazları

### Faz 1 — MVP + Tam Oyun Deneyimi
Landing, oda oluşturma, Secret Choice, link paylaşımı, guest join (anonim token), token üretimi
+ hash saklama, birleştirilmiş tur, soft realtime status, mikro-reveal, server-side sonuç
hesaplama, sonuç ekranı, premium **mock** ekranı, 50 soruluk soru bankası
(`seeds/questions.ts` → Supabase insert), temel RLS/server-side erişim kontrolleri, temel
rate limit, Supabase Auth (e-posta/şifre + Google + Apple), `premium_until` yönetimi,
premium kullanıcı için sınırsız oda, Prediction modu, Orderline modu, Karma oyun,
sonuç paylaşım kartları, referral / davet akışı.

### Faz 2 — Gelir
Lemon Squeezy ödeme entegrasyonu ($2.99, 3 günlük hak), Lemon Squeezy webhook endpoint'i
(Edge Function veya Vercel API route).

### Faz 3 — İleri Özellikler
PWA install prompt, AI soru önerileri, admin panel, hafif kullanıcı hesabı geliştirmeleri,
geçmiş oyunlar, eski anonim oda temizleme job'u, HttpOnly cookie hardening.

---

## 12. Klasör & İçerik Konvansiyonları

### Seed dosyaları
| Dosya | İçerik |
|---|---|
| `seeds/questions.ts` | 50 Secret Choice sorusu (TR, locale='tr') |
| `seeds/prediction-questions.ts` | 15 Prediction sorusu + seçenekler (TR) |
| `seeds/orderline-questions.ts` | 10 Orderline sorusu + kartlar (TR) |

Seed verisi `supabase/migrations/20260525130000_seed_questions.sql` migration'ı ile
DB'ye yazılır. Seed TS dosyaları referans ve tip güvenliği için tutulur.

### `questions` tablosu locale yapısı
- Her soru `question_text` + `locale` ikilisiyle tutulur.
- MVP'de tüm sorular `locale = 'tr'`. İngilizce destek Faz 2'de ayrı satırlar olarak eklenir.
- Oda oluşturulurken `rooms.locale` ile eşleşen sorular seçilir.

### Arayüz metinleri
- next-intl ile TR ve EN yönetilir (`messages/tr.json`, `messages/en.json`).
- Soru içeriği MVP'de yalnızca TR'dir; ileride locale bazlı ayrılabilir.

---

## 13. AI Ajanı İçin Genel Hatırlatmalar

- Yeni kod yazmadan önce ilgili PRD bölümünü ve bu dosyadaki kuralları kontrol et.
- Performans kurallarına (Bölüm 7) aykırı bir veri akışı önerme; özellikle soru geçişinde DB'ye
  gitme ve cevap+tahmini ayrı request'lere bölme.
- Kritik işlemleri (cevap/tahmin/sonuç/premium) client'ta hesaplama; server-side endpoint kullan.
- Partner verisini reveal öncesi expose edecek hiçbir sorgu/Realtime aboneliği ekleme.
- Token'ı URL'de taşıma, DB'de plaintext tutma.
- Agresif satış, geri sayım veya manipülatif metin üretme; ton sıcak ve yargılayıcı olmayan
  olmalı.
