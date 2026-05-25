# TASK_LIST.md — Game of Us MVP

Bu dosya Claude Code ile adım adım ilerlemek için hazırlanmış iş listesi formatıdır.  
Her task tamamlandıkça checkbox işaretlenmelidir. Büyük özellikler tek seferde değil, küçük ve test edilebilir parçalara bölünerek geliştirilmelidir.

---

## Kullanım Kuralı

- Aynı anda tek ana bölüm üzerinde çalış.
- Bir task tamamlanmadan sonraki büyük bölüme geçme.
- Her task sonunda uygulamayı çalıştır ve temel akışı kontrol et.
- Kritik kurallar için `CLAUDE.md`, mimari kararlar için `ARCHITECTURE.md`, endpointler için `API_SPEC.md` esas alınır.
- Partner cevapları reveal öncesi client'a ham veri olarak dönmemelidir.
- Realtime yalnızca oda ve participant status için kullanılmalıdır.

---

# 0. Project Setup

## 0.1 Next.js proje kurulumu

- [ ] Next.js App Router projesini oluştur.
- [ ] TypeScript aktif olsun.
- [ ] Tailwind CSS kurulu ve çalışır olsun.
- [ ] Temel `/src` klasör yapısını oluştur.
- [ ] ESLint / formatter ayarlarını kur.
- [ ] Lokal geliştirme server'ı sorunsuz çalışsın.

### Kabul Kriteri

- [ ] `npm run dev` sorunsuz çalışıyor.
- [ ] Ana sayfa açılıyor.
- [ ] Tailwind class'ları uygulanıyor.

---

## 0.2 Klasör yapısı

Aşağıdaki yapıyı kur:

```txt
/src
  /app
  /components
  /features
  /lib
  /server
  /types
  /i18n

/supabase
  /migrations
  /seeds

/docs
```

- [ ] App route yapısı hazırlanmış olsun.
- [ ] Shared helper'lar için `/lib` oluşturulsun.
- [ ] Server-only helper'lar için `/server` oluşturulsun.
- [ ] Feature bazlı oyun klasörü oluşturulsun.

### Kabul Kriteri

- [ ] Yeni dosyalar rastgele yerlere değil, bu yapıya uygun ekleniyor.

---

## 0.3 Environment variables

- [ ] `.env` oluştur.
- [ ] Supabase URL env değişkenini ekle.
- [ ] Supabase anon key env değişkenini ekle.
- [ ] Supabase service role key sadece server-side kullanılacak şekilde tanımla.
- [ ] Client bundle'a service role key sızmadığını kontrol et.

