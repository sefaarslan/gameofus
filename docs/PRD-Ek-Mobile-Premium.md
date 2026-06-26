# PRD Eki — Mobile Genişleme & Premium Model Güncellemesi

> **Bu belge nedir:** Ana PRD'nin (`PRD - Game of Us`) yerini almaz, üzerine eklenir. Ana PRD'deki oyun mekaniği, veri modeli, güvenlik kuralları ve token mimarisi **hâlâ geçerlidir** ve referans kaynaktır. Bu ek, sadece mobile genişleme kararıyla birlikte değişen veya yeni eklenen kısımları tanımlar.
>
> **Claude Code'a nasıl verilir:** Web üzerinde çalışırken hem ana PRD'yi hem bu eki ver. Mobile proje üzerinde çalışırken de ikisini birlikte ver — mobile, ana PRD'deki oyun akışını (Secret Choice, birleştirilmiş tur, güven seviyesi, soft realtime vb.) birebir referans alır, sadece bu ekte tanımlanan native-özel katmanları üstüne ekler.

---

## 1. Genel Mimari Karar

İki ayrı client, tek ortak backend:

```
                ┌─────────────────────┐
                │   Supabase Backend   │
                │ (DB, Auth, Realtime)│
                └──────────┬──────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
     ┌──────▼──────┐              ┌──────▼──────┐
     │  Web (Next.js)│              │ Mobile(Expo) │
     │  MEVCUT, STABİL│              │  SIFIRDAN     │
     └─────────────┘              └─────────────┘
```

- Web ve mobile **ayrı kod tabanı** olarak geliştirilir. Monorepo veya kod paylaşımına şimdilik geçilmez.
- Web'in mevcut Next.js API route / server action yapısı **değişmez**. Mobile, bu route'lara HTTP isteğiyle bağlanır.
- Web'in cevap/tahmin/sonuç mantığına dokunulmaz; sadece mobile'dan erişilebilir hale getirilir (bkz. Bölüm 2).
- Web "stabil MVP" statüsünü korur; bu ekte tanımlanan değişiklikler web'de yalnızca **kategori sistemi** (Bölüm 5) için küçük, izole bir dokunuş gerektirir. Diğer her şey (auth, geçmiş oyunlar, premium) mobile'a özeldir ve web hiçbir şekilde bilmez/sormaz.

### Web'e dokunulacak tek nokta: API erişilebilirliği

