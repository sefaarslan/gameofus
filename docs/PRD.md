# PRD — Game of Us


## 1. Ürün Özeti

**Ürün adı:** Game of Us
**Platform:** Web (Next.js, responsive/PWA-ready) + Mobile (Expo/React Native — iOS & Android)
**Dil:** Türkçe, İngilizce ve İspanyolca — üçü de hem arayüz hem soru içeriği için desteklenir.
**Hedef cihaz:** Mobil öncelikli, masaüstü ve native mobile destekli
**Teknik yaklaşım:** Link bazlı oda oluşturma, asenkron akış, soft realtime durum güncellemeleri

Game of Us, iki kişinin birbirini daha iyi tanıması için tasarlanmış kısa ve eğlenceli mini oyunlar sunan bir uygulamadır. Kullanıcılar bir oyun odası oluşturur, linki partnerine gönderir; her iki taraf da tek bir turda hem kendi cevabını verir hem de partnerinin cevabını tahmin eder. İki taraf da turunu tamamladığında sonuçlar açılır.

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

Game of Us bu problemi, "cevapla → tahmin et → sonucu birlikte gör" oyun döngüsüyle çözer.

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
- Linkle oynanan web app + native mobile app
- Kısa, sıcak ve tekrar oynanabilir bir çift aktivitesi

---

## 6. Temel Değer Önerisi

**Kısa oyunlar oynayın, birbirinizi daha iyi tanıyın.**

Kullanıcıya verilen temel değerler:

- App indirmeden linkle oynama (web)
- Partnerini tahmin etme eğlencesi
- Sonuçlardan konuşma başlatma
- Yargılayıcı olmayan yumuşak sonuçlar
- Ücretsiz hızlı deneme
- Mobile app'te: geçmiş oyunları saklama, daha derin/özel soru kategorileri

---

## 7. MVP Kapsamı

### Web MVP'sinde olan özellikler (mevcut, stabil)

1. Landing page
2. Oyun odası oluşturma (anonim, login gerekmez)
3. Partner adı opsiyonel girme
4. Oyun modu seçimi
5. Soru sayısı seçimi
6. Kategori seçimi (temel kategoriler oynanabilir, premium kategoriler kilitli rozetle gösterilir — bkz. Bölüm 12.5)
7. Link oluşturma
8. Link kopyalama
9. WhatsApp ile paylaşma
10. Partnerin linkten katılması (anonim guest token ile)
11. Secret Choice oyun modu
12. Birleştirilmiş tur: her soruda kendi cevabını verme + partneri tahmin etme (tek ekran)
13. Tahminlerde güven seviyesi seçimi (tahmin / sanırım / eminim)
14. Anlık mikro-reveal
15. Soft realtime durum ekranı
16. Sonuç hesaplama ve sonuç ekranı
17. Temel hata ve boş durum ekranları

### Mobile MVP'sinde olan özellikler (yeni)

Web'deki tüm özelliklere ek olarak:

