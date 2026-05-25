# PRD — Game of Us

## 1. Ürün Özeti

**Ürün adı:** Game of Us  
**Platform:** Responsive Web App / PWA-ready  
**Dil:** Türkçe ve İngilizce — MVP'den itibaren her ikisi de desteklenir. Dil, kullanıcının tarayıcı diline göre otomatik seçilir; kullanıcı istediği zaman manuel olarak değiştirebilir.  
**Hedef cihaz:** Mobil tarayıcı öncelikli, masaüstü destekli  
**Teknik yaklaşım:** Link bazlı oda oluşturma, asenkron akış, soft realtime durum güncellemeleri

Game of Us, iki kişinin birbirini daha iyi tanıması için tasarlanmış kısa ve eğlenceli mini oyunlar sunan bir web uygulamasıdır. Kullanıcılar bir oyun odası oluşturur, linki partnerine gönderir; her iki taraf da tek bir turda hem kendi cevabını verir hem de partnerinin cevabını tahmin eder. İki taraf da turunu tamamladığında sonuçlar açılır.

Oyun akışı, her soruda "cevapla + tahmin et" adımlarını tek ekranda birleştirir. Bu birleştirilmiş tur yaklaşımı, oda içinde ileri-geri geçişleri ve bekleme sürelerini azaltarak deneyimi belirgin biçimde kısaltır. Tahmin adımına eklenen güven seviyesi (tahmin / sanırım / eminim) ile oyun, basit bir soru-cevaptan küçük bir bahis-ve-keşif oyununa dönüşür.

Game of Us bir dating app, chat app veya eşleşme uygulaması değildir. Ürünün amacı iki kişi arasında daha iyi konuşmalar başlatmak, birbirini tahmin etme ve keşfetme deneyimini oyunlaştırmaktır.

---

## 2. Problem Tanımı

Çiftler, sevgililer, evli partnerler veya yeni tanışan iki kişi çoğu zaman birbirini daha iyi tanımak ister; ancak klasik soru kartları veya uyum testleri genellikle pasif, düz ve tek taraflı kalır.

Mevcut uygulamalarda sık görülen problemler:

- Deneyim genelde sadece soru-cevap formatındadır.
- Kullanıcılar birbirini aktif olarak tahmin etmez.
- Uyum yüzdesi yaklaşımı bazen yargılayıcı veya fazla test hissi verebilir.
- App indirme zorunluluğu kullanım bariyerini artırır.
- Web üzerinden hızlıca link paylaşarak oynama deneyimi zayıftır.

Game of Us bu problemi, “cevapla → tahmin et → sonucu birlikte gör” oyun döngüsüyle çözer.

---

## 3. Ürün Vizyonu

Game of Us, iki kişinin kısa oyunlar oynayarak birbirini daha iyi tanıdığı, konuşma başlatan ve tekrar oynanabilir bir ilişki keşif deneyimi sunar.

Vizyon cümlesi:

> İki kişinin birbirini tahmin ederek, cevapları birlikte açarak ve sonuçlar üzerinden konuşarak daha yakın hissetmesini sağlamak.

---

## 4. Hedef Kitle

### Birincil hedef kitle

- Sevgililer
- Evli çiftler
- Uzun süreli partnerler
- Yeni ilişkide olan çiftler

### İkincil hedef kitle

- Yakın arkadaşlar
- Flört aşamasındaki kişiler
- Birbirini daha iyi tanımak isteyen iki kişi

### Kullanım senaryoları

- Akşam partnerle eğlenceli bir aktivite yapmak
- İlk buluşma sonrası birbirini daha iyi tanımak
- Uzun ilişkide yeni konuşma konuları açmak
- Arkadaşla eğlenceli bir tahmin oyunu oynamak
- Mesajlaşma üzerinden link atarak kısa bir oyun başlatmak

---

## 5. Konumlandırma

Game of Us şu değildir:

- Dating app değildir.
- Chat app değildir.
- Eşleşme uygulaması değildir.
- Psikolojik analiz veya ilişki teşhisi ürünü değildir.
- Sert bir uyum testi değildir.

Game of Us şudur:

- İki kişilik mini oyun deneyimi
- Birbirini tahmin etme oyunu
- Konuşma başlatıcı ilişki oyunu
- Linkle oynanan web app
- Kısa, sıcak ve tekrar oynanabilir bir çift aktivitesi

---

## 6. Temel Değer Önerisi

**Kısa oyunlar oynayın, birbirinizi daha iyi tanıyın.**

Kullanıcıya verilen temel değerler:

- App indirmeden linkle oynama
- Partnerini tahmin etme eğlencesi
- Sonuçlardan konuşma başlatma
- Yargılayıcı olmayan yumuşak sonuçlar
- Ücretsiz hızlı deneme
- Premium paket ile daha uzun oyun gecesi

---

## 7. MVP Kapsamı

### MVP’de olacak özellikler

