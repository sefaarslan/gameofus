# PRD — Game of Us


## 1. Ürün Özeti

**Ürün adı:** Game of Us
**Platform:** Web (Next.js, responsive/PWA-ready, `https://gameofus.app`) + Mobile (Expo/React Native — iOS & Android)
**Dil:** Türkçe, İngilizce ve İspanyolca — üçü de hem arayüz hem soru içeriği için desteklenir.
**Hedef cihaz:** Mobil öncelikli, masaüstü ve native mobile destekli
**Teknik yaklaşım:** Link bazlı oda oluşturma, asenkron akış, soft realtime durum güncellemeleri

Game of Us, iki kişinin — arkadaşlar, sevgililer ya da hayat arkadaşları — birbirini daha iyi tanıması için tasarlanmış kısa ve eğlenceli mini oyunlar sunan bir uygulamadır. Kullanıcılar bir oyun odası oluşturur ve oda kurarken aralarındaki bağı seçer (**Kanka / Sevgili / Hayat Arkadaşı**); linki karşı tarafa gönderir; her iki taraf da tek bir turda hem kendi cevabını verir hem de partnerinin cevabını tahmin eder. İki taraf da turunu tamamladığında sonuçlar açılır.

Oyun akışı, her soruda "cevapla + tahmin et" adımlarını tek ekranda birleştirir. Bu birleştirilmiş tur yaklaşımı, oda içinde ileri-geri geçişleri ve bekleme sürelerini azaltarak deneyimi belirgin biçimde kısaltır. Tahmin adımına eklenen güven seviyesi (tahmin / sanırım / eminim) ile oyun, basit bir soru-cevaptan küçük bir bahis-ve-keşif oyununa dönüşür.

> **Terminoloji:** Bu dokümanda "partner", oyundaki *karşı oyuncu* anlamında genel bir terimdir. Arayüzde bu kelime odanın ilişki türüne göre uyarlanır (Kanka / Sevgili / Hayat Arkadaşı; EN: friend / partner; ES: amigo / pareja).

**AI yorumu (mobile, yakında):** Oyuncuların yapılandırılmış cevaplarından, ilişki türünü de dikkate alan sıcak ve yargılayıcı olmayan bir yorum üretilmesi planlanır. Soru bankası bu yüzden cevabı bilgilendirici olan sorular (tercih, ödünleşme, davranış) etrafında kurulmuştur. Özellik henüz yayında değildir; web'de yalnızca "mobil uygulamada, yakında" olarak anlatılır.

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

### Birincil hedef kitle (üç ilişki türü eşit ağırlıkta)

- **Kanka** — yakın arkadaşlar (eğlence, mizah, paylaşılabilirlik; içerikte romantik çağrışım yoktur)
- **Sevgili** — yeni tanışanlar, flört aşamasındakiler ve sevgililer
- **Hayat Arkadaşı** — uzun süreli partnerler, birlikte yaşayanlar, evli çiftler

### İkincil hedef kitle

- Birbirini daha iyi tanımak isteyen iki kişi

### Kullanım senaryoları

- Akşam partnerle ya da bir arkadaşla eğlenceli bir aktivite yapmak
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
- Kısa, sıcak ve tekrar oynanabilir bir ikili aktivite (arkadaşlar ve çiftler için)

---

## 6. Temel Değer Önerisi

**Kısa oyunlar oynayın, birbirinizi daha iyi tanıyın.**

Kullanıcıya verilen temel değerler:

- App indirmeden linkle oynama (web)
- Karşı tarafı tahmin etme eğlencesi (arkadaşını, sevgilini ya da hayat arkadaşını)
- Sonuçlardan konuşma başlatma
- Yargılayıcı olmayan yumuşak sonuçlar
- Ücretsiz hızlı deneme
- Mobile app'te: geçmiş oyunları saklama, daha derin/özel soru kategorileri

---

## 7. MVP Kapsamı

### Web MVP'sinde olan özellikler (mevcut, canlıda)

