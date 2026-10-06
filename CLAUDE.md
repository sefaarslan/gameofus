# CLAUDE.md — Game of Us

Bu dosya, Claude Code'un (ve diğer AI ajanlarının) bu projede çalışırken uyması gereken
kuralları, mimari kararları ve konvansiyonları tanımlar. Kod yazmadan önce bu dosyadaki
kuralların tamamı geçerli kabul edilir. Çelişki olduğunda PRD esas alınır; PRD'de net olmayan
bir teknik karar varsa buradaki yaklaşım uygulanır.

---

## 1. Ürün Özeti

**Game of Us**, iki kişinin (arkadaşlar, sevgililer ya da hayat arkadaşları) birbirini daha iyi
tanıması için tasarlanmış link bazlı bir oyundur; web'de (`https://gameofus.app`) ve mobil
uygulamada (ayrı repo `gameofus-mobile`, aynı backend) oynanır. Oyuncular bir oda oluşturur, linki
karşı tarafa gönderir; her iki taraf da tek bir turda hem kendi cevabını verir hem diğerinin
cevabını tahmin eder. İki taraf da turunu tamamlayınca sonuçlar açılır.

> **Terminoloji:** Bu dosyada "partner", oyundaki *karşı oyuncu* anlamındadır. Arayüzde bu kelime
> odanın ilişki türüne göre uyarlanır (Kanka / Sevgili / Hayat Arkadaşı — bkz. aşağıdaki ilke).

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
- **Üç dil: TR / EN / ES** — hem arayüz hem soru içeriği. Dil seçimi: önce `NEXT_LOCALE` cookie'si
  (kullanıcının önceki tercihi), yoksa `Accept-Language`, desteklenmiyorsa `en` (next-intl middleware,
  `proxy.ts`). Tek doğruluk kaynağı middleware'dir; kök sayfada ayrı bir yönlendirme kodu yoktur.