Mevcut Next.js API route'ları / server action'lar mobile'dan da çağrılabilmesi için:
- CORS izni eklenir (mobile farklı origin'den istek atar).
- Token doğrulama, hem mevcut cookie tabanlı akışı hem de `Authorization: Bearer <token>` header'ını okuyabilecek şekilde genişletilir.
- Mevcut cookie tabanlı web akışı **bozulmaz**, sadece ek bir okuma yolu eklenir.

---

## 2. Üyelik Sistemi (Sadece Mobile)

### Kapsam

- Signin / signout sistemi **yalnızca mobile'da** bulunur. Web'de hiçbir giriş ekranı, hiçbir auth UI'ı yoktur ve eklenmeyecektir.
- Web, bir kullanıcının premium olup olmadığını **hiçbir şekilde sormaz veya bilmez**. Guest'in web'den katıldığı bir oyun, owner premium olsa da olmasa da web için aynı davranır.
- Auth sağlayıcı: Supabase Auth (e-posta/şifre + Google + Apple — ana PRD madde 16/18 ile aynı).

### Veri modeli güncellemesi (ana PRD madde 17 — `users` tablosu)

Ana PRD'deki `users.premium_until` (zaman bazlı) alanı **kaldırılır**. Yerine:

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Supabase Auth UID |
| email | text | E-posta adresi |
| is_premium | boolean | Premium paketi satın aldı mı (kalıcı, süresi yok) |
| room_credits | int | Kalan oda kurma hakkı (premium kullanıcı için) |
| created_at | timestamptz | Kayıt zamanı |

> `premium_until` ile ilgili tüm expire/cron mantığı (ana PRD madde 12, 17, 22) bu güncellemeyle birlikte geçersizdir.

---

## 3. Premium Satın Alma Modeli (Sadece Mobile)

### Model özeti

Zaman bazlı ("3 günlük sınırsız oda") model **tamamen kaldırılmıştır**. Yerine:

1. **Premium paket** — tek seferlik satın alma.
   - Satın alındığında: `is_premium = true` (kalıcı), `room_credits` belirlenen başlangıç miktarına ayarlanır.
   - Tüm premium kategorilere erişim **kalıcı** olarak açılır (bir daha ödeme gerekmez).
2. **Oda kredisi paketi** — tekrarlanabilir, küçük tutarlı satın alma.
   - Sadece `is_premium = true` olan kullanıcılar için anlamlıdır.
   - `room_credits` tükendiğinde kullanıcıya sunulur.
   - Satın alındığında `room_credits` artırılır.

> Kota miktarı ve fiyatlandırma (premium paket başlangıç kredisi, oda kredisi paketi boyutu/fiyatı) **henüz belirlenmedi** — ayrı bir görüşmede netleştirilecek. Bu belge yalnızca mekanizmayı tanımlar.

### Ödeme sağlayıcısı

- Mobile App Store / Play Store IAP (In-App Purchase) kullanılması önerilir — RevenueCat gibi bir katman üzerinden, çünkü tüketilebilir kredi + kalıcı unlock kombinasyonu native IAP modelleriyle (consumable + non-consumable) doğal olarak örtüşür.
- Ana PRD'deki Lemon Squeezy entegrasyonu (madde 16, 21) bu modelde **kullanılmaz** — Lemon Squeezy web ödemesi için uygundu, mobile IAP için store'un kendi altyapısı tercih edilir.

### Oda kurma kontrolü

- Ücretsiz (login'siz veya login'li ama premium olmayan) kullanıcı: oda kurma sınırı yok veya yumuşak bir günlük limit (karar bekliyor) — **ana PRD'deki ücretsiz oyun deneyimi değişmez.**
- Premium kullanıcı: her oda kurulumunda `room_credits` 1 azalır. Kredi `0` olduğunda oda kurma engellenir, oda kredisi paketi satın alma ekranına yönlendirilir.
- Bu kontrol **sadece mobile'da** uygulanır; web'deki anonim oda kurma akışına dokunulmaz.

---

## 4. Geçmiş Oyunlar Sekmesi (Sadece Mobile, Sadece Login'li Kullanıcı)

### Kapsam

- Yalnızca login olmuş mobile kullanıcıları için. Anonim (login'siz) oyunlar **kaydedilmez**, geçmişte görünmez.
- Web'de bu özellik **yoktur ve eklenmeyecektir**.
- Sekmede yalnızca **oyun sonuçları** görünür (detaylı analiz, istatistik yok — ana PRD madde 11'deki "sert uyum testi olmamalı" ilkesiyle uyumlu).

### Veri modeli (ek tablo gerekmez)

Ana PRD madde 17'deki `rooms.user_id` ve `results` tablosu arasındaki ilişki zaten yeterlidir:

- Login olmuş kullanıcı oda kurduğunda, `rooms.user_id` doldurulur (ana PRD'de zaten tanımlı).
- O odanın `results` kaydı, `rooms.user_id` üzerinden kullanıcıya bağlanmış sayılır.
- Geçmiş oyunlar sorgusu: `rooms.user_id = current_user.id` olan odaların `results` kayıtlarını listeler.

### Görünüm

- Liste: oyun tarihi, partner adı (varsa), okuma skoru.
- Detay: ana PRD madde 13.7'deki "Detailed Results" ekranıyla aynı (soru bazlı kart, sonuç etiketi, konuşma önerisi).
- Yeni bir hesaplama veya analiz katmanı **eklenmez** — var olan `results.details_json` doğrudan gösterilir.

---

## 5. Kategori Sistemi (Hem Web Hem Mobile, Davranış Farklı)

### Kapsam

- Kategori seçimi **her iki platformda da vardır.** Bu, "premium tamamen mobile'a özel" kararıyla çelişmez — web'e giren bilgi kullanıcının premium *durumu* değil, kategorinin *meta verisi* (`is_premium` flag'i kategori seviyesinde, kullanıcı seviyesinde değil).

### Veri modeli güncellemesi (ana PRD madde 17 — `questions` tablosu)

Yeni tablo eklenir:

| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid | Kategori ID |
| name | text | Görünen ad (örn. "Cesur Sorular") |
| slug | text | URL/kod-dostu kimlik |
| is_premium | boolean | Bu kategori premium kilitli mi |
| sort_order | int | Sıralama |

`questions` tablosundaki düz `category` text alanı, bu tabloya referans veren `category_id` (uuid) ile değiştirilir.

### Platform davranışı

| Durum | Web | Mobile (login'siz / premium değil) | Mobile (premium) |
|---|---|---|---|
| Temel kategori (`is_premium = false`) | Seçilebilir, oynanabilir | Seçilebilir, oynanabilir | Seçilebilir, oynanabilir |
| Premium kategori (`is_premium = true`) | Görünür, kilitli rozet; tıklanınca mobile app'e yönlendirme mesajı | Kilitli; tıklanınca satın alma akışına yönlendirme | Kalıcı açık |

### Web'deki değişiklik (izole, küçük)

- Create Game Screen'e (ana PRD madde 13.2) kategori seçimi UI'ı eklenir.
- Premium kategoriler listede görünür ama kilit ikonuyla işaretlenir.
- Tıklanınca oyun başlamaz; bunun yerine "Bu kategori sadece Game of Us mobile app'te açılır" mesajı + App Store/Play Store linkine yönlendiren bir modal gösterilir.
- Bu değişiklik web'in auth, token veya server-side mantığına dokunmaz; yalnızca statik bir UI + yönlendirme katmanıdır.

### Mobile'daki davranış

- Aynı kategori listesi gösterilir.
- Kilitli kategoriye tıklayan login olmamış kullanıcı önce signin ekranına yönlenir.
- Login olmuş, premium olmayan kullanıcı satın alma ekranına yönlenir.
- Premium kullanıcı için kilit hiç görünmez veya açık rozetle gösterilir.

---

## 6. Token ve Kimlik Doğrulama — Mobile Özel Notlar

Ana PRD madde 9.3 ve 18'deki anonim `participant_token` modeli **değişmeden** mobile'a taşınır, tek fark saklama yöntemidir:

| | Web | Mobile |
|---|---|---|
| Anonim participant token saklama | `localStorage` | `expo-secure-store` |
| API isteklerinde token taşıma | Cookie (mevcut) veya gelecekte header | `Authorization: Bearer <token>` header (zorunlu, cookie kullanılamaz) |
| Login'li kullanıcı kimliği | Yok (web'de login yok) | Supabase Auth JWT |

Deep linking gereksinimi (mobile özel, ana PRD'de yoktu):
- `room_code` linkleri hem web hem mobile'dan açılabilmelidir.
- Universal link / app link (`https://gameofus.app/room/...` → yüklüyse mobile app'i açar, yüklü değilse web'e düşer) kurulmalıdır.
- Custom scheme (`gameofus://room/...`) yedek olarak tutulabilir.

---

## 7. Bu Ekte Henüz Karara Bağlanmamış Noktalar

Aşağıdaki kararlar bilinçli olarak açık bırakılmıştır, ileride netleştirilecektir:

- Premium paketin başlangıç `room_credits` miktarı ve fiyatı.
- Oda kredisi paketinin boyutu (kaç kredi) ve fiyatı.
- Ücretsiz kullanıcı için oda kurma limiti olup olmayacağı (mobile'da).
- IAP sağlayıcı detayı (doğrudan App Store/Play Store API mi, RevenueCat gibi bir katman mı).

---

## 8. Özet — Ne Nerede Değişiyor

| Özellik | Web | Mobile |
|---|---|---|
| Signin/Signout | Yok, eklenmeyecek | Sıfırdan eklenir |
| Geçmiş oyunlar | Yok, eklenmeyecek | Sıfırdan eklenir (login zorunlu) |
| Kategori seçimi | Eklenir (küçük UI dokunuşu) | Sıfırdan eklenir |
| Premium kategori kilidi | Görsel kilit + yönlendirme | Tam fonksiyonel kilit + satın alma |
| Premium satın alma | Yok | Sıfırdan eklenir (IAP) |
| Oda kredisi sistemi | Yok | Sıfırdan eklenir |
| Token saklama | Değişmiyor (localStorage) | Yeni (expo-secure-store) |
| API erişimi | CORS + Bearer token desteği eklenir | Sıfırdan API client yazılır |
| Oyun mekaniği (Secret Choice, güven seviyesi, soft realtime) | Değişmiyor | Ana PRD'den birebir taşınır |