1. Landing page (hero, 4 adımlı "Nasıl çalışır" — 4. adım AI yorum, mobil uygulama teaser'ı, footer + Instagram)
2. Oyun odası oluşturma (anonim, login gerekmez)
3. **İlişki türü seçimi: Kanka / Sevgili / Hayat Arkadaşı** (zorunlu; metinler ve kategoriler buna göre uyarlanır)
4. Karşı oyuncunun adını opsiyonel girme
5. Oyun modu seçimi — **dört mod: Secret Choice, Prediction, Orderline, Karma**
6. Soru sayısı seçimi (5 / 10)
7. Kategori seçimi (dropdown; varsayılan "Karışık Sürpriz"; ilişki türüne göre filtrelenir; premium kategoriler kilitli rozetle gösterilir — bkz. Bölüm 12.5)
8. Link oluşturma, kopyalama, WhatsApp ile paylaşma
9. Karşı tarafın linkten katılması (anonim guest token ile)
10. Birleştirilmiş tur: her soruda kendi cevabını verme + karşı tarafı tahmin etme (tek ekran)
11. Tahminlerde güven seviyesi seçimi (tahmin / sanırım / eminim)
12. Anlık mikro-reveal
13. Soft realtime durum ekranı
14. Sonuç hesaplama ve sonuç ekranı
15. **Geri bildirim:** sonuç ekranında isteğe bağlı mini anket + puansız çıkışta bir kez yumuşak istem (bkz. Bölüm 13.6, 19)
16. Üç dil (TR / EN / ES) — arayüz ve soru içeriği
17. **Solo oyun: Red Flag Mayın Tarlası** (bkz. Bölüm 8.5)
18. Temel hata ve boş durum ekranları

### Mobile MVP'sinde olan özellikler (yeni)

Web'deki tüm özelliklere ek olarak:

1. Signin / Signout (**Google + Apple — Supabase Auth**; mobilde tüm oyun için giriş zorunlu) ve hesap silme
2. Geçmiş oyunlar sekmesi (yalnızca sonuç görünümü)
3. Coin + tier modeli: Lite / Premium paketleri, kategori kilitleri (bkz. Bölüm 12.2)
4. Premium/Lite kategorilere kalıcı erişim
5. Coin bakiyesi (oda −250, AI yorum −100; kayıt bonusu +500, reklam +100)
6. **AI yorum** (sonuç ekranında, coin ile; bkz. Bölüm 12.3)
7. Push notification (partner katıldı / tamamladı / sonuç hazır)
8. Deep linking (oda linkleri hem web hem mobile'dan açılabilir; `gameofus.app` üzerinden universal link)

### MVP'de olmayacak özellikler (her iki platform)

- Chat
- Swipe / dating profili
- Public profil
- Sosyal feed
- Gelişmiş arkadaş listesi
- AI soru üretimi (kullanıcıya soru önerme/üretme; **AI yorum** ayrı bir mobil özellik olarak planlıdır, bkz. Bölüm 12 ve 21)
- Sonucu Instagram'da paylaşma (henüz yok; Instagram hesabı yalnızca takip bağlantısıdır)
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

### 8.5 Solo Oyun — Red Flag Mayın Tarlası (web canlı, mobil planlı)

İki kişilik oyun partner gerektirdiği için ilk denemede sürtünme yüksektir. Tek kişilik, ~2 dakikalık, paylaşılabilir bu oyun soğuk başlangıcı kırar ve kullanıcıyı mobil uygulamaya taşır.

- **Mekanik:** 3×3 kapalı kart; kartı açınca kurgusal bir durum görünür (ikinci tekil kişiyle: "Sevgilin…", "Arkadaşın…"); kullanıcı **Green / Yellow / Red Flag** seçer, kart kilitlenir; 9/9'da oyun biter. Oyun **sabit setlerle** oynanır: 54 aktif senaryo = 6 set × 9 kart (6 tema, 3 dilde). Kategoriler: Arkadaşlık (`friend-101…106`) ve Sevgili (`romantic-101…106`); webde 101-103 açık, 104-106 mobilde açılacak. Aynı setteki sonuçlar karşılaştırılabilir; web her sette 1 oyun.
- **Doğru cevap yoktur:** sonuç yalnızca **tolerans profili**dir: Green/Yellow/Red sayıları, tolerans eşiği `(green×2 + yellow)/18`, ve **Red sayısına (0-9) göre sabit bir başlık + tek cümlelik yorum** (merak uyandırıcı, hafif mizahi; ör. 0 → "Kırmızı bayrak mı? Hiç görmedim.", 5 → "Yarı yarıya şüpheci.", 9 → "Komple mayın arama ekibi."). Arketip sistemi kaldırılmıştır; yargı/teşhis dili yoktur.
- **Karne (ücretsiz):** sabit başlık + cümle, mini 3×3 ızgara + sayılar + tolerans çubuğu; **Story görseli** (1080×1920), **WhatsApp'ta paylaş** ve link önizlemesinde gönderenin karnesini gösteren paylaşım linki; **"Cevaplarına göz at"** kartı (9 kartın senaryosu ve seçilen bayrak, iki kişilik sonuçtaki "Detayları gör" gibi); geri bildirim kartı; sayfa sonunda "Ana sayfaya dön".
- **Web:** anonim, **1 oyun** (tekrar için mobil uygulamaya yönlendirme), coin yok; "AI ile derinlemesine analiz" butonu **pasif** ("Mobil uygulamada").
- **Mobil (planlı):** oyun başına **+20 coin** (oturum başına bir kez, sunucuda doğrulanır; günde en çok 3 ödüllü oyun), AI analizi **−100 coin** (Bölüm 12.3; 2 paragraf, mizahi/samimi, sınır ve tolerans eşiği odaklı, teşhis/"ayrıl-kal" tavsiyesi yok). Oyun girişinde isim/cinsiyet sorulmaz; AI için yalnızca (opsiyonel) ilk isim, senaryolar + bayraklar + tema etiketleri gider.
- **Konumlandırma:** oda oluşturma akışında bir mod **değildir** (link/partner/oda yok). Girişler: landing hero bağlantısı ve bölümü, footer, iki kişilik bekleme ve sonuç ekranlarında kapatılabilir kart; mobilde ana sayfa kartı (+20 coin rozeti, "bugün x/3").
- **Sonraki sürümler:** kalabalık yüzdeleri, "arkadaşına gönder, aynı 9 kartı o da oynasın ve karşılaştırın" köprüsü (solo → iki kişilik ana döngü), yeni solo oyunlar (`solo_*` tabloları `game` alanıyla genişlemeye hazır).

---

## 9. Ana Kullanıcı Akışı

### 9.1 Oda oluşturma akışı

1. Kullanıcı landing page'e gelir (web) veya app'i açar (mobile).
2. "Oyun Başlat" butonuna tıklar.
3. İsmini girer.
4. Karşı oyuncunun adını opsiyonel olarak girer (etiket ilişki türüne göre değişir).
5. **Aralarındaki bağı seçer: Kanka / Sevgili / Hayat Arkadaşı.** Seçilene kadar kategori alanı pasiftir.
6. Kategori seçer (ilişki türüne uygun kategoriler listelenir; varsayılan "Karışık Sürpriz"; premium kategoriler platforma göre farklı davranır — bkz. Bölüm 12.5).
7. Oyun modunu seçer.
8. Soru sayısını seçer.
9. "Oyun linki oluştur" butonuna tıklar.
10. Sistem oda oluşturur: oda dili ve ilişki türü sabitlenir; sorular, ilişki türüne uygun ücretsiz kategorilerden seçilir (bkz. Bölüm 20).
11. Kullanıcı link paylaşım ekranına yönlenir.

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

#### Anonim model (ücretsiz oyun — web; mobilde giriş zorunludur)

Web'de ücretsiz oyunda login gerekmez (mobilde her oyun için giriş zorunludur, ancak oda içi roller yine `participant_token` ile doğrulanır); ancak kimlik doğrulama yalnızca isim eşleştirmesine bırakılmaz. İsim, kullanıcıyı ekranda göstermek için kullanılır; gerçek oda rolü `participant_token` ile doğrulanır.

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

#### Kayıtlı kullanıcı modeli (yalnızca mobile)

Kullanıcı Supabase Auth ile (Google / Apple) giriş yapmıştır. Bu model **yalnızca mobile app'te** bulunur; web'de hiçbir login ekranı yoktur.

1. Mobile app açıldığında Supabase JWT oturumu geçerliyse doğrudan ilgili akışa yönlenir.
2. Oturum yoksa (ilk açılışta onboarding'den sonra) login ekranı açılır; giriş olmadan oyun oynanmaz.
3. Yeni oluşturulan odalar, login'li kullanıcı tarafından kurulduysa `user_id` ile hesaba bağlanır.
4. Kayıtlı kullanıcı kimliği Supabase JWT ile doğrulanır.
5. Tier ve coin bakiyesi bu hesap üzerinden, yalnızca sunucuda yönetilir (bkz. Bölüm 12.2).

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

### 12.1 Ücretsiz kullanım

- **Web:** Login gerekmez; tüm oyun modları; temel (premium olmayan) kategoriler sınırsız; basit sonuç ekranı; oda expire süresi 24 saat. Ücretsiz kullanıcı tarayıcı başına **bir oda** kurabilir (`localStorage` ile client-side UX katmanı; sunucu tarafı rate limit ayrıca geçerlidir). Limite takılan kullanıcı "mobil uygulamada daha fazlası" mesajını görür.
- **Mobile:** Her oyun için giriş zorunludur (anonim oyun yoktur). Oda kurmak coin harcar (12.2); kayıt bonusu ve reklam izleme ile coin kazanılır.

### 12.2 Coin + tier modeli (yalnızca mobile) — güncel karar

Eski "tek seferlik premium + oda kredisi" ve daha önceki "3 günlük hak" modelleri **yerini coin + tier modeline bırakmıştır** (ayrıntılı iş listesi: `gameofus-mobile/tasklist.md` B4/B5/C1/C2).

**Coin ekonomisi:**

| Olay | Coin |
|---|---|
| Kayıt bonusu | +500 |
| Ödüllü reklam izleme | +100 |
| Oda oluşturma | −250 (tüm kullanıcılar, premium dahil) |
| AI yorum açma | −100 (tüm kullanıcılar, premium dahil — maliyet öngörülebilirliği için bilinçli tercih) |

**Paketler (tek seferlik, consumable IAP — App Store / Play Store, RevenueCat):**

| Paket | Coin | Fiyat (taslak) | Kalıcı erişim |
|---|---|---|---|
| Lite | 2000 | ≈ $6.90 | Lite kategorileri |
| Premium | 5000 | ≈ $10.90 | Lite + Premium kategorileri (ör. Cesur Sorular) |

Kurallar:

- Paket **her satın almada coin ekler**; `tier` yalnızca **yükselir, asla düşmez** (`tier = max(mevcut, satın_alınan)`). Paket tekrar satın alınabilir.
- **Kategori erişimi coin ile açılmaz**, yalnızca paket (tier) ile: `categories.min_tier` (`free / lite / premium`) ≥ kullanıcı `tier`'ı ise kilitli. Kategori başına ayrı ödeme yoktur; mesajlaşma net olmalıdır: *"Bir kez satın al, [Lite/Premium] kategorilerine kalıcı olarak eriş."*
- **Restore Purchases** zorunludur (App Store): restore tier'ı geri yükler, coin'i **tekrar yüklemez** (coin tüketilebilirdir).
- App Store 3.1.1: fiyat/faturalama net gösterilir; Terms of Use ve Privacy Policy bağlantıları bulunur.
- Satın alma yalnızca sunucu doğrulamasıyla (`/api/iap/verify`) geçerli olur: `users` üzerinde coin artışı + `tier = GREATEST(mevcut, yeni)`; tüm hareketler `credit_transactions` audit tablosuna yazılır.

### 12.3 AI yorum (mobile, planlanan)

- Sonuç ekranında "100 coin ile aç" butonu (herkes için aynı). Coin yetersizse paket ekranına yönlendirilir.
- Sunucu `GET /api/rooms/[roomCode]/ai-commentary`: önce coin düşer, sonra LLM çağrısı yapılır; sonuç `results.ai_commentary`'e **cache'lenir** (aynı oda için tekrar ücret/maliyet yok).
- Girdi: oda ilişki türü, yapılandırılmış cevaplar (seçilen seçenek metni, sıralamalar) ve soruların `insight_tag`'leri. Serbest metin yoktur. İlişki türüne göre ton ayarlanır; ton sıcak ve yargılayıcı olmayan kalır, "uyum puanı/eşleşme" dili kullanılmaz.
- Gizlilik: cevaplar üçüncü taraf LLM'e gittiği için yayına almadan önce rıza/gizlilik metni netleştirilir (bkz. Bölüm 18).

### 12.4 Satın alma akışı (mobile)

1. Kullanıcı giriş yapar (Google / Apple); kayıt bonusu coin hesabına işlenir.
2. Oda kurar (−250 coin). Coin biterse reklam izleyerek (+100) ya da paket alarak coin kazanır.
3. Kilitli bir kategoriye girmeye çalışırsa paket ekranına yönlendirilir.
4. Paket satın alınır → sunucu doğrular → coin eklenir, `tier` yükselir, kategoriler kalıcı açılır.

Agresif satış, geri sayım, manipülatif metin veya ilişki baskısı kullanılmamalıdır.

### 12.5 Kategori sistemi ve platform davranışı (hem web hem mobile)

Kategori seçimi her iki platformda da vardır; davranış platforma göre farklılaşır:

| Durum | Web | Mobile (tier yetersiz) | Mobile (tier yeterli) |
|---|---|---|---|
| Temel kategori | Seçilebilir, oynanabilir | Seçilebilir, oynanabilir | Seçilebilir, oynanabilir |
| Premium kategori | Görünür, kilitli rozet; tıklanınca "Bu kategori yalnızca Game of Us mobil uygulamasında açılır" mesajı | Kilitli; tıklanınca paket ekranına yönlendirme | Kalıcı açık |

Web'e giren bilgi, kullanıcının premium *durumu* değil, kategorinin *meta verisi*dir (`is_premium` / `min_tier` kategori seviyesinde tanımlıdır, kullanıcı seviyesinde değil). Web hiçbir zaman "bu kullanıcı premium mu" sorusunu sormaz.

**İlişki türü filtresi (hem web hem mobile):** Kategori listesi seçilen ilişki türüne göre filtrelenir (`categories.relationship_types`). Örnekler: *Kanka Testi* yalnızca Kanka'da, *Romantizm* yalnızca Sevgili'de, *Ev & Para* yalnızca Hayat Arkadaşı'nda görünür; *İletişim, Yaşam Tarzı, Değerler* üçünde de görünür. Sunucu, seçilen kategorinin türe uygunluğunu doğrular.

**Cesur Sorular (premium, yalnızca Sevgili ve Hayat Arkadaşı):** Kanka'da hiç gösterilmez. Mobilde ek olarak (planlanan) her iki oyuncunun 18+ olması gerekir: oda kurulurken kurucunun ve karşı tarafın doğum tarihi alınır (`users.birth_date`, `rooms.partner_birth_date`); karar oda oluşturma anında tek ekranda verilir, karşı taraf katılırken ek yaş akışı yoktur. Web'de bu kategori kilitli olduğu için doğum tarihi **toplanmaz**. App Store: açık cinsel içerik yoktur ("cesur/romantik" çerçeve), yaş derecelendirmesi 17+ olarak ayarlanır.

### 12.6 Henüz belirlenmemiş noktalar

- Paket fiyatlarının yerel para birimi karşılıkları (TL/EUR vb.) ve nihai tutarlar.
- Reklam izleme için günlük üst sınır olup olmayacağı.
- AI yorum için LLM sağlayıcısı/modeli, maliyet tavanı ve rıza metni.
- Doğum tarihinin saklama süresi (oda ile birlikte silinmesi önerilir; oda 24 saatte expire olur).

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

- Hero başlık, alt açıklama, Oyun Başlat CTA ("+10k çift oynuyor" gibi doğrulanamayan sosyal kanıt **kullanılmaz**)
- Nasıl Çalışır bölümü — **4 adım**: Oda oluştur → Linki paylaş → Cevapları birlikte aç → **AI sizi yorumlasın** (4. adım "Mobil uygulamada" rozetiyle)
- Oyun modları bölümü
- Sonuç önizlemesi
- Mobil uygulama teaser'ı (AI yorum, premium kategoriler, geçmiş oyunlar, bildirim; "Yakında geliyor" + Instagram takip bağlantısı)
- Footer: logo, "Bizi Instagram'da takip et @gameofus.app", telif
- Hero rozeti kapsayıcıdır (ilişki odaklı değil, arkadaşları da kapsar); hiçbir yerde yalnızca çiftleri varsayan dil kullanılmaz

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
- Karşı oyuncunun adı (opsiyonel; etiket ilişki türüne göre: Kanka adı / Sevgili adı / Hayat arkadaşı adı)
- **İlişki türü** (3 kart: Kanka / Sevgili / Hayat Arkadaşı; zorunlu — seçilmeden buton pasif, kategori alanı pasif)
- Kategori seçimi (dropdown; varsayılan "Karışık Sürpriz"; ilişki türüne uygun kategoriler + kilitli premium kategoriler; kategoriler sayfa açılırken bir kez çekilip istemcide filtrelenir)
- Oyun modu
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
- Bölüm 2 — Karşı tarafı tahmin: aynı seçenekler, farklı vurgu rengi (başlık ilişki türüne göre: "Kankan / Sevgilin / Hayat arkadaşın ne cevap verir?")
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
- **Geri bildirim kartı (web):** "Oyunu nasıl buldun?" — 5 yüzle tek dokunuşta puan (dokunur dokunmaz kaydedilir); ardından isteğe bağlı "Mobil uygulamada AI yorumunu kullanır mıydın? (Evet / Belki / Hayır)" ve "Neyi değiştirirdin?" (≤ 500 karakter). Hepsi atlanabilir; teşekkür mesajıyla biter.
- **Çıkış istemi:** Puan vermeden "Tekrar Oyna" / "Ana Sayfa"ya basan kullanıcıya oda başına **bir kez** alttan açılan sheet (mobil) / ortalı kart (masaüstü): 5 yüz + "Şimdi değil". Arka plana dokunma, Escape ve "Şimdi değil" kullanıcıyı gitmek istediği yere götürür; ikinci basışta doğrudan gider. Anket zorunlu **değildir**.
- Tekrar Oyna butonu
- Sade Instagram takip bağlantısı (@gameofus.app); paylaşma/etiketleme çağrısı yoktur (özellik henüz yok)

### 13.7 Detailed Results (web + mobile)

İçerikler:

- Soru bazlı kartlar (her soru için: soru metni, iki cevap, sonuç etiketi, konuşma önerisi)
- Sonuç etiketi: "Doğru bildi" / "Yakın tahmin" / "Iskaladı"
- Konuşma önerisi her kart için gösterilir
- Puan, istatistik veya kategori kırılımı yoktur
- Karşı tarafın etiketi ilişki türüne göre uyarlanır

### 13.8 Paket Ekranı — Lite / Premium (yalnızca mobile)

İçerikler:

- Lite ve Premium paket kartları (coin miktarı, fiyat, hangi kategorilere kalıcı erişim verdiği)
- Net mesaj: "Bir kez satın al, [Lite/Premium] kategorilerine kalıcı olarak eriş"
- Satın alma CTA (IAP), **Restore Purchases**, Terms of Use ve Privacy Policy bağlantıları

### 13.9 Coin Bakiyesi ve Yetersiz Coin (yalnızca mobile)

İçerikler:

- Profil menüsünde coin bakiyesi
- Coin yetersizse: reklam izle (+100) veya paket ekranına yönlendirme
- AI yorum için "100 coin ile aç" (bkz. Bölüm 12.3)

### 13.10 Signin / Signout (yalnızca mobile)

İçerikler:

- Google ve Apple ile giriş (Supabase Auth; e-posta kaydı yoktur)
- Çıkış yap, **hesabımı sil** (App Store 5.1.1(v) zorunluluğu)

### 13.11 Geçmiş Oyunlar (yalnızca mobile, yalnızca login'li kullanıcı)

İçerikler:

- Oyun listesi (tarih, partner adı, okuma skoru)
- Bir oyuna tıklayınca Detailed Results (13.7) açılır
- Yeni bir analiz/istatistik katmanı yoktur, var olan sonuç verisi gösterilir

### 13.12 Empty / Error States (web + mobile)

Durumlar:

- Geçersiz link
- Oda süresi doldu
- Karşı taraf henüz katılmadı
- Bağlantı koptu
- Sonuçlar henüz hazır değil
- Oyun zaten tamamlandı
- (Mobile) Coin yetersiz
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

- Varsayılan dil algılanır. **Web:** önce kullanıcının önceki tercihini tutan `NEXT_LOCALE` cookie'si, yoksa `Accept-Language` (q değerleri gözetilerek; bu, tarayıcı dilidir ve çoğu kullanıcıda işletim sistemi diliyle aynıdır); karar next-intl middleware'indedir (`proxy.ts`). **Mobile:** `expo-localization` ile cihaz locale'i.
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
- Fontlar self-host: Quicksand (`next/font`) ve yalnızca kullanılan ikonları içeren ~14 KB'lık Material Symbols alt kümesi (`npm run icons`); harici font isteği yoktur
- Next.js sürümü sabitlenir (16.2.6)

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

- Web: Vercel — fonksiyon bölgesi Supabase ile aynı (Frankfurt, `fra1`); alan adı `gameofus.app`. API route'larında bağımsız sorgular paralel çalıştırılır (bölgeler arası gidiş-dönüş maliyetini ve gecikmeyi azaltmak için)
- Mobile: Expo Application Services (EAS) ile App Store / Play Store

**Auth:**

- Ücretsiz oyun (web + mobile) anonimdir; login gerekmez.
- Anonim oyuncular `participant_token` ile tanınır.
- Token ham hali client tarafında saklanır (web: localStorage; mobile: expo-secure-store); DB'de yalnızca `token_hash` tutulur.
- Supabase Auth yalnızca mobile'dadır ve mobilde **tüm oyun için zorunludur** (anonim oyun yalnızca web'de vardır).
- Supabase Auth seçenekleri: **Google OAuth, Apple OAuth** (e-posta/şifre kaydı yoktur).

**Ödeme:**

- Mobile App Store / Play Store IAP (RevenueCat; Lite ve Premium paketleri consumable, her satın alma coin ekler ve tier'ı yükseltir — bkz. Bölüm 12.2).
- Lemon Squeezy veya başka bir web ödeme sağlayıcısı **kullanılmaz** — premium tamamen mobile'a özel olduğu için web'de ödeme entegrasyonu yoktur.

### Server-side işlem yaklaşımı

Sonuç hesaplama ve token doğrulama gibi işlemler Next.js API route / server action ile yapılır; bu mantık değişmemiştir. Mobile'a özel mantık (tier/coin kontrolü ve düşme, IAP doğrulama, AI yorum, geçmiş oyun sorgusu, hesap silme) bu route'lara eklenebilir veya ayrı route'lar olarak yazılabilir — bu karar mobile geliştirme sırasında netleştirilecektir.

Kural:

> Cevap, tahmin, sonuç, premium hak ve coin gibi kritik işlemler client-only hesaplamaya bırakılmamalıdır. Bu işlemler server-side doğrulanmalıdır.

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
| is_premium | boolean | Mevcut alan; planlanan `tier`'ın öncülü (kalıcı, süresi yoktur) |
| room_credits | int | Coin bakiyesi (mevcut alan adı; coin modeli için kullanılır) |
| tier | text (planlanan) | `free / lite / premium`; yalnızca yükselir (`max`) |
| birth_date | date (planlanan, nullable) | Yaş doğrulama/AI bağlamı; yalnızca mobil |

Planlanan: `credit_transactions` (user_id, delta, reason, created_at) — coin hareketleri için audit tablosu.
| created_at | timestamptz | Kayıt zamanı |

### `rooms`

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Oda ID |
| room_code | text | Paylaşılabilir kısa kod; tahmin edilmesi zor olmalıdır |
| status | text | Oda durumu |
| game_mode | text | secret_choice / prediction / orderline / mixed |
| relationship_type | text (nullable) | `friend` / `dating` / `partner` — oda kurulurken seçilen ilişki türü; oda kurulduktan sonra değişmez. Eski odalar ve henüz göndermeyen eski mobil build'ler için `null` (genel "partner" dili, tür filtresi uygulanmaz) |
| partner_birth_date | date (planlanan, nullable) | Yalnızca mobil, yaş doğrulama için; yalnızca bu oda için |
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
| relationship_types | text[] | Kategorinin göründüğü ilişki türleri (`friend` / `dating` / `partner`; en az bir eleman); varsayılan üçü |
| min_tier | text (planlanan) | `free / lite / premium` — coin+tier modelinde erişim eşiği |
| sort_order | int | Sıralama (ilişkiye özel kategoriler önce, ortaklar sonra, Cesur Sorular en sonda) |

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
| translation_group_id | uuid (nullable) | Aynı sorunun farklı dillerdeki karşılıklarını birbirine bağlamak için opsiyonel grup kimliği. v2 setinde tüm sorular üç dilde eşleşmiştir. |
| insight_tag | text (nullable) | AI yorumu için tema etiketi (ör. `conflict_style`, `love_language`); kullanıcıya görünmez. v2 sorularında dolu, eski sorularda null |
| is_active | boolean | Aktiflik — **sorular silinmez, pasife alınır** (cevap/oda geçmişi korunur) |
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

### `feedback`

Sonuç ekranı mini anketi. Yazma yalnızca token doğrulayan `POST /api/feedback` ile; RLS açık, policy yok.

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Kayıt ID |
| room_id / participant_id | uuid | Katılımcı başına oda başına tek kayıt (`unique(room_id, participant_id)`); önce puan, sonra AI ilgisi/yorum aynı satıra eklenir (upsert) |
| rating | smallint | 1–5 |
| wants_ai | text (nullable) | `yes / maybe / no` — "mobil uygulamada AI yorumunu kullanır mıydın?" |
| comment | text (nullable) | ≤ 500 karakter, serbest metin (cevap/tahmin içeriği saklanmaz) |
| locale, game_mode, relationship_type, platform | text | Oda meta verisi ve `web`/`mobile` |
| created_at, updated_at | timestamptz | |

**Metrik görünümleri** (`security_invoker`, `anon/authenticated` erişimi kapalı; `TEST-%` katılımcılı odalar hariç): `metrics_daily_funnel` (oda açılan → partner katılan → sonucu hazır olan + oranlar; mod/tür/dile göre), `metrics_participant_status`, `metrics_feedback_summary` (günlük ortalama puan, beğenen/beğenmeyen, AI ilgisi dağılımı).

### `solo_scenarios` ve `solo_sessions` (solo oyunlar)

Red Flag Mayın Tarlası için ayrı model (bkz. Bölüm 8.5; `questions` ile karıştırılmaz).

- `solo_scenarios`: `game` (`red_flag`), `scenario_key` (`tema:sıra`), `pack_key` + `pack_position` (set ve sıra), `translation_group_id`, `locale`, `scenario_text`, `insight_tag` (`boundaries | trust | communication | jealousy | money_lifestyle | respect`), `is_active`. `unique(game, scenario_key, locale)`. Senaryolar silinmez, pasife alınır.
- `solo_sessions`: `game`, `locale`, `pack_key`, `platform` (`web | mobile`), `user_id` (web'de null), `token_hash`, `scenario_ids uuid[]` (kart sırası), `answers jsonb` (`{scenarioId: green|yellow|red}`), `status` (`started | completed`), `coins_awarded` (mobil; oturum başına bir kez), `ai_analysis` (planlı), `created_at`, `completed_at`.
- RLS açık, policy yok; tüm erişim token doğrulayan sunucu endpoint'leri üzerinden.

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

- Oda kurulurken, `questions` tablosundan **doğrudan `rooms.locale` diline ait**, aktif, ücretsiz ve **odanın ilişki türüne uygun** kategorilerdeki satırlar seçilip `room_questions`'a yazılır. Seçilen kategori önceliklidir; yetmezse aynı güvenli havuzdan tamamlanır (başka türün sorusu ve premium kategori hiçbir zaman karışık havuza girmez). Tüm havuz çekilip gerçekten rastgele seçilir.
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

**Kayıtlı kullanıcı modeli (yalnızca mobile; mobilde tüm oyun için zorunlu):**

- Supabase Auth ile kimlik yönetilir; oturum Supabase JWT token ile korunur.
- Google OAuth veya Apple OAuth ile giriş yapılır.
- Kayıtlı kullanıcının kurduğu odalar `user_id` ile ilişkilendirilir.
- Tier/coin `users` tablosunda tutulur ve yalnızca sunucuda doğrulanır/değiştirilir (bkz. Bölüm 12.2). Mobilde hesap silme imkânı bulunur.

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
- **Geri bildirim (`feedback`):** yalnızca puan, AI ilgisi, kısa serbest yorum (≤ 500 karakter) ve oda meta verisi (dil, mod, ilişki türü, platform) tutulur; cevap/tahmin içeriği asla. Kimlik yalnızca `participant_id`'dir (anonim kalır). Yazma token doğrulayan sunucu endpoint'i üzerindendir, tablo ve metrik görünümleri `anon/authenticated` erişimine kapalıdır. Anket yalnızca sonuçlar hazır olduktan sonra kabul edilir.
- **Partnerin doğum tarihi** (yalnızca mobil, planlanan) ve AI yorum için LLM'e gönderilen veriler gizlilik açısından özel değerlendirme gerektirir; web'de doğum tarihi toplanmaz (bkz. Bölüm 12.5).

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

### Memnuniyet ve ürün-pazar uyumu (web, canlı)

Yatırım kararı için iki katman kullanılır: **söylenen** (anket) ve **yapılan** (davranış). İkincisi herkesi ölçer ve daha dürüsttür.

- **Davranış** (anket gerektirmez; `metrics_daily_funnel`): oda açılan → **partner katılan** → **sonucu hazır olan** oranları; mod, ilişki türü ve dile göre kırılım. Partner katılım ve tamamlama oranı "beğeniyorlar mı"nın en güçlü göstergesidir.
- **Anket** (`metrics_feedback_summary`): ortalama puan, beğenen (4–5) / beğenmeyen (1–2) sayısı, serbest yorumlar.
- **AI yorum talebi:** `wants_ai` dağılımı (Evet / Belki / Hayır) — AI yorum yatırımının talep sinyali.
- Veriler `TEST-` isimli test odaları hariç hesaplanır; sorgular Supabase SQL editöründen çalıştırılır.

### Gelir metrikleri (mobile)

- Paket görüntülenme → satın alma dönüşüm oranı (Lite / Premium ayrı)
- Coin tükenme → reklam izleme / paket satın alma dönüşümü
- AI yorum açma oranı ve coin harcaması
- Kullanıcı başı gelir
- Kullanıcı başına ortalama oda kurma sayısı

### İlk MVP başarı kriteri

İlk 100 oda için hedefler:

- En az %50 partner katılımı
- En az %35 tamamlanan oyun oranı
- En az %5 mobile app indirme niyeti (web'deki kilitli kategori üzerinden)

---

## 20. Soru Kategorileri (v2 — canlıda)

> Önceki 5 kategorili, yalnızca Türkçe/çift odaklı liste **yerini v2 setine bırakmıştır**. Eski sorular silinmedi, pasife alındı (mevcut odalar/sonuçlar bozulmasın diye). Tüm içerik **elle yazılmış/uyarlanmıştır** (otomatik çeviri yok, bkz. Bölüm 16); her soru TR/EN/ES olarak birlikte yazılır ve `translation_group_id` ile eşleşir.

### Yapı

- **11 kategori × 30 soru**: her kategoride **10 Secret Choice + 10 Prediction + 10 Orderline**. Toplam 330 soru/dil, 990 satır.
- 10'luk bir oyun tek bir modda, tek bir kategoride açılabilsin diye her modda her kategoride tam 10 soru vardır.
- Prediction ve Orderline'da her soru tam **4 seçenek/kart** içerir; seçenekler birbirinden net ayrışan tavırlardır (AI'ın kişilik tonunu okuyabilmesi için, "iyi/daha iyi" hiyerarşisi yok).
- Her soru, kullanıcıya görünmeyen bir **`insight_tag`** taşır (`planning_style`, `honesty_vs_tact`, `love_language`, `money_habit` …) — AI yorumu için tema.

| Kategori (TR) | Slug | Kanka | Sevgili | Hayat Arkadaşı |
|---|---|:-:|:-:|:-:|
| Kanka Testi | `friend_test` | ✓ | | |
| Çılgın Senaryolar | `wild_scenarios` | ✓ | | |
| Sosyal Hayat | `social_life` | ✓ | | |
| Tanışma | `first_date` | | ✓ | |
| Romantizm | `romance` | | ✓ | |
| Birlikte Gelecek | `future` | | | ✓ |
| Ev & Para | `home_money` | | | ✓ |
| İletişim | `communication` | ✓ | ✓ | ✓ |
| Yaşam Tarzı | `lifestyle` | ✓ | ✓ | ✓ |
| Değerler | `values` | ✓ | ✓ | ✓ |
| Cesur Sorular (premium) | `bold` | | ✓ | ✓ |

Her ilişki türü 6 kategori görür (Sevgili ve Hayat Arkadaşı'nda biri premium olan Cesur Sorular'dır); ücretsiz havuz her modda en az 50 soru içerir (Kanka 60, Sevgili 50, Hayat Arkadaşı 50).

### İçerik kuralları

- **Kanka'ya açık hiçbir kategoride hiçbir soru/seçenek romantik çağrışım taşımaz** ("partner", "sevgili", "aşk", "flört", "evlilik", "kıskançlık", "ilişki", ilk buluşma… ve EN/ES karşılıkları). Ortak kategoriler tür-bağımsız yazılır. Kural `scripts/check-questions.mjs` ile otomatik denetlenir.
- **Cesur Sorular:** açık cinsel içerik yoktur; "cesur/romantik" çerçevede dürüstlük, kırılganlık, sınırlar, kıskançlık, sırlar. Yalnızca Sevgili ve Hayat Arkadaşı'nda ve premium.
- **Hayat Arkadaşı:** evlilik/çocuk gibi hassas konular varsayılmaz.
- Sorular yargılayıcı olmaz; seçenekler "doğru/yanlış" değil "farklı yaklaşım" olarak yazılır.
- Soruları **silme, pasife al**; metin düzeltmesi belirlenimci kimliklerle (UUID v5) migration ile yapılır.

### Kaynak ve inceleme

- Kaynak: `seeds/v2/` (kategori başına bir dosya). Migration üretimi: `scripts/build-questions-migration.mjs`. Denetim: `scripts/check-questions.mjs`.
- Okunabilir inceleme belgeleri: `docs/questions-v2-tr.md`, `-en.md`, `-es.md` (`scripts/export-questions-md.mjs`).
- İngilizce ve İspanyolca içerik Claude ile elle uyarlanmıştır; yayın öncesi ana dili İspanyolca olan birinin gözden geçirmesi önerilir.

---

## 21. Geliştirme Fazları

### Faz 1 — Web MVP (tamamlandı)

- Landing, oda oluşturma, link paylaşımı, guest join (anonim participant token), token hash saklama
- Birleştirilmiş tur, soft realtime status, mikro-reveal, server-side sonuç hesaplama, sonuç ekranı
- Temel RLS / server-side erişim kontrolleri, temel abuse/rate limit
- Secret Choice modu

### Faz 2 — Web Genişletme (tamamlandı)

- `categories` ve `questions` locale bazlı; `room_questions`/`answers`/`predictions` düz `question_id` FK
- Üç dil (TR/EN/ES): arayüz ve soru bankası
- Kategori seçimi + premium kategori kilidi (görsel) + mobile'a yönlendirme
- **Prediction, Orderline ve Karma modları** (web'de canlı)
- **İlişki türü (Kanka / Sevgili / Hayat Arkadaşı)**: oda alanı, kategori filtresi, tür duyarlı metinler
- **Soru seti v2**: 11 kategori × 30 soru × 3 dil, `insight_tag`, romantik-çağrışım denetimi
- **Geri bildirim** (sonuç ekranı anketi + çıkış istemi) ve metrik görünümleri
- Landing yenilemesi (4 adım, AI/mobil teaser, footer + Instagram), `gameofus.app` alan adı, paylaşım önizlemesi (Open Graph)
- Performans: API sorgularının paralelleştirilmesi, Vercel bölgesi Supabase ile eşlendi, self-host font/ikon alt kümesi
- API route'larının CORS + Bearer token desteğiyle mobile'a açılması

### Faz 3 — Mobile MVP (devam ediyor; ayrı repo, ayrıntı: `gameofus-mobile/tasklist.md`)

- Tüm oyun ekranları ve dört mod (yapıldı), giriş (Google/Apple) zorunlu
- İlişki türü seçimi ve kategori filtresi (backend hazır; mobil arayüz yapılacak)
- Coin + tier, paket ekranı, IAP (RevenueCat), restore
- Geçmiş oyunlar, push notification, deep link / universal link, hesap silme
- AI yorum (sonuç ekranında, coin ile) ve gerekiyorsa doğum tarihi/yaş doğrulama (Cesur Sorular)

### Faz 4 — Web tarafında sıradaki işler

- Mobil için backend: `users/*` (me, coins/spend, coins/earn), `iap/verify`, `ai-commentary`, hesap silme; `users.tier`, `categories.min_tier`, `credit_transactions`, `results.ai_commentary`
- Universal link dosyaları (`apple-app-site-association`, `assetlinks.json`) — `gameofus.app`
- Sonuç paylaşım kartları ve (sonra) Instagram'a paylaşma
- PWA install prompt, admin panel, eski anonim odalar için veri temizleme job'u, HttpOnly cookie hardening, gerekirse Edge Function'a geçiş
- Dördüncü+ dil ekleme (yapı satır-bazlı olduğu için şema değişikliği gerektirmez)

---

## 22. Açık Kararlar

| Karar | Sonuç |
|---|---|
| Token mimarisi | Anonim kullanıcılar için owner/guest `participant_token` üretilecek; DB'de yalnızca `token_hash` tutulacak |
| Owner tanıma | Owner yalnızca token/JWT ile tanınır; isim eşleştirmesi owner olmak için yeterli değildir |
| Guest tanıma | Guest ilk katılımda token alır; aynı cihazdan token ile devam eder |
| Token saklama | Web: localStorage (hardening'de HttpOnly cookie); Mobile: expo-secure-store |
| Auth | Web'de ücretsiz oyun anonimdir (login yok). **Mobilde her oyun için Google/Apple girişi zorunludur** (anonim oyun yok); Supabase Auth yalnızca mobildedir |
| **Premium modeli** | **Coin + tier: Lite (≈$6.90, 2000 coin) ve Premium (≈$10.90, 5000 coin) tek seferlik consumable paketler; paket tier'ı kalıcı yükseltir (asla düşürmez) ve coin ekler; kategori erişimi yalnızca tier ile (coin ile açılmaz). Eski "tek seferlik premium + oda kredisi" ve zaman bazlı modeller kaldırıldı** |
| **Coin ekonomisi** | **Kayıt +500, reklam +100, oda −250, AI yorum −100 (herkes için)** |
| **Ödeme sağlayıcısı** | **Mobile App Store / Play Store IAP (RevenueCat); Lemon Squeezy kullanılmıyor** |
| **Premium kapsamı** | **Yalnızca mobile; web hiçbir premium/login mantığı barındırmaz** |
| Paket fiyatlarının yerel karşılıkları, reklam günlük limiti | Henüz belirlenmedi |
| **İlişki türleri** | **Kanka (`friend`) / Sevgili (`dating`) / Hayat Arkadaşı (`partner`); oda kurulurken zorunlu, kurulduktan sonra değişmez; slug teknik, görünen isim çeviri. İngilizce: friend/partner, İspanyolca: amigo/pareja** |
| **Kanka içerik kuralı** | **Kanka'ya açık hiçbir kategoride romantik çağrışım yok (otomatik denetim); ortak kategoriler tür-bağımsız** |
| **Kategori filtresi** | **`categories.relationship_types` ile; sunucu doğrular; "Karışık Sürpriz" yalnızca uygun, ücretsiz kategorilerden çeker** |
| **Geri bildirim** | **Sonuç ekranında isteğe bağlı mini anket (puan, AI ilgisi, yorum) + oda başına bir kez yumuşak çıkış istemi; zorunlu değil. Davranış metrikleri (partner katılımı, tamamlama) asıl memnuniyet sinyalidir** |
| **AI yorum** | **Mobil, coin ile (−100), `insight_tag` + yapılandırılmış cevaplardan; yayın öncesi rıza/gizlilik netleştirilir; web'de yalnızca "yakında" olarak anlatılır** |
| **Yaş doğrulama** | **Yalnızca mobilde (Cesur Sorular için, Sevgili/Hayat Arkadaşı + her iki oyuncu 18+); web'de Cesur Sorular kilitli olduğu için doğum tarihi toplanmaz** |
| **Domain** | **`gameofus.app` (satın alındı, canlı); Instagram `@gameofus.app`** |
| **Solo oyun (Red Flag Mayın Tarlası)** | **Doğru cevap yok, yalnızca tolerans profili + Red sayısına göre sabit başlık/cümle (arketip yok); sabit setler (2 kategori × 3 açık set, 9'ar kart; 104-106 mobilde); ayrı model (`solo_*`); önce web (anonim, 1 oyun), sonra mobil (+20 coin, günde 3 ödüllü oyun, AI −100 coin); oyun girişinde kişisel veri sorulmaz** |
| **Altyapı** | **Vercel fonksiyonları Supabase ile aynı bölgede (Frankfurt); Next.js sürümü sabit; fontlar/ikonlar self-host** |
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
| Soru bankası | **v2: 11 kategori × 30 soru × 3 dil (990 satır), elle yazılmış; eskiler pasife alındı (silinmedi); `seeds/v2` → üretilen migration** |
| Dil algılama (web) | Cookie (önceki tercih) → `Accept-Language` → `en`; middleware tek karar noktası |

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

Game of Us, iki kişinin — arkadaşlar, sevgililer ya da hayat arkadaşları — birbirini tahmin ederek ve cevapları birlikte açarak daha iyi tanımasını sağlayan link bazlı bir uygulamadır. Web'de stabil bir MVP olarak çalışır; mobile app, aynı oyun deneyimini native bir katmanla (push notification, geçmiş oyunlar, premium kategoriler) genişletir.

Web'de oyun tamamen anonimdir — link paylaşımı, iki kişilik oyun ve sonuç ekranı için kayıt gerekmez. Mobil uygulamada giriş (Google/Apple) zorunludur; satın alma ve coin yalnızca orada vardır: Lite/Premium paketleri kategorilere kalıcı erişim ve coin verir, coin oda kurmak ve AI yorumu açmak için harcanır.

Ürünün en kritik varsayımı teknik değil, davranışsaldır:

> İnsanlar arkadaşına, partnerine veya yakın olduğu bir kişiye bu oyun linkini göndermek isteyecek mi?

MVP'nin temel amacı bu varsayımı hızlı, düşük maliyetli ve ölçülebilir şekilde test etmektir. Mobile genişleme, bu varsayım doğrulandıktan sonra ürünü derinleştirme ve sürdürülebilir gelir modeli kurma adımıdır.