- **İlişki türü (oda oluştururken zorunlu):** `friend` (Kanka), `dating` (Sevgili), `partner`
  (Hayat Arkadaşı). Slug'lar teknik değerdir (`rooms.relationship_type`); görünen isimler yalnızca
  çeviri dosyalarındadır. Kategoriler `categories.relationship_types` ile türe göre filtrelenir ve
  sunucu, seçilen kategorinin türe uygunluğunu doğrular. Alan geriye dönük uyum için opsiyoneldir
  (eski mobil build'ler/odalar `null` gönderir → genel "partner" dili).
- **Kanka kuralı (kritik):** `friend` türüne açık hiçbir kategorideki (ortak kategoriler dahil)
  hiçbir soru ya da seçenek **romantik çağrışım taşımaz**. Ortak kategoriler (İletişim, Yaşam Tarzı,
  Değerler) tür-bağımsız yazılır ("bir ilişkide", "partnerin" gibi ifadeler yok). Bu kural
  `scripts/check-questions.mjs` ile üç dilde otomatik denetlenir; soru eklerken/değiştirirken çalıştır.
- **Arayüzde "partner" kelimesi sabit yazılmaz.** Karşı oyuncuya atıf içeren her metin
  `rel` parametresiyle ICU `select` kullanır (`relKey()` — `lib/relationship.ts`); bkz. `messages/*.json`
  içindeki `{rel, select, friend {…} dating {…} partner {…} other {…}}` kalıpları. Landing metinleri
  oda bağlamı olmadığı için sabit kalır.
- **Geri bildirim:** Sonuç ekranında isteğe bağlı mini anket (1 dokunuşla puan, AI ilgisi, yorum).
  **Zorunlu yapılmaz** (veri kalitesi + akışın kısa kalması ilkesi). Puan vermeden "Tekrar oyna"/"Ana
  Sayfa"ya basan kullanıcıya oda başına yalnızca bir kez yumuşak bir çıkış istemi gösterilir; her çıkış
  yolu kullanıcıyı gitmek istediği yere götürür.
- **Marka/iletişim:** Domain `gameofus.app`; Instagram `@gameofus.app` (`lib/social.ts`). Sonuç
  ekranında ve footer'da yalnızca sade bir takip bağlantısı vardır; sonucu Instagram'da paylaşma
  özelliği henüz yoktur.
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
- **next-intl** ile çoklu dil (TR/EN/ES). Algılama sırası: cookie → `Accept-Language` → `en`; URL
  prefix (`/tr`, `/en`, `/es`) ile manuel override desteklenir.
- **Fontlar self-host edilir:** Quicksand `next/font/google` ile; ikonlar için **Material Symbols
  alt kümesi** (`app/fonts/material-symbols.woff2`, ~14 KB, `display: block`). Harici Google font/CSS
  isteği yoktur. **Yeni bir ikon adı eklediğinde `npm run icons` çalıştır** (kodda kullanılan ikonları
  tarayıp alt kümeyi yeniden üretir); aksi halde ikon boş görünür. İkon sınıfı
  `.material-symbols-outlined` için `height` verme (satır yüksekliğiyle çakışıp glifi kaydırır).
- **Paylaşım önizlemesi (Open Graph):** görsel `public/og-image.png`; `generateMetadata` içinde açıkça
  verilir ve `metadataBase = https://gameofus.app` kullanılır. Dosya-tabanlı `opengraph-image`
  rotasını **`[locale]` altına koyma** (Vercel build'inde "failed to find source route" hatası verdi).

### Backend
- **Supabase**: Postgres, Realtime, Auth (Faz 1 — premium akış için), Edge Functions (opsiyonel).
- **Next.js server-side API route / server action**: oda oluşturma, cevap/tahmin kaydetme,
  sonuç hesaplama, token doğrulama.

### Deploy
- **Vercel**; fonksiyon bölgesi Supabase ile aynı olmalı (**Frankfurt, `fra1`**) — her sorgu bölgeler arası
  gidiş-dönüş maliyeti taşır, bu yüzden API route'larında bağımsız sorgular paralel çalıştırılır.
- Next.js sürümü **sabitlenir** (`16.2.6`, `latest` kullanılmaz); sürüm yükseltmesi bilinçli yapılır.
- Alan adı: `gameofus.app`.

### Ödeme
- **Web'de ödeme / login / premium UI yoktur.** Web yalnızca premium kategorileri kilitli gösterir ve
  "mobil uygulamada açılır" mesajı verir.
- Ödeme **yalnızca mobilde**, App Store / Play Store IAP (RevenueCat) ile; Lemon Squeezy
  **kullanılmaz**. Güncel model **coin + tier**'dir (Lite / Premium paketleri; bkz. PRD Bölüm 12).
  Mobil tarafın ayrıntılı iş listesi `gameofus-mobile/tasklist.md` içindedir.

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

### Kayıtlı kullanıcı modeli (yalnızca mobil)
- **Web'de ücretsiz oyun anonimdir.** Mobilde her oyun için giriş zorunludur (Google / Apple,
  Supabase Auth); oturum Supabase JWT ile korunur.
- Mobil odalar `user_id` ile ilişkilendirilir. Coin ve tier `users` tablosunda (`room_credits` = coin bakiyesi, `tier`),
  tüm coin hareketleri `credit_transactions`'ta tutulur. **Coin yalnızca sunucuda** `apply_coins` (SQL, atomik + idempotent,
  yalnızca service role) ile değişir; istemci miktar göndermez, yalnızca `reason`/`refId` bildirir. Kimlik doğrulama
  `lib/auth.ts` (`getAuthUser`: Bearer Supabase JWT); katılımcı token'ı (64 hex) ile karışmaz. Fiyatlar/ödüller `lib/coins.ts`.
  Ekonomi: kayıt +500 (Auth trigger'ı) · reklam +100 (günde 5) · oda −250 · AI yorum −100 · solo +20 / solo AI −100.
  **Web bu bilgiyi hiçbir API isteğinde sormaz veya taşımaz** (web odaları anonim ve ücretsiz kalır).
  **Mobilde misafir/anonim yoktur:** oda kuran da katılan da giriş yapmıştır (`platform: "mobile"` + Bearer JWT, yoksa 401);
  katılımcı `participants.user_id`'ye bağlanır (geçmiş ve hesap silme için). **Hesap silme:** `DELETE /api/users/me`
  (`delete_user_account` RPC + Auth kaydı); kurulan odalar silinir, başkalarının odalarındaki katılım anonimleştirilir,
  satın alma kayıtları kullanıcıdan ayrılmış halde yasal süre tutulur.

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
| `rooms` | Oyun odaları (`locale`, `relationship_type`, `category_id`) | `unique(room_code)`, `relationship_type in ('friend','dating','partner')` (nullable) |
| `participants` | Owner/guest kayıtları | `unique(room_id, role)`, `unique(room_id, token_hash)` |
| `categories` | Dil bazlı kategori satırları; `relationship_types text[]`, `is_premium`, `sort_order` | `unique(slug, locale)` |
| `questions` | Soru bankası (satır bazlı `locale`, `translation_group_id`, `insight_tag`, `is_active`) | — |
| `question_options` | Prediction modu seçenekleri | `unique(question_id, sort_order)` |
| `room_questions` | Odaya atanmış sorular ve sıraları | `unique(room_id, round_order)`, `unique(room_id, question_id)` |
| `answers` | Oyuncu cevapları | `unique(room_id, question_id, participant_id)` |
| `predictions` | Tahminler + güven seviyesi | `unique(room_id, question_id, predictor_participant_id, target_participant_id)` |
| `results` | Okuma skoru + detay JSON | `unique(room_id)` |
| `payments` | Lemon Squeezy ödemeleri (Faz 2) | `unique(provider_event_id)` |
| `rate_limits` | Abuse kontrol (opsiyonel) | — |
| `feedback` | Sonuç ekranı mini anketi (puan 1–5, `wants_ai`, kısa yorum, oda meta verisi) | `unique(room_id, participant_id)` |

**Metrik görünümleri** (yalnızca SQL editöründen/servis anahtarıyla okunur; `security_invoker` +
`anon/authenticated` erişimi kapalı; `TEST-%` isimli katılımcısı olan odalar hariç):
`metrics_daily_funnel` (oda → partner katıldı → sonuç hazır), `metrics_participant_status`,
`metrics_feedback_summary`.

### Soru bankası kuralları
- **Soruları silme, pasife al** (`is_active = false`). `room_questions` cascade ile silinir ve
  `answers`/`predictions` soruya cascade'siz bağlıdır; silmek mevcut odaları, sonuçları ve geçmişi bozar.
- Oda oluşturma yalnızca `is_active = true` soruları seçer.
- Mevcut set (v2): **11 kategori × 30 soru** (mod başına 10: Secret Choice / Prediction / Orderline),
  **her dilde** (TR/EN/ES), toplam 990 satır. Her sorunun, AI yorumu için kullanıcıya görünmeyen bir
  `insight_tag`'i vardır. Prediction/Orderline'da her soru tam 4 seçeneklidir.

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
- Analytics event'lerinde **bireysel cevap içeriği tutulmaz**, yalnızca davranış metrikleri. Aynı kural
  `feedback` tablosu için de geçerlidir: puan, AI ilgisi, kısa yorum (≤ 500 karakter) ve oda meta verisi
  (dil, mod, ilişki türü) tutulur; cevap/tahmin içeriği tutulmaz.
- `feedback` yazımı yalnızca token doğrulayan `POST /api/feedback` üzerinden yapılır; RLS açık ve hiç
  policy yoktur (client doğrudan okuyamaz/yazamaz). Anket yalnızca sonuçlar hazır olduktan sonra kabul
  edilir.
- **AI yorum (planlanan):** Cevaplar üçüncü taraf bir LLM'e (Groq) gönderileceği için, uygulamaya
  almadan önce gizlilik/rıza değerlendirmesi ve yalnızca yapılandırılmış cevapların (seçilen seçenek
  metni, sıralama) gönderilmesi kuralı netleştirilmelidir. Doğum tarihi gibi ek kişisel veriler yalnızca
  mobil tarafta ve gerekçesiyle toplanır.

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
- Soru: senaryo bazlı, çoktan seçmeli (v2 setinde her soru tam **4** seçenekli; birbirinden net ayrışan tavırlar).
- Seçenekler `question_options` tablosundan çekilir.
- Oyuncu "sen ne yaparsın?" sorusuna kendi seçeneğini işaretler.
- Partner için "o hangisini seçer?" tahminini aynı seçenekler arasından yapar.
- Doğru/yanlış binary'dir; yakın tahmin yok.
- Veri formatı: `answer_value: { "option_id": "<question_options.id>" }`.

### Orderline (Faz 1)
- Soru: 4 kartı önem/tercih sırasına diz (v2 setinde her soru 4 kartlı).
- Kartlar `question_options` tablosundan çekilir; `sort_order` yalnızca görüntüleme sırasıdır.
- Oyuncu kartları kendi sıralamasına göre dizer (drag-and-drop veya sıra numarası seçimi).
- Partner için "o nasıl sıralar?" tahminini aynı kartlarla yapar.
- Doğru/yakın/yanlış kuralı Bölüm 6'daki tabloya göre uygulanır.
- Veri formatı: `answer_value: { "order": ["<option_id_1>", "<option_id_2>", ...] }`.
- `order` dizisinin 1. elemanı en tercihli / önemli karttır.

### Karma
- Oda oluşturulurken "Karma" modu seçilirse, `room_questions`'a Secret Choice +
  Prediction + Orderline soruları karışık olarak atanır (10 soru: 4 / 3 / 3; 5 soru: 3 / 1 / 1).
- Her soru ekranı `questions.mode` değerine göre doğru UI bileşenini render eder.
- Skor hesaplama: her soru kendi modunun doğru/yakın/yanlış kuralına göre değerlenir.

### Oda oluşturma ve soru seçimi (`POST /api/rooms/create`)
- Girdi: ad, (opsiyonel) partner adı, `gameMode`, `questionCount` (5/10), `locale`, `relationshipType`,
  (opsiyonel) `categoryId`. Akış sırası: **ilişki türü → kategori → mod → soru sayısı**.
- Kategori seçimi dropdown'dır; varsayılan seçenek "Karışık Sürpriz" (kategori yok). Kategoriler sayfa
  açılırken bir kez çekilir, tür değişince istemcide filtrelenir; sunucu yine de uyumu doğrular
  (uyumsuzsa `INVALID_PAYLOAD`).
- **Soru havuzu:** oda diline ait + aktif + **ücretsiz** + **ilişki türüne uygun** kategoriler.
  Seçilen kategori önceliklidir; yetmezse **yalnızca aynı güvenli havuzdan** tamamlanır (başka türün
  sorusu ve premium kategori hiçbir zaman karışık havuza girmez). Hâlâ yetmezse `tr` havuzuna düşülür.
- Tüm havuz çekilip **gerçekten rastgele** seçilir (sıralamasız `limit(n)` her zaman aynı ilk satırları
  döndürür; kullanma).
- Kategoriler (v2): `friend_test`, `wild_scenarios`, `social_life` (yalnızca Kanka); `first_date`,
  `romance` (yalnızca Sevgili); `future`, `home_money` (yalnızca Hayat Arkadaşı); `communication`,
  `lifestyle`, `values` (üçü); `bold` (Sevgili + Hayat Arkadaşı, **premium**, 18+).

---

### Solo oyun: Red Flag Mayın Tarlası (web canlı; mobil planlı)
- Tek kişilik, 3×3 kapalı kart; her kartta bir durum ve **Green / Yellow / Red Flag** seçimi. **Doğru cevap yoktur**:
  sonuç yalnızca dağılımdan türeyen **tolerans profili**dir (`lib/solo.ts`: `computeProfile`; tolerans =
  `(green×2 + yellow) / 18`). **Arketip yoktur**; karnedeki başlık + tek cümlelik yorum yalnızca **Red sayısına (0-9)**
  göre sabittir (`solo.verdicts.<red>` → `title` + `line`, TR/EN/ES). Merak uyandırıcı ve hafif mizahi, kullanıcıyı
  yargılamaz/teşhis koymaz. Share kartı, link önizlemesi ve WhatsApp metni de aynı başlığı kullanır.
- **Setler (deste):** Oyun rastgele değil, **sabit setlerle** oynanır; böylece aynı setteki toleranslar karşılaştırılabilir.
  Her set 9 sabit kart (sabit sıra), 6 temanın tamamını kapsar, ton (sağlıklı/gri/endişe verici) dengelidir. İki kategori:
  **Arkadaşlık** (`friend-101…106`) ve **Sevgili** (`romantic-101…106`). **Webde yalnızca
  101-103 açık**; 104-106 "mobilde açılacak" (içerik yok, seçilemez). Set listesi/uygunluk: `lib/solo.ts` (`PACKS`,
  `WEB_PACK_NUMBERS`). Arkadaşlık setlerinde romantik çağrışım yoktur (check-solo denetler). Yeni set eklerken
  `seeds/solo/red-flag-packs.ts` içine slotları (pack/pos/tone) yaz, gerekirse senaryo ekle, `check-solo` →
  `build-solo-packs-migration.mjs` ve (webde açacaksan) `WEB_PACK_NUMBERS`.
- İçerik: `seeds/solo/red-flag.ts` (+ `red-flag-packs.ts`) — 65 senaryo, **54 aktif** (6 set × 9), 11 emekli (pasif, silinmez;
  geçmiş oturumlar kimliklerine başvurabilir). 6 tema: `boundaries`, `trust`, `communication`, `jealousy`,
  `money_lifestyle`, `respect`. TR/EN/ES, **ikinci tekil kişi** ("Sevgilin…", "your partner…", "tu pareja…") ile
  cinsiyetsiz yazılır. Denetim: `node scripts/check-solo.mjs`.
  Migration'lar: `20260605000000_solo_red_flag.sql` (ilk), `20260607…_deactivate_money_1.sql`,
  `20260608000000_solo_packs.sql` (`build-solo-packs-migration.mjs`: pack_key/pack_position, oturumda pack_key, 5 yeni senaryo, emekliler).
- Veri: `solo_scenarios` ve `solo_sessions` (ayrı model; `questions`'a **karıştırma**). Sunucu seçilen setin 9 kartını
  sabit sırayla döndürür (`pack_position`), oturuma `pack_key` yazar; cevaplar kart geçişlerinde sunucuya gitmez. Cevaplanan kartlar **düzenlenebilir** (karta dokun → seçimi değiştir); 9/9 olunca
  otomatik gönderilmez, kullanıcı **"Tamamlandı"** butonuna basınca tek `complete` isteğiyle DB'ye yazılır.
  API: `POST /api/solo/red-flag/start` (gövdede `pack` zorunlu), `POST /api/solo/[sessionId]/complete`.
- **Web:** anonim (token), **her sette 1 oyun** (`localStorage` `gou_solo_redflag_packs`, set anahtarına göre); oynanmış sete
  tekrar girince kayıtlı karne gösterilir. Giriş ekranında tüm setler tek açılır listede ("Kategori - 101"). Yarım kalan oyun
  `gou_solo_redflag_pending_packs` ile saklanır (sayfa yenilenince aynı oturum/cevaplar devam eder, bitince silinir); bu istemci tarafı bir UX katmanıdır, çerez/depolama temizlenirse yeniden oynanabilir; AI düğmesi pasif ("Mobil uygulamada"). Coin yoktur.
- **Mobil:** giriş zorunlu (`platform: "mobile"` + Bearer JWT, yoksa 401); oturum `user_id`'ye bağlanır. **Coin ödülü +20,
  her set için kullanıcı başına YALNIZCA BİR KEZ** (aynı seti tekrar oynamak ödülsüz; idempotency ref = set anahtarı) ve
  **günde en fazla 3 ödüllü oyun**; hepsi sunucuda `complete` içinde verilir (istemci "bitirdim" diyemez). Yanıtta
  `reward: { earned, balance?, reason? }` (`already_rewarded` / `daily_limit`). Geçmiş: `GET /api/users/solo-history` (+ `/[sessionId]`). AI analizi 100 coin (önce düş, LLM hatasında iade, oturum başına cache).
  AI'a yalnızca ilk isim (opsiyonel), 9 senaryo metni + bayrak + `insight_tag` ve dil gider; cinsiyet/e-posta
  gitmez ve oyun girişinde **hiçbir şey sorulmaz**.
- **Karne ekranı:** Red sayısına göre sabit başlık + cümle, mini ızgara, **Story görseli**, **WhatsApp'ta paylaş**
  (`wa.me` ile başlık + emoji ızgara + paylaşım linki), **"Cevaplarına göz at" kartı** (iki kişilik sonuç ekranındaki
  "Detayları gör" ile aynı dil: tıklayınca 9 kartın senaryo metni ve seçilen bayrak kart kart açılır; `localStorage`
  kaydında `details`/`sessionId`/`token` tutulur), pasif AI düğmesi, **geri bildirim kartı** (aynı `FeedbackCard`,
  `soloSessionId` ile), mobil CTA ve **sayfanın en sonunda "Ana sayfaya dön" butonu** (üstte geri butonu yok).
  "Sonucumu kopyala" kaldırıldı.
- Geri bildirim solo oturumuna da bağlanır: `POST /api/feedback` gövdesinde `soloSessionId` (token oturumun
  `token_hash`'ine karşı doğrulanır, oturum `completed` olmalı); `feedback.solo_session_id` unique, `feedback.game`.
  Metrik görünümünde `source` (`duo` / `solo_red_flag`).
- Dev sunucusunda (Turbopack) yeni Tailwind sınıfları bazen CSS'e girmez (ör. `w-9` boyutsuz görünür); üretim derlemesi
  doğrudur. Şüphede `next build && next start` ile doğrula.
- Paylaşım: `GET /api/solo/red-flag/card?g=<9 harf G/Y/R>&l=<dil>[&p=<set>][&q=<G|Y|R><senaryo id>,…][&fmt=og]` (`next/og`, 1080×1920;
  küçük ızgara + her bayraktan bir soru/cevap kartı (`q`, metin DB'den); `fmt=og` yatay 1200×630 link önizlemesi). Paylaşım linki `…/solo/red-flag?s=<kod>&p=<set>` — önizleme gönderenin karnesini gösterir (kişisel
  veri yok). Satori `React.Fragment` desteklemez (görselde `<g>`/`<div>` kullan); fontlar `public/fonts/*.woff`.
- Giriş noktaları: landing hero bağlantısı + bölüm (`#tek-basina`), footer, iki kişilik **bekleme** ve **sonuç**
  ekranlarında kapatılabilir `SoloPromoCard`. Oda oluşturma akışına **eklenmez** (oda modu değildir).
- Erişilebilirlik: bayraklar renk + ikon + etiket; açık kart `dialog` (Escape, odak); `prefers-reduced-motion` saygı.

---

## 11. Geliştirme Fazları

Ayrıntılı durum için `docs/PRD.md` Bölüm 21 esas alınır. Özet:

- **Web (tamamlandı, canlıda):** landing (4 adımlı "nasıl çalışır", mobil/AI teaser, footer), oda oluşturma
  (ilişki türü + kategori), 4 oyun modu (Secret Choice, Prediction, Orderline, Karma), birleştirilmiş tur,
  mikro-reveal, soft realtime, server-side sonuç, sonuç ekranı + geri bildirim, 3 dil, premium kategori
  kilidi (mobile yönlendirme), soru seti v2, ilişki türüne duyarlı metinler, metrik görünümleri.
- **Mobil (devam ediyor, ayrı repo):** giriş zorunlu (Google/Apple), coin + tier modeli, IAP, geçmiş,
  push, deep link, hesap silme, AI yorum. İş listesi: `gameofus-mobile/tasklist.md`.
- **Sıradaki web işleri:** coin/tier için `users/*` ve `iap/verify` endpoint'leri, AI yorum endpoint'i
  (`GET /api/rooms/[roomCode]/ai-commentary`, `results.ai_commentary`), hesap silme, doğum tarihi/yaş
  doğrulama (yalnızca mobil gerektirdiğinde), universal link dosyaları (`apple-app-site-association`,
  `assetlinks.json`), sonuç paylaşım kartları.
- **Sonraya:** PWA install prompt, admin panel, eski anonim oda temizleme job'u, HttpOnly cookie hardening.

---

## 12. Klasör & İçerik Konvansiyonları

### Soru seti (v2) — tek doğruluk kaynağı: `seeds/v2/`
| Yol | İçerik |
|---|---|
| `seeds/v2/<kategori>.ts` | Bir kategori: 30 soru (mod başına 10), her soru TR/EN/ES + `tag` |
| `seeds/v2/helpers.ts`, `types.ts` | `sc()` / `pr()` / `ol()` yardımcıları ve tipler |
| `scripts/check-questions.mjs` | Yapı denetimi (adet, 4 seçenek, yinelenen metin, uzunluk, eksik dil), **Kanka romantik-çağrışım denetimi** ve ilişki türü başına havuz denetimi (her modda ≥ 10) |
| `scripts/build-questions-migration.mjs` | Seed → `supabase/migrations/*_questions_v2_*.sql` (belirlenimci UUID v5 kimlikler) |
| `scripts/export-questions-md.mjs` | İnceleme belgeleri: `docs/questions-v2-{tr,en,es}.md` |
| `scripts/build-icon-font.mjs` (`npm run icons`) | Kullanılan ikonlardan font alt kümesi |
| `seeds/solo/`, `scripts/check-solo.mjs`, `scripts/build-solo-migration.mjs`, `scripts/export-solo-md.mjs` | Solo oyun senaryoları, denetimi, migration üretimi, `docs/solo-red-flag-{tr,en,es}.md` dökümü |

İş akışı: seed'i düzenle → `node scripts/check-questions.mjs` → `node scripts/build-questions-migration.mjs`
→ migration'ları sırayla çalıştır. Üretilen migration dosyalarını **elle düzenleme**.
Migration tasarımı: şema+kategoriler → sorular **pasif** eklenir (4 parça) → son adım sayıları doğrular,
eskileri pasife alır, yenileri aktifleştirir (atomik). Eski seed dosyaları (`seeds/questions.ts` vb.) ve
`20260525130000_seed_questions.sql` tarihsel referanstır; aktif set v2'dir.

### `questions` / `categories` locale yapısı
- Her soru `question_text` + `locale` ile tutulur; aynı sorunun dilleri `translation_group_id` ile
  bağlıdır. Kategori satırları da dil bazlıdır (`unique(slug, locale)`).
- Oda oluşturulurken `rooms.locale` ile eşleşen satırlar seçilir.

### Arayüz metinleri
- next-intl ile TR/EN/ES: `messages/tr.json`, `en.json`, `es.json` (üçü birlikte güncellenir).
- Karşı oyuncuya atıf yapan metinlerde `rel` ICU select kalıbı kullan (bkz. Bölüm 1).

### Dokümanlar
`docs/PRD.md` (ürün), `docs/ARCHITECTURE.md`, `docs/API_SPEC.md`, `docs/DATABASE_SCHEMA.md`,
`docs/GAME_LOGIC.md`, `docs/SEED_QUESTIONS.md` … Not: PRD ve bu dosya güncel tutulur; diğer
`docs/*` dosyaları bazı bölümlerde geride kalmış olabilir — çelişkide PRD → bu dosya → kod sırasıyla bak.

---

## 13. AI Ajanı İçin Genel Hatırlatmalar

- Yeni kod yazmadan önce ilgili PRD bölümünü ve bu dosyadaki kuralları kontrol et.
- Performans kurallarına (Bölüm 7) aykırı bir veri akışı önerme; özellikle soru geçişinde DB'ye
  gitme ve cevap+tahmini ayrı request'lere bölme.
- Kritik işlemleri (cevap/tahmin/sonuç/premium) client'ta hesaplama; server-side endpoint kullan.
- Partner verisini reveal öncesi expose edecek hiçbir sorgu/Realtime aboneliği ekleme.
- Token'ı URL'de taşıma, DB'de plaintext tutma.
- Agresif satış, geri sayım veya manipülatif metin üretme; ton sıcak ve yargılayıcı olmayan
  olmalı. Geri bildirimi zorunlu kılma; paylaşım/etiketleme çağrısını, özellik yokken ekleme.
- Soru eklerken/değiştirirken `scripts/check-questions.mjs`'i çalıştır; Kanka'ya açık hiçbir soruda
  romantik çağrışım olmamalı. Soruları **silme**, pasife al.
- Soru seçiminde ilişki türünü ve premium durumunu yok sayan bir sorgu yazma; tüm havuzu çekip karıştır.
- UI metnine "partner" yazma; `rel` select kalıbını kullan. Yeni ikon adı ekledinse `npm run icons`.
- API route'larında bağımsız Supabase sorgularını `Promise.all` ile paralel çalıştır; önce kritik
  yazmanın başarısını gerektiren adımları (ör. sonuç satırı → oda durumu) sıralı bırak.
- Oyun sayfalarında mobilde header sabit değildir ve her yeni soru ekranı sayfa başından açılır
  (`scrollTo(0)`); bu davranışı bozma.
- Test odaları açarken katılımcı adını `TEST-` ile başlat (metrik görünümleri bunları hariç tutar);
  oda oluşturma saatte 10 sınırına tabidir.