1. Signin / Signout (e-posta/şifre + Google + Apple — Supabase Auth)
2. Geçmiş oyunlar sekmesi (yalnızca login'li kullanıcı, yalnızca sonuç görünümü)
3. Premium satın alma akışı (tek seferlik paket — bkz. Bölüm 12.5)
4. Premium kategorilere kalıcı erişim
5. Oda kredisi sistemi ve kredi paketi satın alma
6. Push notification (partner katıldı / tamamladı / sonuç hazır)
7. Deep linking (oda linkleri hem web hem mobile'dan açılabilir)

### MVP'de olmayacak özellikler (her iki platform)

- Chat
- Swipe / dating profili
- Public profil
- Sosyal feed
- Gelişmiş arkadaş listesi
- AI soru üretimi
- Abonelik sistemi (aylık/yıllık — bilinçli olarak tercih edilmedi, bkz. Bölüm 12)
- Canlı timer'lı realtime oyun
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

Secret Choice, Prediction ve Orderline modlarının dengeli karışımıdır. MVP'de öncelik Secret Choice modunda olacaktır. Karma Oyun daha sonra aktif edilebilir.

---

## 9. Ana Kullanıcı Akışı

### 9.1 Oda oluşturma akışı

1. Kullanıcı landing page'e gelir (web) veya app'i açar (mobile).
2. "Oyun Başlat" butonuna tıklar.
3. İsmini girer.
4. Partner adını opsiyonel olarak girer.
5. Oyun modunu seçer.
6. Kategori seçer (temel kategoriler herkese açık; premium kategoriler platforma göre farklı davranır — bkz. Bölüm 12.5).
7. Soru sayısını seçer.
8. "Oyun linki oluştur" butonuna tıklar.
9. Sistem oda oluşturur.
10. Kullanıcı link paylaşım ekranına yönlenir.

### 9.2 İlk kullanıcının (owner) tur akışı

1. Kullanıcı "Cevaplamaya Başla" butonuna tıklar.
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

Bu link hem web tarayıcısından hem mobile app'ten (deep link / universal link ile) açılabilir. App yüklüyse mobile app'te açılır, yüklü değilse web'e düşer.

**Dil devralma kuralı:** Link açıldığında, oda hangi dilde kurulduysa (`rooms.locale`) o dil geçerli olur — guest'in kendi cihaz/tarayıcı dili bu durumda göz ardı edilir. Guest, hem arayüzü hem soruları odanın dilinde görür (bkz. Bölüm 16). Owner için ise dil, oda kurulurken o anki arayüz tercihine göre zaten sabitlenmiştir.

Kimlik doğrulama iki farklı modelde çalışır:

#### Anonim model (ücretsiz oyun — hem web hem mobile)

Ücretsiz oyunda login gerekmez; ancak kimlik doğrulama yalnızca isim eşleştirmesine bırakılmaz. İsim, kullanıcıyı ekranda göstermek için kullanılır; gerçek oda rolü `participant_token` ile doğrulanır.

Oda oluşturulduğunda sistem:

1. `room_code` üretir.
2. Owner için güvenli, tahmin edilemez bir `participant_token` üretir.
3. Token'ın ham değeri yalnızca kullanıcı tarafında saklanır (web: `localStorage`; mobile: `expo-secure-store`).
4. Veritabanında token'ın kendisi değil, `token_hash` değeri tutulur.
5. Owner aynı cihazdan döndüğünde token ile tanınır.

Partner linkten ilk kez girdiğinde:

1. İsim girişi ekranı açılır.
2. Odada guest yoksa yeni guest participant oluşturulur.
3. Guest için güvenli bir `participant_token` üretilir.
4. Token'ın ham değeri kullanıcının cihazında saklanır.
5. Veritabanında yalnızca `token_hash` tutulur.
6. Guest oyun akışına yönlendirilir.

Dönüş kuralları:

- Aynı cihazdan gelen owner veya guest, local token ile kaldığı yerden devam eder.
- Farklı cihazdan yalnızca owner adını girerek owner olunamaz.
- Owner recovery MVP kapsamında zorunlu değildir; farklı cihazdan devam gerekiyorsa oda linki yeniden paylaşılabilir veya ileride recovery akışı eklenebilir.
- Odada owner ve guest varsa, token'ı olmayan üçüncü kullanıcıya "bu odada iki kişi zaten var" ekranı gösterilir.
- Display name büyük/küçük harf ve boşluk toleranslı normalize edilebilir; ancak kimlik doğrulama display name üzerinden yapılmaz.

Token saklama:

- Web: `localStorage`; production hardening aşamasında HttpOnly cookie'ye taşınması önerilir.
- Mobile: `expo-secure-store` (cihaz bazlı güvenli saklama).
- Token URL query parametresi olarak taşınmamalıdır.
- Token veritabanında plaintext tutulmamalıdır.
- API isteklerinde token, web'de mevcut cookie akışıyla veya `Authorization: Bearer <token>` header'ı ile; mobile'da yalnızca `Authorization: Bearer <token>` header'ı ile taşınır.

#### Kayıtlı kullanıcı modeli (yalnızca mobile, premium için)

Kullanıcı Supabase Auth ile giriş yapmıştır. Bu model **yalnızca mobile app'te** bulunur; web'de hiçbir login ekranı yoktur.

1. Mobile app açıldığında Supabase JWT oturumu geçerliyse doğrudan ilgili akışa yönlenir.
2. Oturum yoksa, kullanıcı premium satın almak veya geçmiş oyunlarını görmek istediğinde login ekranı açılır.
3. Yeni oluşturulan odalar, login'li kullanıcı tarafından kurulduysa `user_id` ile hesaba bağlanır.
4. Kayıtlı kullanıcı kimliği Supabase JWT ile doğrulanır.
5. Premium hak (`is_premium`) ve oda kredisi (`room_credits`) bu hesap üzerinden yönetilir.

### 9.4 Partnerin (guest) tur akışı

1. Partner soruları sırayla görür.
2. Her soruda tek ekranda: önce kendi cevabını verir, sonra ilk kullanıcının cevabını tahmin eder ve güven seviyesi ekler.
3. İlk kullanıcı turunu zaten bitirdiği için, partner her soruda anlık mikro-reveal görebilir.
4. Tüm sorular tamamlandığında status `guest_completed` olur.
5. İki taraf da turunu tamamladığı için sonuç hesaplama tetiklenir.

### 9.5 Sonucun açılması

1. İki taraf da turunu tamamladığında sonuç hesaplama tetiklenir.
2. Oda status'u `result_ready` olur.
3. İki taraf da sonuç ekranını görebilir.

Not: Birleştirilmiş tur sayesinde "ilk kullanıcının partneri ayrıca tahmin etmesi" gibi ek bir adım yoktur; her oyuncu tahminini kendi turunda zaten yapmıştır.

---

## 10. Soft Realtime Yaklaşımı

MVP'de tam canlı oyun yerine soft realtime kullanılacaktır. Bu yaklaşım hem web hem mobile için aynıdır.

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

Mobile'a özel: Soft realtime durum değişiklikleri (partner katıldı / tamamladı / sonuç hazır), mobile'da ayrıca **push notification** olarak tetiklenebilir.

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

Sonuç ekranı sert bir uyum testi gibi olmamalıdır. Odak "mükemmel eşleşme" değil, "birbirinizi ne kadar doğru okudunuz?" olmalıdır. Tüm kullanıcılarda (ücretsiz veya premium) sonuç hesaplama aynıdır; detaylı analiz, kategori kırılımı veya istatistik yoktur.

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

## 12. Monetizasyon (Yalnızca Mobile App)

> Üyelik ve premium satın alma sistemi **tamamen mobile app'e özeldir**. Web tarafında hiçbir satın alma, login veya premium UI'ı yoktur; web sadece kategori kilidinin görsel yansımasını gösterir (bkz. Bölüm 12.5), kullanıcının premium durumunu hiç sormaz veya bilmez.

### 12.1 Ücretsiz kullanım (web + mobile)

- Login gerekmez
- Tüm oyun modları
- Temel (premium olmayan) kategoriler sınırsız oynanabilir
- Basit sonuç ekranı
- Oda expire süresi: 24 saat
- Mobile'da: oda kurma için (henüz netleşmemiş, bkz. Bölüm 12.6) bir günlük limit olabilir; web'de oda kurma limiti yoktur

### 12.2 Premium paket — tek seferlik satın alma (yalnızca mobile)

Eski modeldeki zaman bazlı "3 günlük sınırsız oda hakkı" yaklaşımı **kaldırılmıştır**. Yerine:

- Kullanıcı mobile app üzerinden **tek seferlik** bir premium paket satın alır (App Store / Play Store IAP üzerinden).
- Satın alma, kullanıcının önce Supabase Auth ile kayıt olmasını gerektirir (e-posta/şifre, Google veya Apple).
- Satın alma sonucu **kalıcıdır** — süre dolmaz, tekrar ödeme gerekmez:
  - Tüm premium kategorilere erişim kalıcı olarak açılır.
  - Hesaba başlangıç **oda kredisi** (`room_credits`) tanımlanır.

### 12.3 Oda kredisi sistemi (yalnızca mobile)

- Premium kullanıcı her oda kurduğunda `room_credits` bir azalır.
- `room_credits` sıfırlandığında yeni oda kurma engellenir; kullanıcı **oda kredisi paketi** satın almaya yönlendirilir.
- Oda kredisi paketi, premium paketten ayrı, küçük tutarlı ve **tekrarlanabilir** bir satın almadır (App Store / Play Store IAP, consumable tipi).
- Premium paketin başlangıç kredisi miktarı ve oda kredisi paketinin boyutu/fiyatı **henüz belirlenmemiştir** (bkz. Bölüm 12.6).

### 12.4 Satın alma akışı (mobile)

1. Kullanıcı mobile app'i anonim olarak dener (login yok).
2. Premium kategoriye girmeye çalıştığında veya geçmiş oyunlarını görmek istediğinde önce login ekranına yönlenir.
3. Login olur (e-posta/şifre, Google veya Apple).
4. Premium paket satın alma ekranı gösterilir (App Store / Play Store IAP).
5. Satın alma tamamlanınca `is_premium = true` olur, başlangıç `room_credits` tanımlanır.
6. Premium kategoriler kalıcı olarak açılır.
7. Oda kredisi tükendiğinde, kredi paketi satın alma ekranına yönlendirilir.

Agresif satış, geri sayım, manipülatif metin veya ilişki baskısı kullanılmamalıdır.

### 12.5 Kategori sistemi ve platform davranışı (hem web hem mobile)

Kategori seçimi her iki platformda da vardır; davranış platforma göre farklılaşır:

| Durum | Web | Mobile (login'siz / premium değil) | Mobile (premium) |
|---|---|---|---|
| Temel kategori | Seçilebilir, oynanabilir | Seçilebilir, oynanabilir | Seçilebilir, oynanabilir |
| Premium kategori | Görünür, kilitli rozet; tıklanınca "Bu kategori sadece Game of Us mobile app'te açılır" mesajı + store linkine yönlendirme | Kilitli; tıklanınca login/satın alma akışına yönlendirme | Kalıcı açık |

Web'e giren bilgi, kullanıcının premium *durumu* değil, kategorinin *meta verisi* (`is_premium` flag'i kategori seviyesinde tanımlıdır, kullanıcı seviyesinde değil). Web hiçbir zaman "bu kullanıcı premium mu" sorusunu sormaz.

### 12.6 Henüz belirlenmemiş noktalar

Aşağıdaki değerler bilinçli olarak açık bırakılmıştır, ayrı bir görüşmede netleştirilecektir:

- Premium paketin fiyatı ve başlangıç `room_credits` miktarı.
- Oda kredisi paketinin boyutu (kaç kredi) ve fiyatı.
- Ücretsiz (mobile) kullanıcı için oda kurma limiti olup olmayacağı.
- IAP entegrasyon detayı (doğrudan App Store/Play Store API mi, RevenueCat gibi bir katman mı kullanılacağı).

### 12.7 Oda expire mantığı

| Oda tipi | Expire süresi | Başlangıç |
|---|---|---|
| Ücretsiz (anonim, web veya mobile) | 24 saat | Oda oluşturulduğunda |
| Premium kullanıcı tarafından kurulan oda | 24 saat (zaman bazlı ayrıcalık yoktur; tek fark kredi tüketimidir) | Oda oluşturulduğunda |

Expire kontrolü cron job ile değil, okuma anında hesaplanır: `expires_at < now()` ise oda inaktif sayılır. Veritabanında ayrı bir güncelleme işlemi yapılmaz.

---

## 13. Sayfa ve Ekran Gereksinimleri

### 13.1 Landing Page (web)

Amaç: Kullanıcının ürünü 10 saniyede anlamasını sağlamak.

İçerikler:

- Hero başlık
- Alt açıklama
- Oyun Başlat CTA
- Nasıl Çalışır bölümü
- Oyun modları bölümü
- Sonuç önizlemesi
- Mobile app indirme teaser'ı (premium kategoriler ve geçmiş oyunlar için)

Örnek metinler:

Başlık:

> Oyun oynayarak birbirinizi daha iyi tanıyın.

Alt başlık:

> Game of Us, iki kişinin birbirini tahmin edip daha iyi tanıması için tasarlanmış kısa ve eğlenceli oyunlar sunar.

CTA:

> Oyun Başlat

### 13.2 Create Game Screen (web + mobile)

Alanlar:

- İsmin
- Partner adı opsiyonel
- Oyun modu
- Kategori seçimi (temel kategoriler + kilitli premium kategoriler)
- Soru sayısı

Buton:

> Oyun linki oluştur

### 13.3 Share Link Screen (web + mobile)

İçerikler:

- Davet linki
- Linki kopyala
- WhatsApp ile paylaş
- Oda durumu
- Cevaplamaya başla butonu

### 13.4 Game Screens (web + mobile)

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

### 13.5 Waiting Screen (web + mobile)

İçerikler:

- Senin durumun (tamamlandı)
- Partner durumu (oynuyor)
- Birleştirilmiş tur sayesinde en fazla tek bekleme olduğunun belirtilmesi
- Sonuçların ne zaman açılacağı bilgisi
- Yumuşak progress görünümü
- Opsiyonel "linki tekrar gönder" butonu

### 13.6 Results Overview (web + mobile)

İçerikler:

- Okuma Skoru (yüzde olarak, büyük ve belirgin)
- Teşvik edici kısa bir metin ("Birbirinizi oldukça iyi okudunuz!")
- Detayları Gör butonu
- Tekrar Oyna butonu

### 13.7 Detailed Results (web + mobile)

İçerikler:

- Soru bazlı kartlar (her soru için: soru metni, iki cevap, sonuç etiketi, konuşma önerisi)
- Sonuç etiketi: "Doğru bildi" / "Yakın tahmin" / "Iskaladı"
- Konuşma önerisi her kart için gösterilir
- Puan, istatistik veya kategori kırılımı yoktur

### 13.8 Premium Unlock (yalnızca mobile)

İçerikler:

- Premium paket adı
- Paket faydaları (kalıcı kategori erişimi + başlangıç oda kredisi)
- Fiyat
- Satın alma CTA (IAP)

### 13.9 Oda Kredisi Satın Alma (yalnızca mobile, yalnızca premium kullanıcı)

İçerikler:

- Kalan kredi bilgisi
- Kredi paketi seçenekleri
- Satın alma CTA (IAP)

### 13.10 Signin / Signout (yalnızca mobile)

İçerikler:

- E-posta/şifre, Google, Apple ile giriş
- Çıkış yap

### 13.11 Geçmiş Oyunlar (yalnızca mobile, yalnızca login'li kullanıcı)

İçerikler:

- Oyun listesi (tarih, partner adı, okuma skoru)
- Bir oyuna tıklayınca Detailed Results (13.7) açılır
- Yeni bir analiz/istatistik katmanı yoktur, var olan sonuç verisi gösterilir

### 13.12 Empty / Error States (web + mobile)

Durumlar:

- Geçersiz link
- Oda süresi doldu
- Partner henüz katılmadı
- Bağlantı koptu
- Sonuçlar henüz hazır değil
- Oyun zaten tamamlandı
- (Mobile) Oda kredisi yetersiz
- (Mobile) Bu kategori premium gerektiriyor

---

## 14. UX İlkeleri

- Login web'de hiçbir zaman zorunlu olmamalı; mobile'da yalnızca premium/geçmiş oyunlar için gereklidir.
- Link paylaşımı ana büyüme döngüsü olmalı (her iki platformda).
- Kullanıcı oyunu 10 saniyede anlamalı.
- Seçenekler büyük ve dokunulabilir olmalı.
- Cevaplar reveal aşamasına kadar gizli kalmalı.
- Her soru tek ekranda tamamlanmalı; cevap ve tahmin için oda içinde ileri-geri geçiş olmamalı.
- Akış kısa hissettirmeli; oyuncu mümkün olduğunca az bekleme ve az tıklama ile oynamalı.
- Anlık mikro-reveal mümkünse kullanılmalı, ancak partner verisi yoksa akışı bloke etmemeli.
- Güven seviyesi seçimi akışı uzatmamalı; tek dokunuşla seçilebilmeli.
- Ton sıcak, yumuşak ve yargılayıcı olmayan bir dilde olmalı.
- "Mükemmel eşleşme", "ilişkiniz kötü" gibi teşhis edici metinlerden kaçınılmalı.
- Sonuçlar kullanıcıyı konuşmaya teşvik etmeli.
- Mobil kullanım öncelikli olmalı.
- Masaüstü kullanımda ekran dar mobil görünüm gibi kalmamalı.
- Premium kilidi web'de asla agresif veya engelleyici hissettirmemeli; bilgilendirici bir yönlendirme olmalı.

---

## 15. Responsive Tasarım Gereksinimleri (Web)

### Mobil tarayıcı

- Tek kolon
- Büyük seçim kartları
- Alt CTA sticky olabilir
- Progress üstte gösterilmeli
- Kartlar tam genişliğe yakın olmalı
- Uzun Türkçe, İngilizce ve İspanyolca metinler taşmamalı (İspanyolca genellikle TR/EN'den daha uzun metin üretir, kart ve buton genişlikleri buna göre test edilmeli)

### Masaüstü

- 1200–1400px genişlik mantığı
- 2 veya 3 kolon kullanılmalı
- Sol panel: adımlar / ilerleme / mod bilgisi
- Orta panel: ana soru kartı
- Sağ panel: partner durumu / oda bilgisi
- Büyük boş yan alanlar bırakılmamalı

> Native mobile app tasarım gereksinimleri ayrı bir teknik ekte (PRD Eki — Mobile Genişleme) tanımlanmıştır.

---

## 16. Teknik Mimari

### Genel yaklaşım

Web ve mobile, **ayrı kod tabanları** olarak geliştirilir, **ortak Supabase backend**'e bağlanır. Web'in mevcut Next.js API route'ları, mobile'dan da `Authorization: Bearer <token>` header'ı ile çağrılabilir (CORS desteğiyle). Web'in kendi davranışı bu değişiklikten etkilenmez.

### Dil Desteği (TR / EN / ES — hem web hem mobile)

Üç dil desteği, premium gibi platforma özel bir ayrım değildir; web ve mobile aynı dil mantığını paylaşır.

**Kapsam:**

- Arayüz metinleri (buton, başlık, hata mesajları, vb.) üç dilde çevrilir.
- Soru bankası içeriği üç dilde, **elle hazırlanmış/uyarlanmış** olarak hazırlanır — otomatik (runtime) çeviri API'si kullanılmaz. Gerekçe: ürünün tonu sıcak ve doğal olmalı (bkz. Bölüm 14 UX İlkeleri); makine çevirisi bu tonu zedeleyebilir. Ayrıca bazı sorular/kategoriler kültüre özgü farklılaşabilir (bkz. Bölüm 20), bu da otomatik çeviriyle uyumsuzdur.
- Çeviri/uyarlama bir kerelik içerik üretim işidir (örn. Claude ile birlikte TR sorulardan EN/ES setleri üretilir, gerekirse kültürel uyarlama yapılır), sonrası sabit bir soru bankası olarak veritabanına yazılır. Runtime'da hiçbir çeviri servisi çağrılmaz.

**Dil seçim mekanizması (arayüz dili — oturum/cihaz bazlı):**

- Varsayılan dil, tarayıcı/cihaz dilinden otomatik algılanır (web: `Accept-Language` header; mobile: `expo-localization` ile cihaz locale'i).
- Algılanan dil TR/EN/ES dışındaysa, varsayılan olarak İngilizce gösterilir.
- Kullanıcı istediği zaman manuel olarak dil değiştirebilir (web: sağ üstten dil seçici, otomatik algılamayı geçersiz kılar; mobile: cihaz dili).
- Web'de dil tercihi URL prefix'i (`/tr`, `/en`, `/es`) ile; mobile'da cihaz içi tercih olarak saklanır.
- Bu, kullanıcının landing page ve genel gezinme deneyiminde gördüğü dildir — oda kurmadan/girmeden önceki haldir.

**Oda dili (oyun içeriği — oda bazlı, sabit):**

- Bir oda kurulduğu anda, owner'ın **o anki arayüz dili** odaya sabitlenir (`rooms.locale`). Örneğin owner web'de sağ üstten İngilizce seçmişse ve "Oyun linki oluştur" derse, oda `locale = 'en'` olarak kurulur.
- Guest linke girdiğinde, **kendi cihaz/tarayıcı dili ne olursa olsun**, girdiği odanın diline tabi olur — hem arayüz (buton, başlık, mikro-reveal metinleri) hem soru içeriği guest'e de odanın diliyle gösterilir.
- Bu kural sayesinde bir odadaki tüm soru ve cevap verisi **tek bir dile sabit** kalır; aynı anlamsal sorunun iki farklı dilde eşleştirilmesi gibi bir senaryo hiç oluşmaz (bkz. Bölüm 17 — veri modeli, `question_id` artık düz FK'dır).
- Sonuç ekranı, geçmiş oyunlar gibi oda-sonrası görünümler de oda diliyle gösterilir.

### Önerilen teknoloji stack

**Web (mevcut, stabil):**

- Next.js
- TypeScript
- Tailwind CSS
- Stitch (arayüz tasarımı)
- next-intl (TR/EN/ES çoklu dil desteği)

**Mobile (yeni):**

- Expo / React Native
- TypeScript
- NativeWind
- Expo Router
- expo-secure-store (token saklama)
- expo-localization + i18n-js (veya benzeri) — TR/EN/ES çoklu dil desteği

**Backend (ortak):**

- Supabase
  - Postgres
  - Realtime (yalnızca `rooms.status` ve `participants.status` için)
  - Supabase Auth (yalnızca mobile premium/login akışı için)
- Next.js server-side API route / server action
  - Oda oluşturma
  - Cevap ve tahmin kaydetme
  - Sonuç hesaplama
  - Token doğrulama
  - (Bu route'lar mobile'dan da çağrılır; web'in deploy durumuna bağımlılık bilinçli bir mimari karardır, bkz. PRD Eki)

**Deploy:**

- Web: Vercel
- Mobile: Expo Application Services (EAS) ile App Store / Play Store

**Auth:**

- Ücretsiz oyun (web + mobile) anonimdir; login gerekmez.
- Anonim oyuncular `participant_token` ile tanınır.
- Token ham hali client tarafında saklanır (web: localStorage; mobile: expo-secure-store); DB'de yalnızca `token_hash` tutulur.
- Supabase Auth yalnızca mobile'da, premium satın almak ve geçmiş oyunları görmek isteyen kullanıcılar için zorunludur.
- Supabase Auth seçenekleri: E-posta/şifre, Google OAuth, Apple OAuth.

**Ödeme:**

- Mobile App Store / Play Store IAP (tek seferlik premium paket + tekrarlanabilir oda kredisi paketi).
- Lemon Squeezy veya başka bir web ödeme sağlayıcısı **kullanılmaz** — premium tamamen mobile'a özel olduğu için web'de ödeme entegrasyonu yoktur.

### Server-side işlem yaklaşımı

Sonuç hesaplama ve token doğrulama gibi işlemler Next.js API route / server action ile yapılır; bu mantık değişmemiştir. Mobile'a özel mantık (premium kontrolü, oda kredisi düşürme, geçmiş oyun sorgusu) bu route'lara eklenebilir veya ayrı route'lar olarak yazılabilir — bu karar mobile geliştirme sırasında netleştirilecektir.

Kural:

> Cevap, tahmin, sonuç, premium hak ve oda kredisi gibi kritik işlemler client-only hesaplamaya bırakılmamalıdır. Bu işlemler server-side doğrulanmalıdır.

### Realtime kapsamı

Supabase Realtime yalnızca soft realtime durum güncellemeleri için kullanılmalıdır (web + mobile için aynı):

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

---

## 17. Veri Modeli Taslağı

### `users`

Yalnızca mobile'da Supabase Auth ile giriş yapan (premium/geçmiş oyun erişimi olan) kullanıcılar için.

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Kullanıcı ID (Supabase Auth UID) |
| email | text | E-posta adresi |
| is_premium | boolean | Premium paketi satın aldı mı (kalıcı, süresi yoktur) |
| room_credits | int | Kalan oda kurma hakkı (premium kullanıcı için) |
| created_at | timestamptz | Kayıt zamanı |

### `rooms`

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Oda ID |
| room_code | text | Paylaşılabilir kısa kod; tahmin edilmesi zor olmalıdır |
| status | text | Oda durumu |
| game_mode | text | secret_choice / prediction / orderline / mixed |
| category_id | uuid | Seçilen kategori — `categories` tablosunda `locale = rooms.locale` olan satıra doğrudan referans (düz FK; dil zaten odaya sabit olduğu için çözümleme gerekmez) |
| question_count | int | Seçilen soru sayısı |
| owner_id | uuid | Odayı oluşturan participant |
| user_id | uuid | Kayıtlı (login'li mobile) kullanıcı ID; anonim odalar için null |
| max_participants | int | Varsayılan 2 |
| join_locked | boolean | Oda dolduktan sonra yeni katılımı kapatmak için |
| locale | text | tr / en / es — owner'ın oda kurduğu andaki arayüz dili; oda kurulduktan sonra **değişmez**. Guest, kendi cihaz dili ne olursa olsun bu dile tabi olur (bkz. Bölüm 16). |
| created_at | timestamptz | Oluşturulma zamanı |
| expires_at | timestamptz | Oda geçerlilik süresi (24 saat) |

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

### `categories`

Kategori adları da dil bazlıdır (örn. "İletişim" / "Communication" / "Comunicación"), bu yüzden `categories` da `questions` ile aynı satır-bazlı locale yapısını kullanır.

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Kategori ID |
| slug | text | Dil bağımsız kod kimliği (örn. `communication`, `bold_questions`) — bir kategorinin TR/EN/ES satırlarını birbirine bağlar |
| name | text | Görünen ad, `locale` alanına göre o dildeki karşılığı |
| locale | text | tr / en / es |
| is_premium | boolean | Bu kategori premium kilitli mi (slug bazında tüm dillerde aynı olmalı) |
| sort_order | int | Sıralama |

Önerilen constraint/index:

```sql
unique(slug, locale)
```

Kural:

- Bir kategorinin `is_premium` durumu, aynı `slug`'a sahip tüm dil satırlarında **aynı** olmalıdır (örn. "Cesur Sorular" TR'de premium ise, "Bold Questions" EN'de de premium olmalıdır). Bu, server-side kontrol veya basit bir veri tutarlılığı kuralıyla garanti edilir.

### `questions`

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Soru ID |
| mode | text | secret_choice / prediction / orderline |
| category_id | uuid | categories tablosuna referans (ilgili dildeki kategori satırı) |
| question_text | text | Soru metni, `locale` alanındaki dilde |
| locale | text | tr / en / es |
| translation_group_id | uuid (nullable) | Aynı sorunun farklı dillerdeki karşılıklarını birbirine bağlamak için opsiyonel grup kimliği. Kültüre özgü, karşılığı olmayan sorularda null bırakılabilir. |
| is_active | boolean | Aktiflik |
| created_at | timestamptz | Oluşturulma zamanı |

Kural:

- Her dil için ayrı satır vardır (sütun bazlı değil); bu, yeni bir dil eklemeyi şema değişikliği gerektirmeden mümkün kılar.
- Sorular dilden dile birebir çeviri olmak zorunda değildir; bazı sorular/kategoriler kültüre özgü olarak farklılaşabilir (bkz. Bölüm 20). Bu durumda `translation_group_id` null bırakılır veya o dile özel yeni bir soru farklı bir `translation_group_id` ile eklenir.
- Soru içeriği **otomatik çeviri API'siyle üretilmez**; bir kerelik, elle hazırlanmış/uyarlanmış içerik olarak veritabanına yazılır (bkz. Bölüm 16 — Dil Desteği).

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

Oda tek bir dile sabit olduğu için (bkz. Bölüm 16, `rooms.locale`), bir odadaki soru sırası doğrudan `questions.id`'ye (o dildeki satıra) referans verir. Çift-locale çözümlemeye gerek yoktur.

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | ID |
| room_id | uuid | Oda ID |
| question_id | uuid | `questions` tablosuna düz referans; `questions.locale = rooms.locale` olan satırlardan seçilir |
| round_order | int | Oyun içindeki sıra |

Önerilen constraint/index:

```sql
unique(room_id, round_order)
unique(room_id, question_id)
```

Kural:

- Oda kurulurken (owner'ın seçtiği kategori + soru sayısına göre), `categories` ve `questions` tablolarından **doğrudan `rooms.locale` diline ait** satırlar seçilip `room_questions`'a yazılır.
- Guest aynı odaya girdiğinde, kendi cihaz dili ne olursa olsun bu sabit listeyi (oda dilinde) görür.
- `translation_group_id` (bkz. `questions` tablosu) yalnızca **soru bankası içerik yönetimi** için kullanılır — örn. "TR'deki bu soru, EN'deki hangi soruya karşılık geliyor" bilgisini tutmak için. Oyun akışında veya cevap eşleştirmede kullanılmaz, çünkü artık tüm oda zaten tek dile sabit.

### `answers`

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Cevap ID |
| room_id | uuid | Oda ID |
| question_id | uuid | `room_questions.question_id` — düz FK, oda dilindeki soru |
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
- Oda tek dile sabit olduğu için (bkz. Bölüm 16), owner ve guest her zaman aynı `question_id`'ye cevap verir; çift-locale eşleştirme mantığına gerek yoktur.

### `predictions`

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Tahmin ID |
| room_id | uuid | Oda ID |
| question_id | uuid | `room_questions.question_id` — düz FK, oda dilindeki soru |
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
- Geçmiş oyunlar sekmesi (mobile), bu tabloyu `rooms.user_id` üzerinden sorgular; ek bir tablo gerekmez.

### `purchases`

Mobile IAP satın almaları için (eski `payments` tablosunun yerini alır).

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Purchase ID |
| user_id | uuid | Satın alan kayıtlı kullanıcı |
| product_type | text | premium_package / room_credit_pack |
| provider | text | app_store / play_store |
| provider_transaction_id | text | Store işlem ID'si; idempotency için |
| amount | numeric | Tutar |
| currency | text | Para birimi |
| status | text | pending / completed / failed / refunded |
| created_at | timestamptz | Oluşturulma zamanı |

Önerilen constraint/index:

```sql
unique(provider_transaction_id)
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

---

## 18. Güvenlik ve Gizlilik

### Kimlik doğrulama modelleri

**Anonim model (ücretsiz oyun — web + mobile):**

- Kullanıcı hesabı gerekmez.
- Kimlik doğrulama yalnızca isim eşleştirmesine bırakılmaz.
- Owner ve guest rolleri `participant_token` ile doğrulanır.
- Token'ın ham değeri client tarafında saklanır (web: localStorage; mobile: expo-secure-store).
- Veritabanında ham token değil, `token_hash` tutulur.
- Display name yalnızca kullanıcıyı ekranda göstermek için kullanılır.
- Farklı cihazdan aynı ismi giren kişi otomatik owner olarak kabul edilmez.
- Aynı cihazdan geri dönen oyuncu token ile kaldığı yerden devam eder.

**Kayıtlı kullanıcı modeli (yalnızca mobile, premium/geçmiş oyunlar için):**

- Supabase Auth ile kimlik yönetilir; oturum Supabase JWT token ile korunur.
- E-posta/şifre, Google OAuth veya Apple OAuth ile giriş yapılabilir.
- Kayıtlı kullanıcının kurduğu odalar `user_id` ile ilişkilendirilir.
- Premium hak `users.is_premium` ve oda kredisi `users.room_credits` alanlarıyla kontrol edilir.

### Genel kurallar

- Oda linki tahmin edilemeyecek kadar güçlü olmalıdır.
- `room_code` kısa gösterilebilir; ancak brute force'a açık olmamalıdır.
- Token URL query parametresinde taşınmamalıdır.
- Ücretsiz ve premium kullanıcıların kurduğu odalar aynı public link yapısını kullanır; erişim modeli kullanıcının token/JWT durumuna göre belirlenir.
- Cevaplar reveal öncesi karşı taraf tarafından okunamamalıdır.
- Sonuçlar yalnızca ilgili oda katılımcıları tarafından görüntülenmelidir.
- Oda 24 saat sonra inaktif olmalıdır.
- Expire kontrolü okuma anında `expires_at < now()` ile yapılır; cron job gerekmez.
- Hassas ilişki verileri üçüncü tarafla paylaşılmamalıdır.
- Analytics event'lerinde bireysel cevap içeriği tutulmamalıdır.
- Web, hiçbir API isteğinde kullanıcının premium durumunu sormaz veya taşımaz; bu bilgi tamamen mobile + Supabase arasında kalır.

### Cevap gizliliği ve reveal kuralları

- Partnerin gerçek cevabı, tahmin kilitlenmeden önce hiçbir şekilde client'a dönmemelidir.
- Mikro-reveal yalnızca oyuncu kendi cevabını ve tahminini kilitledikten sonra hesaplanabilir.
- Mikro-reveal sadece ilgili soru için "doğru / yakın / ıskaladı" gibi türetilmiş sonucu gösterebilir.
- Mikro-reveal, partnerin tüm cevaplarını veya henüz oynanmamış sorulara ait bilgileri açığa çıkarmaz.
- Sonuç ekranı yalnızca oda `result_ready` durumuna geçtiğinde açılır.

### RLS ve veri erişim kuralları

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
- Login'li kullanıcı yalnızca kendi `user_id` ile ilişkili odaları ve geçmiş sonuçlarını yönetebilir/görebilir.

### Abuse / spam kontrolü

Anonim oyun oluşturma login gerektirmediği için kötüye kullanım riski vardır. İlk MVP'de basit limitlerle başlanmalıdır.

Önerilen başlangıç limitleri:

- Aynı IP veya IP hash için saatte maksimum 10 oda oluşturma
- Aynı IP veya IP hash için günde maksimum 50 oda oluşturma
- Aynı oda için maksimum 2 participant
- Oda dolduktan sonra `join_locked = true`
- Çok sık join denemelerinde geçici bloklama

### Veri saklama ve gizlilik

- Tüm oda verileri 24 saat sonra inaktif sayılır.
- MVP'de fiziksel silme cron job'u zorunlu değildir.
- İleride veri minimizasyonu için belirli aralıklarla eski anonim odaların temizlenmesi eklenebilir.
- Analytics tarafında soru/cevap içeriği değil, event seviyesinde davranış metrikleri tutulmalıdır.

---

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
- Web → mobile app indirme dönüşüm oranı (premium kategori kilidi üzerinden)

### Gelir metrikleri (mobile)

- Premium paket görüntülenme → satın alma dönüşüm oranı
- Oda kredisi tükenme → kredi paketi satın alma dönüşüm oranı
- Kullanıcı başı gelir
- Premium kullanıcı başına ortalama oda kurma sayısı

### İlk MVP başarı kriteri

İlk 100 oda için hedefler:

- En az %50 partner katılımı
- En az %35 tamamlanan oyun oranı
- En az %5 mobile app indirme niyeti (web'deki kilitli kategori üzerinden)

---

## 20. İlk Soru Kategorileri

> **Dil ve çeviri notu:** Aşağıdaki sorular TR olarak listelenmiştir; bu, soru bankasının ilk yazıldığı dildir. EN ve ES setleri bunlardan **elle uyarlanır** (otomatik çeviri değil, bkz. Bölüm 16). Çoğu soru üç dilde birebir anlam taşıyacak şekilde çevrilebilir (örn. "Her gün mesajlaşmak senin için önemli mi?" → "Is it important for you to text every day?" → "¿Es importante para ti enviar mensajes todos los días?"). Ancak bazı sorular/kategoriler kültüre özgü olabilir — bu durumlarda birebir çeviri yerine, o dil/kültür için doğal ve anlamlı bir soru yazılır ve `translation_group_id` boş bırakılır (bkz. Bölüm 17).

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

> Not: Bu kategorilerin hangilerinin premium olacağı (`categories.is_premium`) henüz belirlenmemiştir. Yeni, daha "cesur" veya "derin" kategoriler premium olarak eklenebilir. Bir kategori premium statüsü, o kategorinin TR/EN/ES tüm dil satırlarında aynı olmalıdır (bkz. Bölüm 17).

---

## 21. Geliştirme Fazları

### Faz 1 — Web MVP (tamamlandı, stabil)

- Landing
- Oda oluşturma
- Secret Choice modu
- Link paylaşımı
- Guest join (anonim participant token ile)
- Owner/guest token üretimi ve token hash saklama
- Birleştirilmiş tur akışı
- Soft realtime status
- Mikro-reveal
- Sonuç hesaplama (server-side endpoint)
- Sonuç ekranı
- Soru bankası: 50 soru (TR)
- Temel RLS / server-side veri erişim kontrolleri
- Temel abuse/rate limit kontrolü
- Arayüz dil desteği: TR/EN (next-intl)

### Faz 2 — Web Genişletme (kategori sistemi + üç dil)

- `categories` tablosu (locale bazlı) ve `questions` tablosu (locale bazlı, `translation_group_id` ile); `room_questions`/`answers`/`predictions` düz `question_id` FK ile migration
- Soru bankasının EN ve ES setlerinin hazırlanması (elle uyarlama, bkz. Bölüm 16/20) ve veritabanına eklenmesi
- Arayüz dil desteğine İspanyolca eklenmesi (next-intl, üçüncü locale)
- Create Game Screen'e kategori seçimi UI'ı
- Premium kategori kilidi (görsel) + mobile app'e yönlendirme
- API route'larının CORS + Bearer token desteğiyle mobile'a açılması

### Faz 3 — Mobile MVP

- Expo proje kurulumu
- Supabase client + anonim participant_token akışı (expo-secure-store)
- Web API route'larına bağlanan API client
- Tüm oyun ekranları (Secret Choice, birleştirilmiş tur, sonuç)
- Mobile arayüz dil desteği (TR/EN/ES, expo-localization + i18n-js)
- Deep linking (universal link + custom scheme)
- Signin / Signout (Supabase Auth)
- Premium satın alma akışı (IAP)
- Oda kredisi sistemi
- Geçmiş oyunlar sekmesi
- Push notification

### Faz 4 — İleri Özellikler

- Prediction modu
- Orderline modu
- Karma oyun
- PWA install prompt (web)
- AI destekli soru önerileri
- Admin panel
- Eski anonim odalar için otomatik veri temizleme job'u
- HttpOnly cookie tabanlı token saklama hardening'i (web)
- Gerekirse Supabase Edge Function'a geçiş (web deploy bağımlılığını azaltmak için)
- Dördüncü+ dil ekleme (yapı zaten satır-bazlı olduğu için şema değişikliği gerektirmez)

---

## 22. Açık Kararlar

| Karar | Sonuç |
|---|---|
| Domain | .app uzantısı hedefleniyor (gameofus.app), kesinleşmedi |
| Token mimarisi | Anonim kullanıcılar için owner/guest `participant_token` üretilecek; DB'de yalnızca `token_hash` tutulacak |
| Owner tanıma | Owner yalnızca token/JWT ile tanınır; isim eşleştirmesi owner olmak için yeterli değildir |
| Guest tanıma | Guest ilk katılımda token alır; aynı cihazdan token ile devam eder |
| Token saklama | Web: localStorage (hardening'de HttpOnly cookie); Mobile: expo-secure-store |
| Auth | Supabase Auth yalnızca mobile'da premium/geçmiş oyun akışında zorunlu; ücretsiz oyun (her iki platform) anonimdir |
| **Premium modeli** | **Tek seferlik satın alma → kalıcı kategori erişimi + oda kredisi; zaman bazlı model kaldırıldı** |
| **Ödeme sağlayıcısı** | **Mobile App Store / Play Store IAP; Lemon Squeezy kullanılmıyor** |
| **Premium kapsamı** | **Yalnızca mobile; web hiçbir premium/login mantığı barındırmaz** |
| Premium paket fiyatı / başlangıç kredisi | Henüz belirlenmedi |
| Oda kredisi paketi boyutu / fiyatı | Henüz belirlenmedi |
| Sonuç hesaplama | Server-side endpoint üzerinden yapılır |
| Realtime kapsamı | Sadece oda/participant status güncellemeleri; answers/predictions realtime'a açılmaz |
| Oda expire | 24 saat (tüm odalar için, premium ayrımı yok) |
| Abuse kontrol | Anonim oda oluşturma için IP/IP-hash bazlı temel rate limit uygulanır |
| RLS / veri gizliliği | Partner cevapları reveal öncesi okunamaz; kritik işlemler server-side doğrulanır |
| Mobile-Web API bağımlılığı | Mobile, web'in Next.js API route'larına bağlanır; web deploy durumuna bağımlılık bilinçli kabul edilmiştir, ileride Edge Function'a geçiş değerlendirilebilir |
| **Dil kapsamı** | **TR / EN / ES — hem web hem mobile için ortak, platforma özel değil** |
| **Soru çevirisi yöntemi** | **Elle hazırlanmış/uyarlanmış içerik; otomatik çeviri API'si kullanılmaz** |
| **Soru bankası veri yapısı** | **Satır bazlı (`locale` alanı ile), sütun bazlı değil — yeni dil eklemek şema değişikliği gerektirmez** |
| **Kültüre özgü soru farklılaşması** | **İzin verilir; `translation_group_id` opsiyoneldir, birebir karşılığı olmayan sorular bağımsız satır olarak eklenebilir** |
| Dil seçimi | Varsayılan: tarayıcı/cihaz dilinden otomatik algılama (Accept-Language / expo-localization); kullanıcı manuel değiştirebilir (arayüz dili, oturum bazlı) |
| **Oda dili modeli** | **Oda, owner'ın kurduğu andaki arayüz diline sabitlenir (`rooms.locale`); guest kendi cihaz dili ne olursa olsun odanın diline tabi olur (hem arayüz hem soru içeriği). Çift-locale çözümleme veya `question_ref` mantığına gerek yoktur — `room_questions`/`answers`/`predictions` düz `question_id` FK kullanır.** |
| Soru bankası | 50 soru (TR), EN ve ES setleri Faz 2'de elle uyarlanacak, seeds dosyasından migration ile insert edilir |

---

## 23. Başarı Tanımı

MVP başarılı sayılacaktır eğer:

- Kullanıcılar app indirmeden web'den linkle kolayca oyuna başlayabiliyorsa
- Partner katılım oranı anlamlı seviyedeyse
- Oyunun tamamlanma oranı yüksekse
- Sonuç ekranı kullanıcıda konuşma başlatıyorsa
- Kullanıcılar oyunu başka birine göndermek istiyorsa
- Web'deki kilitli premium kategoriler, mobile app indirme niyeti yaratıyorsa
- Mobile'da premium satın alma niyeti veya dönüşümü oluşuyorsa

---

## 24. Özet

Game of Us, iki kişinin birbirini tahmin ederek ve cevapları birlikte açarak daha iyi tanımasını sağlayan link bazlı bir uygulamadır. Web'de stabil bir MVP olarak çalışır; mobile app, aynı oyun deneyimini native bir katmanla (push notification, geçmiş oyunlar, premium kategoriler) genişletir.

Ücretsiz oyun, her iki platformda da tamamen anonimdir — link paylaşımı, iki kişilik oyun ve sonuç ekranı için kayıt gerekmez. Kayıt ve satın alma yalnızca mobile app'te, premium kategorilere kalıcı erişim ve oda kredisi almak isteyen kullanıcıdan istenir.

Ürünün en kritik varsayımı teknik değil, davranışsaldır:

> İnsanlar partnerine veya yakın olduğu bir kişiye bu oyun linkini göndermek isteyecek mi?

MVP'nin temel amacı bu varsayımı hızlı, düşük maliyetli ve ölçülebilir şekilde test etmektir. Mobile genişleme, bu varsayım doğrulandıktan sonra ürünü derinleştirme ve sürdürülebilir gelir modeli kurma adımıdır.