1. Landing page
2. Oyun odası oluşturma (anonim, login gerekmez)
3. Partner adı opsiyonel girme
4. Oyun modu seçimi
5. Soru sayısı seçimi
6. Link oluşturma
7. Link kopyalama
8. WhatsApp ile paylaşma
9. Partnerin linkten katılması (anonim guest token ile)
10. Secret Choice oyun modu
11. Birleştirilmiş tur: her soruda kendi cevabını verme + partneri tahmin etme (tek ekran)
12. Tahminlerde güven seviyesi seçimi (tahmin / sanırım / eminim)
13. Anlık mikro-reveal (partner zaten cevapladıysa soru sonunda anlık geri bildirim)
14. Soft realtime durum ekranı
15. Sonuç hesaplama ve sonuç ekranı
16. Premium mock ekranı (Faz 1'de ödeme entegrasyonu aktif değildir)
17. Ödeme sonrası akış için kayıt ekranı taslağı (e-posta/şifre veya Google/Apple — Faz 2'de aktif)
18. 3 günlük premium hak yönetimi tasarımı (Faz 2'de aktif)
19. Premium kullanıcı için sınırsız oda oluşturma mantığı (Faz 2'de aktif)
20. Temel hata ve boş durum ekranları

### MVP’de olmayacak özellikler

- Native mobil uygulama
- Ücretsiz kullanıcı için zorunlu login
- Chat
- Swipe / dating profili
- Public profil
- Sosyal feed
- Gelişmiş arkadaş listesi
- AI soru üretimi
- Abonelik sistemi
- Canlı timer’lı realtime oyun
- Push notification
- Gelişmiş admin panel

---

## 8. Oyun Modları

### 8.1 Secret Choice

Kullanıcı bir soruya üç seçenekten biriyle cevap verir:

- Evet
- Kararsız
- Hayır

Aynı ekranda, kullanıcı partnerinin aynı soruya ne cevap verdiğini de tahmin eder ve bu tahmine bir güven seviyesi ekler.

Örnek soru:

> Her gün mesajlaşmak senin için önemli mi?

#### Birleştirilmiş tur

Eski versiyonda her soru dört ayrı turda dolaşıyordu (A cevaplar → B tahmin eder → B cevaplar → A tahmin eder). Bu, oda içinde ileri-geri geçişleri ve bekleme süresini artırıyordu. Yeni yaklaşımda her oyuncu tek bir turda hem kendi cevabını verir hem partnerini tahmin eder. Böylece akış dört turdan ikiye iner ve oyuncu odadan çıkıp tekrar girmek zorunda kalmaz.

Tek soru ekranında sıra:

1. Oyuncu kendi cevabını verir (Evet / Kararsız / Hayır). Cevap gizli tutulur.
2. Aynı ekranda partnerinin ne cevap verdiğini tahmin eder.
3. Tahminine bir güven seviyesi ekler.
4. Tahmini kilitler.
5. Partner zaten cevapladıysa anlık mikro-reveal görünür; aksi halde "tahminin kaydedildi" bilgisi gösterilir.

Oyuncu turunu tamamladığında bir sonraki soruya geçer. İki oyuncu da turunu bitirince oda `result_ready` durumuna geçer ve sonuçlar açılır.

#### Güven seviyesi

Oyuncu her tahmin için bir güven seviyesi seçer:

- Tahmin (çarpan ×1)
- Sanırım (çarpan ×2)
- Eminim (çarpan ×3)

Güven seviyesi tahminin puan ağırlığını belirler. Emin olup tutturmak daha çok puan kazandırır; emin olup ıskalamak küçük bir risk taşır. Bu katman, basit evet/hayır mekaniğini küçük bir bahis oyununa çevirir ve sonuç ekranında "Sefa sana çok güvendi ve haklı çıktı" gibi konuşkan çıktılar üretir.

#### Anlık mikro-reveal

Her sorudan sonra, tüm sonucu sona saklamak yerine küçük bir geri bildirim verilebilir. Bu, akışı canlı tutar ve "bekleme uzun geliyor" hissini azaltır.

Mikro-reveal yalnızca partner o soruyu zaten cevaplamışsa gösterilir:

- Partner cevapladıysa: "doğru bildin / yakındın / ıskaladın" + kazanılan puan anlık gösterilir.
- Partner henüz cevaplamadıysa: "Tahminin kaydedildi, partner oynayınca birlikte göreceksiniz" bilgisi gösterilir ve detaylı reveal toplu sonuç ekranına bırakılır.

Bu davranış soft realtime mimarisiyle uyumludur: reveal için karşı tarafın verisi yoksa oyun akışı kesintiye uğramaz.

### 8.2 Prediction

Kullanıcı bir senaryo karşısında ne yapacağını seçer. Partner onun ne seçeceğini tahmin eder.

Örnek soru:

> Boş bir cumartesi gününde ne yapmayı tercih edersin?

Seçenekler:

- Evde dinlenmek
- Dışarı çıkmak
- Arkadaşlarla buluşmak
- Spontane plan yapmak

### 8.3 Orderline

Kullanıcı bazı kartları kendi öncelik sırasına göre dizer. Partner bu sıralamayı tahmin eder.

Örnek soru:

> Senin için en önemli olanları sırala.

Kartlar:

- Aile
- Özgürlük
- Kariyer
- Para

### 8.4 Karma Oyun

Secret Choice, Prediction ve Orderline modlarının dengeli karışımıdır. MVP’de öncelik Secret Choice modunda olacaktır. Karma Oyun daha sonra aktif edilebilir.

---

## 9. Ana Kullanıcı Akışı

### 9.1 Oda oluşturma akışı

1. Kullanıcı landing page’e gelir.
2. “Oyun Başlat” butonuna tıklar.
3. İsmini girer.
4. Partner adını opsiyonel olarak girer.
5. Oyun modunu seçer.
6. Soru sayısını seçer.
7. “Oyun linki oluştur” butonuna tıklar.
8. Sistem oda oluşturur.
9. Kullanıcı link paylaşım ekranına yönlenir.

### 9.2 İlk kullanıcının (owner) tur akışı

1. Kullanıcı “Cevaplamaya Başla” butonuna tıklar.
2. Soruları sırayla görür.
3. Her soruda tek ekranda: önce kendi cevabını verir, sonra partnerinin cevabını tahmin eder ve tahminine güven seviyesi ekler.
4. Tahmini kilitler. Partner zaten oynamışsa anlık mikro-reveal görür; oynamamışsa "tahminin kaydedildi" bilgisini görür.
5. Kendi cevapları gizli tutulur.
6. Tüm sorular tamamlandığında status `owner_completed` olur.
7. Kullanıcı bekleme ekranına yönlenir (partnerin turunu bekler).

### 9.3 Odaya giriş akışı (owner ve guest için ortak)

Her iki taraf da aynı public oda linkini kullanır:

```text
/game/room/x7k2p9qm4r
```

Public link yalnızca `room_code` içerir. Owner veya guest kimliği URL üzerinden açıkça taşınmaz.

Kimlik doğrulama iki farklı modelde çalışır:

#### Anonim model (ücretsiz oyun)

Ücretsiz oyunda login gerekmez; ancak kimlik doğrulama yalnızca isim eşleştirmesine bırakılmaz. İsim, kullanıcıyı ekranda göstermek için kullanılır; gerçek oda rolü `participant_token` ile doğrulanır.

Oda oluşturulduğunda sistem:

1. `room_code` üretir.
2. Owner için güvenli, tahmin edilemez bir `participant_token` üretir.
3. Token'ın ham değeri yalnızca kullanıcı tarafında saklanır.
4. Veritabanında token'ın kendisi değil, `token_hash` değeri tutulur.
5. Owner aynı tarayıcıdan döndüğünde token ile tanınır.

Partner linkten ilk kez girdiğinde:

1. İsim girişi ekranı açılır.
2. Odada guest yoksa yeni guest participant oluşturulur.
3. Guest için güvenli bir `participant_token` üretilir.
4. Token'ın ham değeri kullanıcının tarayıcısında saklanır.
5. Veritabanında yalnızca `token_hash` tutulur.
6. Guest oyun akışına yönlendirilir.

Dönüş kuralları:

- Aynı cihazdan gelen owner veya guest, local token ile kaldığı yerden devam eder.
- Farklı cihazdan yalnızca owner adını girerek owner olunamaz.
- Owner recovery MVP kapsamında zorunlu değildir; farklı cihazdan devam gerekiyorsa oda linki yeniden paylaşılabilir veya ileride recovery akışı eklenebilir.
- Odada owner ve guest varsa, token'ı olmayan üçüncü kullanıcıya "bu odada iki kişi zaten var" ekranı gösterilir.
- Display name büyük/küçük harf ve boşluk toleranslı normalize edilebilir; ancak kimlik doğrulama display name üzerinden yapılmaz.

Token saklama:

- MVP ve Production hardening aşamasında token'ın HttpOnly cookie'ye taşınması önerilir.
- Token URL query parametresi olarak taşınmamalıdır.
- Token veritabanında plaintext tutulmamalıdır.

#### Kayıtlı kullanıcı modeli (premium)

Kullanıcı Supabase Auth ile giriş yapmıştır. Linke girdiğinde:

1. Supabase JWT oturumu geçerliyse isim sorulmaz, doğrudan ilgili akışa yönlenir.
2. Oturum yoksa login ekranı açılır, giriş yapılır.
3. Yeni oluşturulan premium odalar `user_id` ile hesaba bağlanır.
4. Kayıtlı kullanıcı kimliği Supabase JWT ile doğrulanır.
5. Premium hak (`premium_until`) geçerliyse kullanıcı premium süresi boyunca sınırsız oda oluşturabilir.

### 9.4 Partnerin (guest) tur akışı

1. Partner soruları sırayla görür.
2. Her soruda tek ekranda: önce kendi cevabını verir, sonra ilk kullanıcının cevabını tahmin eder ve güven seviyesi ekler.
3. İlk kullanıcı turunu zaten bitirdiği için, partner her soruda anlık mikro-reveal görebilir.
4. Tüm sorular tamamlandığında status `guest_completed` olur.
5. İki taraf da turunu tamamladığı için sonuç hesaplama tetiklenir.

### 9.5 Sonucun açılması

1. İki taraf da turunu tamamladığında sonuç hesaplama tetiklenir.
2. Oda status’u `result_ready` olur.
3. İki taraf da sonuç ekranını görebilir.

Not: Birleştirilmiş tur sayesinde "ilk kullanıcının partneri ayrıca tahmin etmesi" gibi ek bir adım yoktur; her oyuncu tahminini kendi turunda zaten yapmıştır.

---

## 10. Soft Realtime Yaklaşımı

MVP’de tam canlı oyun yerine soft realtime kullanılacaktır.

Soft realtime ile kullanıcılar şunları canlı görebilir:

- Partner linke katıldı.
- Partner cevaplıyor.
- Partner tamamladı.
- Sonuçlar hazır.

Gerçek zamanlı olarak gösterilmeyecek şeyler:

- Partnerin verdiği gerçek cevaplar
- Partnerin tahminleri
- Partnerin güven seviyeleri
- Canlı soru geçişleri
- Timer

Mikro-reveal istisnası: Bir oyuncu tahminini kilitlediğinde, yalnızca partner o soruyu daha önce cevaplamışsa o tek sorunun sonucu (doğru/yakın/ıskaladın) anlık gösterilir. Bu, partnerin tüm cevaplarını canlı açmaz; sadece oyuncunun zaten tahmin ettiği soru için anlık geri bildirim verir.

### Status örnekleri

Room status:

- `created`
- `owner_playing`
- `owner_completed`
- `waiting_guest`
- `guest_joined`
- `guest_playing`
- `guest_completed`
- `result_ready`
- `completed`
- `expired`

Participant status:

- `invited`
- `joined`
- `playing`
- `completed`

Not: Birleştirilmiş tur ile artık ayrı `answering` ve `predicting` durumlarına gerek yoktur; her oyuncu tek `playing` durumunda hem cevaplar hem tahmin eder.

---

## 11. Sonuç Mantığı

Sonuç ekranı sert bir uyum testi gibi olmamalıdır. Odak "mükemmel eşleşme" değil, "birbirinizi ne kadar doğru okudunuz?" olmalıdır. Tüm paketlerde sonuç hesaplama aynıdır; detaylı analiz, kategori kırılımı veya istatistik yoktur.

### Ana metrik

**Okuma Skoru**

Kullanıcının partnerinin cevaplarını ne kadar doğru tahmin ettiğini gösterir.

```text
okuma_skoru = doğru_tahmin_sayısı / toplam_tahmin_sayısı * 100
```

Örnek:

> Okuma Skoru: %80

Yakın tahmin (Evet ↔ Kararsız veya Hayır ↔ Kararsız) doğru sayılır. Uzak tahmin (Evet ↔ Hayır) yanlış sayılır.

### Detay kartı

Her soru için şu bilgiler gösterilir:

- Soru metni
- Senin cevabın
- Partnerin tahmini
- Sonuç etiketi: "Doğru bildi" / "Yakın tahmin" / "Iskaladı"
- Konuşma önerisi

Örnek:

Soru:
> Her gün mesajlaşmak senin için önemli mi?

Senin cevabın:
> Evet

Partnerin tahmini:
> Kararsız

Sonuç:
> Yakın tahmin

Konuşma önerisi:
> Günlük iletişimin sizin için ne ifade ettiğini konuşabilirsiniz.
---

## 12. Monetizasyon

### Ücretsiz kullanım

- Login gerekmez
- 1 oyun, 10 soru
- Tüm oyun modları
- Basit sonuç ekranı
- Oda expire süresi: 24 saat

### Ücretli kullanım — 249 TL

Kullanıcı ödeme yapmak istediğinde kayıt olur (e-posta/şifre veya Google/Apple). Ödeme Lemon Squeezy üzerinden alınır.

- 3 günlük sınırsız oda oluşturma hakkı
- Tüm oyun modları
- Daha uzun oyunlar ve mevcut soru bankasının izin verdiği maksimum soru sayısı
- Sonuçları tekrar görüntüleme
- Süre dolunca tekrar 249 TL ile uzatılabilir
- Anonim oynanan ücretsiz oda hesaba bağlanmaz; yeni oyunlar hesaba bağlı olur

### Satın alma akışı

Ücret oyun başında değil, kullanıcı deneyimi gördükten sonra sunulur:

1. Kullanıcı anonim olarak ücretsiz oyunu oynar (login yok)
2. Sonuç ekranında "devam etmek ister misin?" sorusuyla premium teklifi görür
3. İlk kez kayıt olur: e-posta/şifre veya Google/Apple ile
4. Lemon Squeezy ödeme ekranına yönlenir, $2.99 öder
5. Hesabında 3 günlük premium hak aktif olur
6. Yeni oyunları bu hesaba bağlı açar

Agresif satış, geri sayım, manipülatif metin veya ilişki baskısı kullanılmamalıdır.

### Oda expire mantığı

| Oda tipi | Expire süresi | Başlangıç |
|---|---|---|
| Ücretsiz (anonim) | 24 saat | Oda oluşturulduğunda |
| Ücretli (hesaplı) | 3 gün (72 saat) | Oda oluşturulduğunda |

Premium hakkı 3 gün sürer; bu sürede açılan her oda 72 saatlik expire ile oluşur. Premium kullanıcı için "sınırsız" ifadesi sınırsız oda oluşturma anlamına gelir; soru sayısı mevcut soru bankası ve seçilen oyun modunun desteklediği maksimum soru sayısıyla sınırlıdır.

Expire kontrolü cron job ile değil, okuma anında hesaplanır: `expires_at < now()` ise oda inaktif sayılır. Veritabanında ayrı bir güncelleme işlemi yapılmaz.
---

## 13. Sayfa ve Ekran Gereksinimleri

### 13.1 Landing Page

Amaç: Kullanıcının ürünü 10 saniyede anlamasını sağlamak.

İçerikler:

- Hero başlık
- Alt açıklama
- Oyun Başlat CTA
- Nasıl Çalışır bölümü
- Oyun modları bölümü
- Sonuç önizlemesi
- Premium paket önizlemesi

Örnek metinler:

Başlık:

> Oyun oynayarak birbirinizi daha iyi tanıyın.

Alt başlık:

> Game of Us, iki kişinin birbirini tahmin edip daha iyi tanıması için tasarlanmış kısa ve eğlenceli oyunlar sunar.

CTA:

> Oyun Başlat

### 13.2 Create Game Screen

Alanlar:

- İsmin
- Partner adı opsiyonel
- Oyun modu
- Soru sayısı

Buton:

> Oyun linki oluştur

### 13.3 Share Link Screen

İçerikler:

- Davet linki
- Linki kopyala
- WhatsApp ile paylaş
- Oda durumu
- Cevaplamaya başla butonu

### 13.4 Game Screens

Secret Choice oyun ekranı tek soruda iki bölümlü birleştirilmiş tur yapısına sahip olmalıdır:

- Progress bilgisi ve canlı puan göstergesi
- Soru kartı
- Bölüm 1 — Kendi cevabın: cevap seçenekleri (gizli tutulur)
- Bölüm 2 — Partneri tahmin: aynı seçenekler, farklı vurgu rengi
- Güven seviyesi seçimi (tahmin / sanırım / eminim)
- Mikro açıklama
- "Tahmini kilitle" butonu

Tahmin kilitlendikten sonra mikro-reveal ekranı gösterilir:

- Sonuç ikonu ve etiketi (doğru bildin / yakındın / ıskaladın)
- Senin cevabın · partnerin cevabı
- Kazanılan puan ve güven notu
- Partner henüz oynamadıysa: "tahminin kaydedildi" fallback görünümü
- Devam butonu

### 13.5 Waiting Screen

İçerikler:

- Senin durumun (tamamlandı)
- Partner durumu (oynuyor)
- Birleştirilmiş tur sayesinde en fazla tek bekleme olduğunun belirtilmesi
- Sonuçların ne zaman açılacağı bilgisi
- Yumuşak progress görünümü
- Opsiyonel "linki tekrar gönder" butonu

### 13.6 Results Overview

İçerikler:

- Okuma Skoru (yüzde olarak, büyük ve belirgin)
- Teşvik edici kısa bir metin ("Birbirinizi oldukça iyi okudunuz!")
- Detayları Gör butonu
- Tekrar Oyna butonu
- Premium teaser (sohbeti devam ettirin)

### 13.7 Detailed Results

İçerikler:

- Soru bazlı kartlar (her soru için: soru metni, iki cevap, sonuç etiketi, konuşma önerisi)
- Sonuç etiketi: "Doğru bildi" / "Yakın tahmin" / "Iskaladı"
- Konuşma önerisi her kart için gösterilir
- Puan, istatistik veya kategori kırılımı yoktur

### 13.8 Premium Unlock

İçerikler:

- Premium paket adı
- Paket faydaları
- Fiyat
- Satın alma CTA

### 13.9 Empty / Error States

Durumlar:

- Geçersiz link
- Oda süresi doldu
- Partner henüz katılmadı
- Bağlantı koptu
- Sonuçlar henüz hazır değil
- Oyun zaten tamamlandı

---

## 14. UX İlkeleri

- Login zorunlu olmamalı.
- Link paylaşımı ana büyüme döngüsü olmalı.
- Kullanıcı oyunu 10 saniyede anlamalı.
- Seçenekler büyük ve dokunulabilir olmalı.
- Cevaplar reveal aşamasına kadar gizli kalmalı.
- Her soru tek ekranda tamamlanmalı; cevap ve tahmin için oda içinde ileri-geri geçiş olmamalı.
- Akış kısa hissettirmeli; oyuncu mümkün olduğunca az bekleme ve az tıklama ile oynamalı.
- Anlık mikro-reveal mümkünse kullanılmalı, ancak partner verisi yoksa akışı bloke etmemeli.
- Güven seviyesi seçimi akışı uzatmamalı; tek dokunuşla seçilebilmeli.
- Ton sıcak, yumuşak ve yargılayıcı olmayan bir dilde olmalı.
- “Mükemmel eşleşme”, “ilişkiniz kötü” gibi teşhis edici metinlerden kaçınılmalı.
- Sonuçlar kullanıcıyı konuşmaya teşvik etmeli.
- Mobil kullanım öncelikli olmalı.
- Masaüstü kullanımda ekran dar mobil görünüm gibi kalmamalı.

---

## 15. Responsive Tasarım Gereksinimleri

### Mobil

- Tek kolon
- Büyük seçim kartları
- Alt CTA sticky olabilir
- Progress üstte gösterilmeli
- Kartlar tam genişliğe yakın olmalı
- Uzun Türkçe ve İngilizce metinler taşmamalı

### Masaüstü

- 1200–1400px genişlik mantığı
- 2 veya 3 kolon kullanılmalı
- Sol panel: adımlar / ilerleme / mod bilgisi
- Orta panel: ana soru kartı
- Sağ panel: partner durumu / oda bilgisi
- Büyük boş yan alanlar bırakılmamalı

---

## 16. Teknik Mimari

### Önerilen teknoloji stack

Frontend:

- Next.js
- TypeScript
- Tailwind CSS
- Stitch (arayüz tasarımı): Tüm ekranlar Stitch'te tasarlanır ve oradan export edilen koddan (HTML/Tailwind veya React/Tailwind) üretilir. Hazır bir component kütüphanesi (shadcn/ui vb.) kullanılmaz; arayüz bileşenleri Stitch tasarımlarından gelir.
- next-intl (çoklu dil desteği): Arayüz metinleri TR ve EN olarak yönetilir. Dil, `Accept-Language` header'ından otomatik algılanır; URL prefix'i (`/tr`, `/en`) ile manuel override desteklenir. Soru içeriği MVP'de TR'de kalabilir; ileride soru bankası da locale bazlı ayrılabilir.

Backend:

- Supabase
  - Postgres
  - Realtime
  - Supabase Auth (Faz 2 ödeme/premium akışı için)
  - Edge Functions (zorunlu değil; webhook ve güvenli server-side işlemler için opsiyonel)
- Next.js server-side API route / server action
  - Oda oluşturma
  - Cevap ve tahmin kaydetme
  - Sonuç hesaplama
  - Token doğrulama

Deploy:

- Vercel

Auth:

- Ücretsiz oyun anonimdir; login gerekmez.
- Anonim oyuncular `participant_token` ile tanınır.
- Token ham hali client tarafında saklanır; DB'de yalnızca `token_hash` tutulur.
- Supabase Auth yalnızca ödeme yapmak ve premium hak kullanmak isteyen kullanıcılar için zorunludur.
- Supabase Auth seçenekleri:
  - E-posta / şifre
  - Google OAuth
  - Apple OAuth

Ödeme:

- Lemon Squeezy (tek seferlik ödeme, $2.99, 3 günlük hak)
- Faz 1'de ödeme entegrasyonu aktif değildir; premium ekran mock olarak gösterilir.
- Faz 2'de Lemon Squeezy webhook ile ödeme doğrulanır ve `premium_until` güncellenir.

### Server-side işlem yaklaşımı

Edge Function, MVP için zorunlu değildir. Sonuç hesaplama ve token doğrulama gibi işlemler Next.js API route / server action ile de yapılabilir.

Önerilen MVP yaklaşımı:

- Sonuç hesaplama: Next.js server-side endpoint
- Cevap/tahmin yazma: server-side endpoint veya Supabase RPC/RLS kontrollü işlem
- Realtime: yalnızca `rooms.status` ve `participants.status` için
- Lemon Squeezy webhook: Faz 2'de Edge Function veya Vercel API route

Kural:

> Cevap, tahmin, sonuç ve premium hak gibi kritik işlemler client-only hesaplamaya bırakılmamalıdır. Bu işlemler server-side doğrulanmalıdır.

### Realtime kapsamı

Supabase Realtime yalnızca soft realtime durum güncellemeleri için kullanılmalıdır:

- Partner katıldı
- Partner oynuyor
- Partner tamamladı
- Sonuç hazır

Realtime'a açılması önerilen tablolar/alanlar:

- `rooms.status`
- `participants.status`
- `participants.last_seen_at` (opsiyonel)

Realtime'a açılmaması gereken veriler:

- `answers`
- `predictions`
- Partnerin gerçek cevapları
- Partnerin tahminleri
- Sonuç detayları reveal öncesi

Bu yaklaşım hem gizlilik hem de ücretsiz plan kota yönetimi açısından daha güvenlidir.

## 17. Veri Modeli Taslağı

### `users`

Yalnızca ödeme yapan (kayıtlı) kullanıcılar için. Supabase Auth ile yönetilir.

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Kullanıcı ID (Supabase Auth UID) |
| email | text | E-posta adresi |
| premium_until | timestamptz | Premium hakkının bitiş tarihi (null = ücretsiz) |
| created_at | timestamptz | Kayıt zamanı |

### `rooms`

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Oda ID |
| room_code | text | Paylaşılabilir kısa kod; tahmin edilmesi zor olmalıdır |
| status | text | Oda durumu |
| game_mode | text | secret_choice / prediction / orderline / mixed |
| question_count | int | Seçilen soru sayısı |
| owner_id | uuid | Odayı oluşturan participant |
| user_id | uuid | Kayıtlı kullanıcı ID (anonim odalar için null) |
| is_premium_room | boolean | Premium hak ile açılan oda mı? |
| max_participants | int | Varsayılan 2 |
| join_locked | boolean | Oda dolduktan sonra yeni katılımı kapatmak için |
| locale | text | tr / en; MVP'de arayüz dili için, ileride soru dili için de kullanılabilir |
| created_at | timestamptz | Oluşturulma zamanı |
| expires_at | timestamptz | Oda geçerlilik süresi (ücretsiz: 24 saat, ücretli: 72 saat) |

Önerilen constraint/index:

```sql
unique(room_code)
```

### `participants`

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Participant ID |
| room_id | uuid | Oda ID |
| role | text | owner / guest |
| display_name | text | Kullanıcı adı; kimlik doğrulama için tek başına kullanılmaz |
| status | text | joined / playing / completed |
| token_hash | text | Participant token'ın hashlenmiş değeri; ham token DB'de tutulmaz |
| last_seen_at | timestamptz | Son aktivite zamanı |
| completed_at | timestamptz | Oyunu tamamlama zamanı |
| created_at | timestamptz | Oluşturulma zamanı |

Önerilen constraint/index:

```sql
unique(room_id, role)
unique(room_id, token_hash)
```

Notlar:

- Ham `participant_token` yalnızca client tarafında saklanır.
- MVP'de localStorage kullanılabilir.
- Production hardening aşamasında HttpOnly cookie tercih edilebilir.
- Farklı cihazdan yalnızca isim yazarak owner rolü alınamaz.

### `questions`

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Soru ID |
| mode | text | secret_choice / prediction / orderline |
| category | text | iletişim / sosyal hayat / değerler vb. |
| question_text | text | Soru metni |
| locale | text | tr / en; MVP'de varsayılan tr olabilir |
| is_active | boolean | Aktiflik |
| created_at | timestamptz | Oluşturulma zamanı |

### `question_options`

Prediction modu için kullanılabilir.

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Option ID |
| question_id | uuid | Soru ID |
| option_text | text | Seçenek metni |
| sort_order | int | Sıralama |

Önerilen constraint/index:

```sql
unique(question_id, sort_order)
```

### `room_questions`

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | ID |
| room_id | uuid | Oda ID |
| question_id | uuid | Soru ID |
| round_order | int | Oyun içindeki sıra |

Önerilen constraint/index:

```sql
unique(room_id, round_order)
unique(room_id, question_id)
```

### `answers`

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Cevap ID |
| room_id | uuid | Oda ID |
| question_id | uuid | Soru ID |
| participant_id | uuid | Cevabı veren kişi |
| answer_value | text/jsonb | Cevap değeri |
| locked_at | timestamptz | Cevabın kilitlendiği zaman |
| created_at | timestamptz | Oluşturulma zamanı |

Önerilen constraint/index:

```sql
unique(room_id, question_id, participant_id)
```

Kural:

- Bir participant aynı odada aynı soruya yalnızca bir cevap verebilir.
- Cevap kilitlendikten sonra client tarafından değiştirilememelidir.
- Partner cevabı reveal öncesi client tarafından okunamamalıdır.

### `predictions`

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Tahmin ID |
| room_id | uuid | Oda ID |
| question_id | uuid | Soru ID |
| predictor_participant_id | uuid | Tahmini yapan kişi |
| target_participant_id | uuid | Tahmin edilen kişi |
| predicted_value | text/jsonb | Tahmin değeri |
| confidence_level | text | Güven seviyesi: guess / think / sure |
| confidence_multiplier | int | Güven çarpanı: 1 / 2 / 3 (mikro-reveal için kullanılır, sonuca yansımaz) |
| locked_at | timestamptz | Tahminin kilitlendiği zaman |
| created_at | timestamptz | Oluşturulma zamanı |

Önerilen constraint/index:

```sql
unique(room_id, question_id, predictor_participant_id, target_participant_id)
```

Kural:

- Tahmin kilitlenmeden mikro-reveal hesaplanmaz.
- Tahmin kilitlendikten sonra değiştirilemez.
- Partner cevabı tahmin kilitlenmeden hiçbir şekilde expose edilmez.

### `results`

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Sonuç ID |
| room_id | uuid | Oda ID |
| reading_score | numeric | Okuma skoru (doğru tahmin / toplam tahmin × 100) |
| details_json | jsonb | Soru bazlı sonuçlar (cevaplar, tahminler, etiketler) |
| created_at | timestamptz | Oluşturulma zamanı |

Önerilen constraint/index:

```sql
unique(room_id)
```

Kural:

- Sonuç yalnızca iki participant oyunu tamamladıktan sonra hesaplanır.
- Sonuç hesaplama server-side yapılır.
- Aynı oda için duplicate result oluşturulmaz.

### `payments`

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Payment ID |
| user_id | uuid | Ödeme yapan kayıtlı kullanıcı |
| room_id | uuid | İlgili oda; opsiyonel olabilir |
| provider | text | lemonsqueezy |
| provider_event_id | text | Webhook event ID; idempotency için |
| amount | numeric | Tutar |
| currency | text | Para birimi |
| status | text | pending / paid / failed / refunded |
| created_at | timestamptz | Oluşturulma zamanı |

Önerilen constraint/index:

```sql
unique(provider_event_id)
```

### `rate_limits` veya abuse kontrol kaydı (opsiyonel)

İlk MVP'de şart değildir; ancak anonim oda oluşturma kötüye kullanımı için ileride eklenebilir.

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Kayıt ID |
| key | text | IP hash / browser fingerprint hash / user_id |
| action | text | create_room / join_room vb. |
| count | int | İlgili pencere içindeki deneme sayısı |
| window_start | timestamptz | Rate limit pencere başlangıcı |
| created_at | timestamptz | Oluşturulma zamanı |

## 18. Güvenlik ve Gizlilik

### Kimlik doğrulama modelleri

**Anonim model (ücretsiz oyun):**

- Kullanıcı hesabı gerekmez.
- Kimlik doğrulama yalnızca isim eşleştirmesine bırakılmaz.
- Owner ve guest rolleri `participant_token` ile doğrulanır.
- Token'ın ham değeri client tarafında saklanır.
- Veritabanında ham token değil, `token_hash` tutulur.
- Display name yalnızca kullanıcıyı ekranda göstermek için kullanılır.
- Farklı cihazdan aynı ismi giren kişi otomatik owner olarak kabul edilmez.
- Aynı cihazdan geri dönen oyuncu token ile kaldığı yerden devam eder.

**Kayıtlı kullanıcı modeli (premium):**

- Supabase Auth ile kimlik yönetilir; oturum Supabase JWT token ile korunur.
- E-posta/şifre, Google OAuth veya Apple OAuth ile giriş yapılabilir.
- Premium odalar kayıtlı `user_id` ile ilişkilendirilir.
- Premium hak `users.premium_until` alanıyla kontrol edilir.

### Genel kurallar

- Oda linki tahmin edilemeyecek kadar güçlü olmalıdır.
- `room_code` kısa gösterilebilir; ancak brute force'a açık olmamalıdır.
- Token URL query parametresinde taşınmamalıdır.
- Ücretsiz ve ücretli odalar aynı public link yapısını kullanabilir; erişim modeli kullanıcının token/JWT durumuna göre belirlenir.
- Cevaplar reveal öncesi karşı taraf tarafından okunamamalıdır.
- Sonuçlar yalnızca ilgili oda katılımcıları tarafından görüntülenmelidir.
- Oda belirli süre sonra inaktif olmalıdır: ücretsiz 24 saat, ücretli 72 saat.
- Expire kontrolü okuma anında `expires_at < now()` ile yapılır; cron job gerekmez.
- Hassas ilişki verileri üçüncü tarafla paylaşılmamalıdır.
- Analytics event'lerinde bireysel cevap içeriği tutulmamalıdır.

### Cevap gizliliği ve reveal kuralları

- Partnerin gerçek cevabı, tahmin kilitlenmeden önce hiçbir şekilde client'a dönmemelidir.
- Mikro-reveal yalnızca oyuncu kendi cevabını ve tahminini kilitledikten sonra hesaplanabilir.
- Mikro-reveal sadece ilgili soru için "doğru / yakın / ıskaladı" gibi türetilmiş sonucu gösterebilir.
- Mikro-reveal, partnerin tüm cevaplarını veya henüz oynanmamış sorulara ait bilgileri açığa çıkarmaz.
- Sonuç ekranı yalnızca oda `result_ready` durumuna geçtiğinde açılır.

### RLS ve veri erişim kuralları

Supabase client doğrudan veritabanına erişecekse Row Level Security zorunlu olarak tasarlanmalıdır. Daha güvenli ve sade MVP yaklaşımı, kritik işlemleri server-side endpoint üzerinden yürütmektir.

Önerilen MVP yaklaşımı:

- Client doğrudan `answers` ve `predictions` tablolarından partner verisi okuyamaz.
- Cevap ve tahmin kaydetme işlemleri token doğrulayan server-side endpoint üzerinden yapılır.
- Sonuç hesaplama server-side yapılır.
- Sonuç detayları yalnızca `result_ready` sonrası ilgili participant token/JWT doğrulanarak döndürülür.
- `answers` ve `predictions` tabloları Realtime'a açılmaz.

Minimum RLS beklentileri:

- Kullanıcı yalnızca kendi participant kaydını okuyabilir.
- Kullanıcı yalnızca kendi cevabını/tahminini oluşturabilir.
- Kullanıcı partnerin cevabını reveal öncesi okuyamaz.
- Oda doluysa token'ı olmayan üçüncü kişi oda içeriğine erişemez.
- Premium kullanıcı yalnızca kendi `user_id` ile ilişkili premium odaları yönetebilir.

### Abuse / spam kontrolü

Anonim oyun oluşturma login gerektirmediği için kötüye kullanım riski vardır. İlk MVP'de basit limitlerle başlanmalıdır.

Önerilen başlangıç limitleri:

- Aynı IP veya IP hash için saatte maksimum 10 oda oluşturma
- Aynı IP veya IP hash için günde maksimum 50 oda oluşturma
- Aynı oda için maksimum 2 participant
- Oda dolduktan sonra `join_locked = true`
- Çok sık join denemelerinde geçici bloklama

Bu kontroller ilk versiyonda basit tutulabilir; büyüme olursa Upstash Redis, Supabase tablosu veya edge middleware ile güçlendirilebilir.

### Veri saklama ve gizlilik

- Ücretsiz oda verileri 24 saat sonra inaktif sayılır.
- Premium oda verileri 72 saat sonra inaktif sayılır.
- MVP'de fiziksel silme cron job'u zorunlu değildir.
- İleride veri minimizasyonu için belirli aralıklarla eski anonim odaların temizlenmesi eklenebilir.
- Analytics tarafında soru/cevap içeriği değil, event seviyesinde davranış metrikleri tutulmalıdır.

## 19. Analytics ve KPI

### Aktivasyon metrikleri

- Landing → Oyun oluşturma oranı
- Oyun oluşturma → Link paylaşma oranı
- Link açılma oranı
- Partner katılım oranı
- İlk kullanıcının cevap tamamlama oranı
- Partnerin tahmin tamamlama oranı
- Sonuç ekranı görüntülenme oranı

### Viral metrikler

- Oda başına davet edilen kişi sayısı
- Paylaşılan link sayısı
- WhatsApp paylaşım oranı
- Tamamlanan oyun sonrası yeni oda oluşturma oranı

### Gelir metrikleri

- Ücretsiz oyun sonrası premium ekran görüntülenme oranı
- Premium conversion rate
- Oda başı gelir
- Kullanıcı başı gelir

### İlk MVP başarı kriteri

İlk 100 oda için hedefler:

- En az %50 partner katılımı
- En az %35 tamamlanan oyun oranı
- En az %5 premium satın alma niyeti veya ödeme dönüşümü

---

## 20. İlk Soru Kategorileri

### İletişim

- Her gün mesajlaşmak senin için önemli mi?
- Günaydın mesajı almak hoşuna gider mi?
- Geç cevap verilmesi seni rahatsız eder mi?
- Telefonda konuşmak yazışmadan daha iyi midir?
- Gün içinde haberleşmek önemli midir?

### İlk Buluşma / Yakınlaşma

- İlk buluşmada el ele tutuşmak doğal mı?
- İlk buluşmada uzun saatler geçirmek hoşuna gider mi?
- İlk buluşmada fotoğraf çekmek ister misin?
- İlk buluşmada ikinci buluşmayı konuşmak doğru mu?
- İlk buluşmada eski ilişkilerden bahsetmek sorun olur mu?

### Sosyal Hayat

- Partnerin sık arkadaşlarıyla çıkması normal midir?
- Karşı cins yakın arkadaş olabilir mi?
- Sosyal medyada ilişki paylaşmak ister misin?
- Partnerin yalnız tatile gitmesi normal midir?
- Kalabalık arkadaş ortamları hoşuna gider mi?

### Yaşam Tarzı

- Hafta sonunu evde geçirmek hoşuna gider mi?
- Spontane planları sever misin?
- Erken kalkmayı sever misin?
- Gelecekte yurt dışında yaşamak ister misin?
- Evde birlikte yemek yapmak hoşuna gider mi?

### Değerler

- Bir ilişkide özel alan önemli midir?
- Duygularını kolay ifade eder misin?
- Planlı yaşamak senin için önemli midir?
- Aile ilişkileri senin için çok önemli midir?
- Kariyer ilişkiden önce gelebilir mi?

---

## 21. Geliştirme Fazları

### Faz 1 — MVP + Oyun Deneyimi

- Landing
- Oda oluşturma
- Secret Choice modu
- Link paylaşımı
- Guest join (anonim participant token ile)
- Owner/guest token üretimi ve token hash saklama
- Birleştirilmiş tur akışı
- Soft realtime status
- Mikro-reveal
- Sonuç hesaplama (server-side endpoint; Edge Function zorunlu değildir)
- Sonuç ekranı
- Premium mock ekranı (ödeme entegrasyonu aktif değil)
- Soru bankası: 50 soru, seeds/questions.ts üzerinden Supabase'e insert edilir
- Temel RLS / server-side veri erişim kontrolleri
- Temel abuse/rate limit kontrolü
- Supabase Auth (e-posta/şifre + Google + Apple)
- Premium hak yönetimi (`premium_until`)
- Premium kullanıcı için sınırsız oda oluşturma
- Prediction modu
- Orderline modu
- Karma oyun
- Sonuç paylaşım kartları
- Referral / davet akışı

### Faz 2 — Gelir ve Büyüme
- Lemon Squeezy ödeme entegrasyonu ($2.99, 3 günlük hak)
- Lemon Squeezy webhook endpoint'i (Edge Function veya Vercel API route)

### Faz 3 — İleri Özellikler

- PWA install prompt
- AI destekli soru önerileri
- Admin panel
- Hafif kullanıcı hesabı geliştirmeleri
- Geçmiş oyunları saklama
- Eski anonim odalar için otomatik veri temizleme job'u
- HttpOnly cookie tabanlı token saklama hardening'i

## 22. Açık Kararlar

MVP geliştirmeye başlanabilir. Ancak teknik kararlarda aşağıdaki netleştirilmiş yaklaşım esas alınmalıdır.

| Karar | Sonuç |
|---|---|
| Domain | .app uzantısı hedefleniyor (gameofus.app), kesinleşmedi |
| İlk versiyonda ödeme | Faz 1'de yalnızca premium mock ekranı; gerçek ödeme entegrasyonu Faz 2'de aktif |
| Token mimarisi | Anonim kullanıcılar için owner/guest `participant_token` üretilecek; DB'de yalnızca `token_hash` tutulacak |
| Owner tanıma | Owner yalnızca token/JWT ile tanınır; isim eşleştirmesi owner olmak için yeterli değildir |
| Guest tanıma | Guest ilk katılımda token alır; aynı cihazdan token ile devam eder |
| Token saklama | MVP'de localStorage kabul edilebilir; production hardening için HttpOnly cookie değerlendirilecek |
| Auth | Supabase Auth yalnızca ödeme/premium akışında zorunlu; ücretsiz oyun anonimdir |
| Ödeme sağlayıcısı | Lemon Squeezy; tek seferlik $2.99; 3 günlük premium hak |
| Soru bankası | 50 soru, seeds/questions.ts dosyasından Supabase migration ile insert edilir |
| Sonuç hesaplama | Server-side endpoint üzerinden yapılır; Edge Function zorunlu değildir |
| Edge Function kullanımı | Faz 1 için opsiyonel; Faz 2'de webhook ve premium hak güncelleme için kullanılabilir |
| Realtime kapsamı | Sadece oda/participant status güncellemeleri; answers/predictions realtime'a açılmaz |
| Ücretsiz oda expire | 24 saat |
| Premium oda expire | 72 saat |
| Premium sınırı | Premium süresi boyunca sınırsız oda; soru sayısı mevcut soru bankası ve mod limitiyle sınırlı |
| Abuse kontrol | Anonim oda oluşturma için IP/IP-hash bazlı temel rate limit uygulanır |
| RLS / veri gizliliği | Partner cevapları reveal öncesi okunamaz; kritik işlemler server-side doğrulanır |

## 23. Başarı Tanımı

MVP başarılı sayılacaktır eğer:

- Kullanıcılar app indirmeden linkle kolayca oyuna başlayabiliyorsa
- Partner katılım oranı anlamlı seviyedeyse
- Oyunun tamamlanma oranı yüksekse
- Sonuç ekranı kullanıcıda konuşma başlatıyorsa
- Kullanıcılar oyunu başka birine göndermek istiyorsa
- Premium satın alma niyeti veya dönüşümü oluşuyorsa

---

## 24. Özet

Game of Us, iki kişinin birbirini tahmin ederek ve cevapları birlikte açarak daha iyi tanımasını sağlayan link bazlı bir web app'tir. MVP'de Secret Choice modu, birleştirilmiş tur akışı, soft realtime durum ekranı, sonuç özeti ve premium satın alma akışıyla hızlıca test edilebilir.

Ücretsiz oyun tamamen anonimdir — link paylaşımı, iki kişilik oyun ve sonuç ekranı için kayıt gerekmez. Kayıt yalnızca $2.99 ödeyip 3 günlük sınırsız oyun hakkı almak isteyen kullanıcıdan istenir.

Ürünün en kritik varsayımı teknik değil, davranışsaldır:

> İnsanlar partnerine veya yakın olduğu bir kişiye bu oyun linkini göndermek isteyecek mi?

MVP'nin temel amacı bu varsayımı hızlı, düşük maliyetli ve ölçülebilir şekilde test etmektir.