Örnek:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_BASE_URL=
```

### Kabul Kriteri

- [ ] `.env` var.
- [ ] Server-only secret client tarafına sızmıyor.

---

# 1. Internationalization Setup

## 1.1 next-intl kurulumu

- [ ] `next-intl` kur.
- [ ] `/tr` ve `/en` route prefix yapısını hazırla.
- [ ] Varsayılan dili `tr` yap.
- [ ] `Accept-Language` ile otomatik yönlendirme kurgusunu hazırla.
- [ ] Manuel dil değiştirme altyapısını oluştur.

### Kabul Kriteri

- [ ] `/tr` açılıyor.
- [ ] `/en` açılıyor.
- [ ] Basit bir test metni iki dilde değişiyor.

---

## 1.2 Translation dosyaları

- [ ] `messages/tr.json` oluştur.
- [ ] `messages/en.json` oluştur.
- [ ] `I18N_COPY.md` içindeki temel metinleri ekle.
- [ ] Landing, create game, game screen, result ve error metinlerini ekle.

### Kabul Kriteri

- [ ] UI metinleri hardcoded değil, translation dosyasından geliyor.

---

# 2. Supabase Database

## 2.1 Migration oluşturma

Aşağıdaki tablolar için migration oluştur:

- [ ] `users`
- [ ] `rooms`
- [ ] `participants`
- [ ] `questions`
- [ ] `question_options`
- [ ] `room_questions`
- [ ] `answers`
- [ ] `predictions`
- [ ] `results`
- [ ] `payments`
- [ ] `rate_limits`

### Kabul Kriteri

- [ ] Migration Supabase üzerinde hatasız çalışıyor.
- [ ] Tablolar beklenen alanlarla oluşuyor.

---

## 2.2 Constraint ve indexler

- [ ] `rooms.room_code` unique olsun.
- [ ] `participants(room_id, role)` unique olsun.
- [ ] `participants(room_id, token_hash)` unique olsun.
- [ ] `room_questions(room_id, round_order)` unique olsun.
- [ ] `room_questions(room_id, question_id)` unique olsun.
- [ ] `answers(room_id, question_id, participant_id)` unique olsun.
- [ ] `predictions(room_id, question_id, predictor_participant_id, target_participant_id)` unique olsun.
- [ ] `results(room_id)` unique olsun.
- [ ] Gerekli indexleri ekle.

### Kabul Kriteri

- [ ] Duplicate answer insert edilemiyor.
- [ ] Duplicate prediction insert edilemiyor.
- [ ] Aynı oda için ikinci result insert edilemiyor.

---

## 2.3 Seed questions

- [ ] `seeds/questions.ts` veya `seed.sql` oluştur.
- [ ] 50 adet Secret Choice sorusunu ekle.
- [ ] Kategorileri ekle.
- [ ] Sorular `is_active = true` olsun.
- [ ] MVP'de `mode = secret_choice` olsun.

### Kabul Kriteri

- [ ] Seed çalıştırıldığında 50 aktif soru oluşuyor.
- [ ] Oda oluştururken soru sayısı seçilebiliyor.

---

# 3. Server Helpers

## 3.1 Supabase server client

- [ ] Server-side Supabase client oluştur.
- [ ] Service role key sadece server helper içinde kullanılsın.
- [ ] Client-side Supabase client ayrı olsun.
- [ ] Yanlışlıkla service role key client'a expose edilmesin.

### Kabul Kriteri

- [ ] Server API route DB yazabiliyor.
- [ ] Client bundle secret içermiyor.

---

## 3.2 Token helper

- [ ] Raw participant token üretme helper'ı yaz.
- [ ] Token hash helper'ı yaz.
- [ ] Token compare helper'ı yaz.
- [ ] Token URL'de taşınmayacak şekilde tasarla.
- [ ] DB'ye yalnızca `token_hash` yaz.

### Kabul Kriteri

- [ ] Participant oluşturulunca raw token client'a dönüyor.
- [ ] DB'de raw token görünmüyor.
- [ ] Token ile participant doğrulanabiliyor.

---

## 3.3 Room code helper

- [ ] Tahmin edilmesi zor `room_code` üret.
- [ ] Unique çakışma kontrolü yap.
- [ ] Public link formatını `/game/room/{room_code}` olarak hazırla.

### Kabul Kriteri

- [ ] Oda linki kısa ve paylaşılabilir.
- [ ] Duplicate room_code oluşmuyor.

---

## 3.4 Expire helper

- [ ] Free oda için `created_at + 24 hours` hesapla.
- [ ] Premium oda için `created_at + 72 hours` hesapla.
- [ ] `isRoomExpired` helper yaz.
- [ ] Expired odalarda yazma işlemini engelle.

### Kabul Kriteri

- [ ] Expired oda için submit yapılamıyor.
- [ ] Expired oda için kullanıcıya doğru hata dönüyor.

---

## 3.5 Scoring helper

- [ ] Secret Choice result hesaplama helper'ı yaz.
- [ ] `yes = yes` doğru olsun.
- [ ] `yes ↔ unsure` yakın tahmin olsun.
- [ ] `no ↔ unsure` yakın tahmin olsun.
- [ ] `yes ↔ no` yanlış olsun.
- [ ] Yakın tahmin okuma skorunda doğru sayılsın.
- [ ] Confidence multiplier ana skora dahil edilmesin.

### Kabul Kriteri

- [ ] 10 tahminden 8 doğru/yakın ise skor 80 çıkıyor.
- [ ] Confidence değişse bile ana skor değişmiyor.

---

# 4. API Routes

## 4.1 Create room API

Endpoint:

```txt
POST /api/rooms/create
```

- [ ] Request validation yap.
- [ ] Rate limit kontrolü ekle.
- [ ] Room oluştur.
- [ ] Owner participant oluştur.
- [ ] Owner token üret, hash'i DB'ye yaz.
- [ ] Room questions oluştur.
- [ ] Share link dön.

### Kabul Kriteri

- [ ] Oda oluşturulabiliyor.
- [ ] Owner token client'a dönüyor.
- [ ] DB'de token hash var, raw token yok.
- [ ] Room questions oluşuyor.

---

## 4.2 Join room API

Endpoint:

```txt
POST /api/rooms/[roomCode]/join
```

- [ ] Room var mı kontrol et.
- [ ] Expire kontrolü yap.
- [ ] Existing token varsa participant doğrula.
- [ ] Token yoksa guest oluştur.
- [ ] Oda doluysa hata dön.
- [ ] Owner ismi yazan kullanıcıyı owner yapma.
- [ ] Guest katılınca status güncelle.
- [ ] Gerekirse `join_locked = true` yap.

### Kabul Kriteri

- [ ] Guest katılabiliyor.
- [ ] Üçüncü kişi giremiyor.
- [ ] Aynı cihaz token ile devam edebiliyor.
- [ ] İsim eşleştirme kimlik doğrulama için kullanılmıyor.

---

## 4.3 Get room state API

Endpoint:

```txt
GET /api/rooms/[roomCode]/state
```

- [ ] Room state dön.
- [ ] Participant state dön.
- [ ] Participant listesinde sadece display/status dön.
- [ ] Questions listesini dön.
- [ ] Partner answers/predictions ham veri olarak dönmesin.

### Kabul Kriteri

- [ ] Oyun ekranı için gerekli veri geliyor.
- [ ] Partnerin cevabı response içinde yok.
- [ ] Questions tek seferde yüklenebiliyor.

---

## 4.4 Submit turn API

Endpoint:

```txt
POST /api/rooms/[roomCode]/submit-turn
```

- [ ] Token doğrula.
- [ ] Room expire kontrolü yap.
- [ ] Question bu odaya ait mi kontrol et.
- [ ] Cevap + tahmin aynı transaction içinde yaz.
- [ ] Duplicate submit'i engelle.
- [ ] Target participant otomatik diğer oyuncu olsun.
- [ ] Partner cevabı varsa mikro-reveal sonucu dön.
- [ ] Partner cevabı yoksa fallback dön.
- [ ] Partner cevabını ham şekilde dönme.

### Kabul Kriteri

- [ ] Cevap ve tahmin tek request ile kaydediliyor.
- [ ] Aynı soruya ikinci submit engelleniyor.
- [ ] Partner cevabı yoksa oyun bloke olmuyor.
- [ ] Mikro-reveal sadece kilitleme sonrası dönüyor.

---

## 4.5 Complete participant API

Endpoint:

```txt
POST /api/rooms/[roomCode]/complete
```

- [ ] Token doğrula.
- [ ] Participant tüm soruları tamamladı mı kontrol et.
- [ ] Participant status `completed` yap.
- [ ] `completed_at` set et.
- [ ] İki participant completed ise result hesaplama tetikle.
- [ ] Room status güncelle.

### Kabul Kriteri

- [ ] Owner tamamlanınca waiting durumuna geçiyor.
- [ ] Guest tamamlanınca iki taraf tamamlandıysa result_ready oluyor.

---

## 4.6 Results API

Endpoint:

```txt
GET /api/rooms/[roomCode]/results
```

- [ ] Token doğrula.
- [ ] Room `result_ready` değilse result dönme.
- [ ] Result detaylarını dön.
- [ ] Sadece ilgili participantlar sonucu görebilsin.
- [ ] Yargılayıcı olmayan summary text dön.

### Kabul Kriteri

- [ ] Result sadece result_ready sonrası görüntüleniyor.
- [ ] Token yoksa veya yanlışsa sonuç açılmıyor.

---

# 5. Core UI

## 5.1 Layout

- [ ] Mobil öncelikli ana layout oluştur.
- [ ] Masaüstü için max width ve kolon yapısı hazırla.
- [ ] Dil switcher ekle.
- [ ] Temel typography ve spacing ayarla.
- [ ] Stitch tasarımlarına uyumlu component temeli oluştur.

### Kabul Kriteri

- [ ] Mobilde ekran taşmıyor.
- [ ] Masaüstünde gereksiz boşluk hissi yok.

---

## 5.2 Landing page

- [ ] Hero bölümü.
- [ ] Oyun Başlat CTA.
- [ ] Nasıl Çalışır bölümü.
- [ ] Oyun modu tanıtımı.
- [ ] Sonuç preview bölümü.
- [ ] Premium mock teaser.

### Kabul Kriteri

- [ ] Kullanıcı oyunu 10 saniyede anlayabiliyor.
- [ ] CTA create game ekranına götürüyor.

---

## 5.3 Create Game screen

- [ ] İsim input.
- [ ] Partner adı opsiyonel input.
- [ ] Soru sayısı seçimi.
- [ ] Default Secret Choice.
- [ ] Create room API bağlantısı.
- [ ] Token localStorage'a kaydet.
- [ ] Share screen'e yönlendir.

### Kabul Kriteri

- [ ] Oda oluşturulup link ekranına geçiliyor.
- [ ] Token client'ta saklanıyor.

---

## 5.4 Share Link screen

- [ ] Link göster.
- [ ] Copy link butonu.
- [ ] WhatsApp share butonu.
- [ ] Room status göster.
- [ ] Cevaplamaya başla butonu.
- [ ] Partner join statusunu göster.

### Kabul Kriteri

- [ ] Link kopyalanabiliyor.
- [ ] WhatsApp paylaşımı çalışıyor.
- [ ] Kullanıcı oyuna başlayabiliyor.

---

## 5.5 Join Room screen

- [ ] Room link açıldığında state kontrol et.
- [ ] Existing token varsa otomatik devam et.
- [ ] Token yoksa isim iste.
- [ ] Join API çağır.
- [ ] Guest token kaydet.
- [ ] Oda dolu / expired hata ekranlarını bağla.

### Kabul Kriteri

- [ ] Guest linkten katılabiliyor.
- [ ] Oda doluysa kullanıcıya net mesaj gösteriliyor.

---

# 6. Game Flow UI

## 6.1 Game screen state

- [ ] Room questions oyun başlangıcında tek seferde yükle.
- [ ] Soruları client state'te tut.
- [ ] Current question index yönet.
- [ ] Progress göster.
- [ ] Soru geçişinde DB fetch yapma.

### Kabul Kriteri

- [ ] Soru geçişleri hızlı.
- [ ] Network tab'de her soru geçişinde question fetch yok.

---

## 6.2 Answer + prediction UI

- [ ] Kendi cevabın bölümü.
- [ ] Partner tahmini bölümü.
- [ ] Güven seviyesi seçimi.
- [ ] Tahmini kilitle butonu.
- [ ] Form validation.
- [ ] Submit-turn API bağlantısı.

### Kabul Kriteri

- [ ] Cevap ve tahmin seçmeden submit yapılamıyor.
- [ ] Submit tek request ile gidiyor.

---

## 6.3 Micro reveal UI

- [ ] Correct state.
- [ ] Near state.
- [ ] Miss state.
- [ ] Partner not answered fallback state.
- [ ] Sonraki soru butonu.
- [ ] Son soru ise complete akışına geçiş.

### Kabul Kriteri

- [ ] Partner cevabı varsa mikro-reveal görünüyor.
- [ ] Partner cevabı yoksa fallback görünüyor.
- [ ] Akış bloke olmuyor.

---

## 6.4 Complete flow

- [ ] Son sorudan sonra complete API çağır.
- [ ] Eğer result ready değilse waiting screen'e yönlendir.
- [ ] Eğer result ready ise results ekranına yönlendir.
- [ ] Participant status güncellemesini UI'a yansıt.

### Kabul Kriteri

- [ ] Owner tamamlayınca bekleme ekranına gidiyor.
- [ ] Guest tamamlayınca sonuç hazır olabiliyor.

---

# 7. Realtime Status

## 7.1 Room status subscription

- [ ] `rooms.status` için realtime subscription kur.
- [ ] `result_ready` olunca sonuç ekranına yönlendirme yap.
- [ ] Expired status durumunu ele al.

### Kabul Kriteri

- [ ] Partner tamamlayınca waiting ekranı güncelleniyor.
- [ ] Sonuç hazır olunca kullanıcı bilgilendiriliyor.

---

## 7.2 Participant status subscription

- [ ] Participant status değişimlerini dinle.
- [ ] Partner joined / playing / completed durumlarını göster.
- [ ] Answers ve predictions için realtime subscription ekleme.

### Kabul Kriteri

- [ ] Partner durumu ekranda soft realtime görünüyor.
- [ ] Hassas cevap verileri realtime ile sızmıyor.

---

# 8. Results UI

## 8.1 Results overview

- [ ] Reading score büyük göster.
- [ ] Summary text göster.
- [ ] Detayları gör butonu.
- [ ] Tekrar oyna butonu.
- [ ] Premium mock teaser göster.

### Kabul Kriteri

- [ ] Skor doğru görünüyor.
- [ ] Ton yargılayıcı değil.

---

## 8.2 Detailed results

- [ ] Soru bazlı kartlar.
- [ ] Senin cevabın.
- [ ] Partnerin tahmini.
- [ ] Sonuç etiketi.
- [ ] Konuşma önerisi.

### Kabul Kriteri

- [ ] Her soru için detay kartı var.
- [ ] Veri sadece result_ready sonrası görünüyor.

---

# 9. Error, Loading & Empty States

## 9.1 Error states

- [ ] Invalid link.
- [ ] Room expired.
- [ ] Room full.
- [ ] Result not ready.
- [ ] Already submitted.
- [ ] Rate limited.
- [ ] Network error.

### Kabul Kriteri

- [ ] Kullanıcı teknik hata yerine anlaşılır mesaj görüyor.

---

## 9.2 Loading states

- [ ] Oda oluşturuluyor.
- [ ] Odaya katılınıyor.
- [ ] Tahmin kaydediliyor.
- [ ] Partner cevabı kontrol ediliyor.
- [ ] Sonuçlar hazırlanıyor.

### Kabul Kriteri

- [ ] Kullanıcı beklerken uygulama donmuş gibi hissetmiyor.

---

# 10. Premium Mock

## 10.1 Premium mock screen

- [ ] Premium faydalarını göster.
- [ ] $2.99 / 3 günlük erişim bilgisini mock olarak göster.
- [ ] Gerçek ödeme alma.
- [ ] CTA sadece niyet ölçsün.

### Kabul Kriteri

- [ ] Faz 1'de ödeme entegrasyonu yok.
- [ ] Kullanıcı satın alma akışına gerçekten yönlenmiyor.

---

# 11. Analytics Events

## 11.1 MVP events

Aşağıdaki eventleri minimal şekilde ekle:

- [ ] `room_created`
- [ ] `link_copied`
- [ ] `whatsapp_shared`
- [ ] `guest_joined`
- [ ] `owner_completed`
- [ ] `guest_completed`
- [ ] `result_viewed`
- [ ] `premium_mock_clicked`

### Kabul Kriteri

- [ ] Eventlerde bireysel cevap/tahmin içeriği tutulmuyor.
- [ ] Partner isimleri ve özel ilişki cevapları analytics'e gitmiyor.

---

# 12. Final QA

## 12.1 Happy path test

- [ ] Owner oda oluşturur.
- [ ] Owner linki paylaşır.
- [ ] Guest linkten katılır.
- [ ] Owner 5 soruyu tamamlar.
- [ ] Guest 5 soruyu tamamlar.
- [ ] Result ready olur.
- [ ] İki taraf sonuçları görür.

### Kabul Kriteri

- [ ] Uçtan uca oyun tamamlanıyor.

---

## 12.2 Security test

- [ ] Token olmadan result açılmıyor.
- [ ] Üçüncü kişi odaya giremiyor.
- [ ] Partner cevabı reveal öncesi API response'ta yok.
- [ ] Raw token DB'de yok.
- [ ] Duplicate answer engelleniyor.
- [ ] Duplicate prediction engelleniyor.

### Kabul Kriteri

- [ ] Temel veri gizliliği korunuyor.

---

## 12.3 Performance test

- [ ] Sorular oyun başında tek seferde yükleniyor.
- [ ] Soru geçişlerinde DB fetch yok.
- [ ] Submit-turn tek request.
- [ ] Realtime sadece status için.
- [ ] Mobilde akış donmuş gibi hissettirmiyor.

### Kabul Kriteri

- [ ] 5 soruluk oyun akıcı oynanıyor.
- [ ] 10 soruluk oyun kabul edilebilir hızda tamamlanıyor.

---

# 13. Deploy

## 13.1 Vercel deploy

- [ ] Vercel project oluştur.
- [ ] Environment variables ekle.
- [ ] Supabase production bağlantısını kontrol et.
- [ ] Build hatalarını çöz.
- [ ] Canlı URL smoke test yap.

### Kabul Kriteri

- [ ] Canlı ortamda oda oluşturulup oyun tamamlanabiliyor.

---

# 14. Faz 2 Backlog

Bu bölüm Faz 1 tamamlandıktan sonra ele alınacaktır.

- [ ] Lemon Squeezy ödeme entegrasyonu ($2.99 / 3 günlük hak)
- [ ] Lemon Squeezy webhook endpoint'i (Edge Function veya Vercel API route)

---

# 15. Faz 3 Backlog

- [ ] PWA install prompt
- [ ] HttpOnly cookie hardening
- [ ] AI destekli soru önerileri
- [ ] Admin panel
- [ ] Hafif kullanıcı hesabı geliştirmeleri
- [ ] Geçmiş oyunları saklama
- [ ] Eski anonim oda temizleme job'u

---

# 16. Supabase Auth

## 16.1 Auth kurulumu

- [ ] Supabase Auth'u projede aktif et (e-posta/şifre provider).
- [ ] Google OAuth provider ekle (Supabase dashboard + client ID/secret).
- [ ] Apple OAuth provider ekle.
- [ ] `lib/supabase/auth.ts` — sign-up, sign-in, sign-out helper'ları.
- [ ] Auth callback route (`/auth/callback`) — session cookie set.

### Kabul Kriteri

- [ ] E-posta/şifre ile kayıt ve giriş çalışıyor.
- [ ] Google ile giriş çalışıyor.
- [ ] Apple ile giriş çalışıyor.
- [ ] Anonim (ücretsiz) oyun hâlâ login gerektirmiyor.

---

# 17. Premium Hak Yönetimi

## 17.1 premium_until & sınırsız oda

- [ ] `users.premium_until` alanını server-side kontrol eden helper (`isPremium(userId)`).
- [ ] Oda oluşturmada: anonim → günlük rate limit uygulanır; premium → sınırsız.
- [ ] Expire: premium oda 72h, ücretsiz oda 24h (zaten migration'da tanımlı).
- [ ] Premium mock ekranında login CTA'sı → register flow'a yönlendir.
- [ ] Register sonrası premium_mock_payment screen (Faz 1'de test modu; Faz 2'de gerçek ödeme).

### Kabul Kriteri

- [ ] Premium kullanıcı sınırsız oda oluşturabiliyor.
- [ ] Anonim kullanıcı günlük limite takılıyor.
- [ ] `premium_until` süresi dolunca premium hak sona eriyor.

---

# 18. Prediction Modu

## 18.1 Prediction UI & logic

- [ ] `question_options` tablosundan Prediction seçeneklerini yükle.
- [ ] Game screen: senaryo metni + çoktan seçmeli seçenekler UI bileşeni.
- [ ] Partner prediction: aynı seçeneklerden birini tahmin et.
- [ ] submit-turn endpoint'i Prediction cevap/tahminini kabul edecek şekilde güncelle.
- [ ] Sonuç: exact match = doğru, değilse = yanlış (binary, yakın yok).
- [ ] Prediction soruları için 15–20 soru seed'e ekle (`seeds/questions.ts`).

### Kabul Kriteri

- [ ] Prediction turunu oynayabiliyorum.
- [ ] Mikro-reveal Prediction modunda çalışıyor.
- [ ] Sonuç ekranında Prediction soruları doğru gösteriliyor.

---

# 19. Orderline Modu

## 19.1 Orderline UI & logic

- [ ] Kart sıralama UI (sürükle-bırak veya sıra numarası seçimi).
- [ ] Partner için aynı kartları sırala (tahmin).
- [ ] submit-turn endpoint'i Orderline cevap/tahminini kabul edecek şekilde güncelle.
- [ ] Sonuç: tam eşleşme = doğru; kısmi eşleşme mantığı (PRD'ye göre).
- [ ] Orderline soruları için 10–15 soru seed'e ekle.

### Kabul Kriteri

- [ ] Orderline turunu oynayabiliyorum.
- [ ] Sıralama sonucu doğru hesaplanıyor.

---

# 20. Karma Oyun

## 20.1 Mixed mode

- [ ] Oda oluşturmada "Karma" modu seçilince Secret Choice + Prediction + Orderline sorularını karışık ata.
- [ ] `room_questions` ataması: farklı `mode` değerli sorular aynı odada sıralanır.
- [ ] Game screen: sorunun moduna göre ilgili UI bileşenini (`SecretChoiceQuestion`, `PredictionQuestion`, `OrderlineQuestion`) render et.

### Kabul Kriteri

- [ ] Karma odada hem Secret Choice hem Prediction soruları art arda geliyor.
- [ ] Her soru kendi UI bileşeniyle açılıyor.

---

# 21. Sonuç Paylaşım Kartları

## 21.1 Share card

- [ ] Sonuç ekranında "Paylaş" butonu.
- [ ] OG image API route (`/api/og/result`) → dinamik görsel (okuma skoru + oyun adı).
- [ ] WhatsApp / kopyala seçenekleri (Twitter opsiyonel).
- [ ] `next/og` ile görsel üretimi.

### Kabul Kriteri

- [ ] Paylaşılan link sosyal önizlemede sonuç kartını gösteriyor.
- [ ] Görsel üretimi server-side çalışıyor.

---

# 22. Referral / Davet Akışı

## 22.1 Referral

- [ ] Kayıtlı kullanıcıya referral link üretme (`?ref=<kısa kod>` veya `userId`).
- [ ] Yeni kullanıcı referral ile gelince `referral_source` kaydet (anonim kullanıcı veya yeni kayıt).
- [ ] MVP'de referral → indirim veya bonus yok; yalnızca takip.
- [ ] Analytics event: `referral_link_clicked`.

### Kabul Kriteri

- [ ] Referral query parametresi okunuyor ve kaydediliyor.
- [ ] Referral analytics eventi tetikleniyor.
