# Vercel → self-host (Coolify) taşıma rehberi

> **DURUM (2026-11-21): TAŞINDI.** Üretim Hetzner CX23 + Coolify + Cloudflare'de çalışıyor; Vercel yalnızca geri dönüş için açık. Güncel mimari, işletim ve açık işler: **§10**. Aşağıdaki §1-§9 taşıma planıdır (tarihsel).

> Amaç: Canlıya Vercel Pro ile çıkıp, maliyet ya da ihtiyaç doğduğunda **kesintisiz** self-host'a geçebilmek.
> Bu belge hem "şimdi yapılan hazırlıkları" hem "taşıma günü adımlarını" içerir. Karar ve gerekçeler: CLAUDE.md §2 (Deploy).

Mimari özet: uygulama **stateless**; veri Supabase'te kalır (taşınmaz), yalnızca Next.js sunucusu (Docker imajı) yer değiştirir.
Mobil uygulama API'ye **`https://gameofus.app`** alan adıyla bağlanır → taşıma uygulama güncellemesi gerektirmez.

---

## 1. Hazırlık durumu (kodda yapılanlar)

| # | Hazırlık | Durum | Not |
|---|---|---|---|
| 1 | `pg_cron` ile günlük temizlik | Migration yazıldı: `20260621000000_pg_cron_cleanup.sql` | **Henüz çalıştırılmadı** (bkz. §3) |
| 2 | IP başlığı yapılandırılabilir | Yapıldı: `CLIENT_IP_HEADER` (`lib/rate-limit.ts`) | Vercel'de ayarlanmaz, davranış aynı |
| 3 | `standalone` derleme | Yapıldı: `BUILD_STANDALONE=1` (`next.config.ts`) | Vercel'de ayarlanmaz |
| 4 | Dockerfile + `.dockerignore` | Yapıldı | `docker build` gerçek ortamda henüz denenmedi |
| 5 | Polling seyrekleşir, sekme gizliyken durur | Yapıldı (`game/room/[roomCode]/page.tsx`) | Hem Vercel'de hem self-host'ta yük azaltır |
| 6 | Mobil API adresi alan adı | **Mobil repoda doğrula** | `*.vercel.app` olmamalı |
| 7 | DNS Cloudflare'de | **Sen yap** | Taşıma günü geri dönüşü dakikalara indirir |
| 8 | Supabase paketlerinin sürümü sabit | **Yapılacak** | `package.json`'da `latest` var; kilit dosyası var ama `npm update` sürprizi çıkarabilir |

`vercel.json` (cron) ve `/api/cron/cleanup` **taşıma bitene kadar yerinde kalır**; pg_cron doğrulanınca silinir (§5).

---

## 2. Vercel'e özgü bağımlılıklar (ve karşılıkları)

| Vercel'de | Self-host'ta |
|---|---|
| `vercel.json` cron → `/api/cron/cleanup` | `pg_cron` (`cleanup_expired_data_all()`), `CRON_SECRET` gerekmez |
| `x-forwarded-for` platform tarafından yazılır | `CLIENT_IP_HEADER=cf-connecting-ip` (Cloudflare önde, origin yalnızca Cloudflare'e açık) |
| CDN, `Cache-Control: s-maxage` başlıklarını uygular (paylaşım kartı) | Cloudflare proxy önde olmalı; yoksa her kart isteği sunucuda render edilir |
| Fonksiyon bölgesi `fra1` | Sunucu Frankfurt'a yakın (Hetzner Falkenstein/Nürnberg) |
| Env değişkenleri panelden | Coolify'dan |
| `after()` Vercel'in `waitUntil`'i ile | Node container'da süreç yaşadığı için çalışır |

---

## 3. pg_cron'u etkinleştirme ve doğrulama (taşımadan bağımsız, önce yap)

1. Supabase Dashboard → Database → Extensions → **pg_cron**'u aç.
2. `supabase/migrations/20260621000000_pg_cron_cleanup.sql` dosyasını SQL Editor'de çalıştır (önce oku).
3. Zamanlamayı gör: `select jobid, jobname, schedule, active from cron.job;` → `cleanup-expired-data`, `17 3 * * *`.
4. Elle bir kez dene: `select * from public.cleanup_expired_data_all();` (silinecek veri varsa sayılar döner).
5. Ertesi gün: `select status, start_time, return_message from cron.job_run_details order by start_time desc limit 5;` → `succeeded`.
6. Vercel Cron ve pg_cron birlikte çalışabilir (idempotent). Birkaç gün sorunsuzsa §5'teki silme adımlarını yap.

> Not: `pg_cron` işleri `postgres` rolüyle çalışır. Ücretsiz planda proje 1 hafta etkinlik olmazsa duraklatılır; duraklamada cron da durur.

---

## 4. Ortam değişkenleri

**Derleme zamanı (imaja gömülür → Docker `--build-arg` / Coolify "Build Variable"):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (örn. `https://gameofus.app`)

**Çalışma zamanı (yalnızca sunucuda, imaja GİRMEZ):**
- `SUPABASE_SERVICE_ROLE_KEY` (**çok hassas**: tüm veritabanına tam erişim)
- `GROQ_API_KEY`, `OPENROUTER_API_KEY` (AI sağlayıcıları)
- `APP_BASE_URL`
- `AI_PRIMARY`, `AI_FALLBACK`, `AI_DAILY_LIMIT_GROQ` (varsa; varsayılanlar `lib/ai/config.ts`'te)
- `CLIENT_IP_HEADER=cf-connecting-ip` (yalnızca Cloudflare arkasında, §6)
- `CRON_SECRET` → pg_cron'a geçince **gerekmez**
- `AI_ALLOW_TEST_OVERRIDE` → **üretimde asla tanımlama** (yalnızca yerel testler)

Değerleri bir parola yöneticisinde sakla (sunucu gidince yeniden yazman gerekir). Bu belgeye değer yazma.

---

## 5. Taşıma günü adımları

1. **Sunucu:** Hetzner (≥ 2 vCPU / 4 GB; 8 GB daha rahat) → SSH anahtarı, güvenlik duvarı (22, 80, 443), otomatik güvenlik güncellemeleri, swap (2-4 GB).
2. **Coolify:** kur, **ilk yönetici hesabını hemen sen oluştur**, panele bir alan adı bağla, 8000 portunu dışarıya kapat.
3. **Uygulama:** repoyu bağla, Dockerfile ile derle (derleme belleği için bkz. §7), env değişkenlerini gir, sağlık kontrolü yolunu belirle (örn. `/en`).
4. **Staging:** `staging.gameofus.app` alt alanına yönlendir. Test et:
   - Oda kur → ikinci tarayıcıyla katıl → tüm turu oyna → sonuç açılıyor mu.
   - Solo Red Flag (+ paylaşım kartı: `/api/solo/red-flag/card?...`).
   - Dil yönlendirmesi (`/` → `/tr`/`/en`/`/es`, cookie).
   - Mobilde giriş, oda kurma, AI yorum (sandbox/test hesabıyla).
   - Hız sınırı gerçekten IP başına çalışıyor mu (§6).
5. **DNS:** TTL'i düşür (örn. 60 sn), `gameofus.app` kaydını yeni sunucuya (Cloudflare proxy açık) çevir.
6. **Gözlem:** Vercel projesini 3-7 gün **açık bırak** (geri dönüş = DNS'i eski değere çevirmek).
7. **Temizlik:** sorun yoksa Vercel aboneliğini iptal et; repodan `vercel.json` ve `app/api/cron/cleanup/route.ts` sil; `CRON_SECRET`'ı kaldır; `proxy.ts` matcher'ındaki `_vercel`'i çıkar; CLAUDE.md/PRD'deki Vercel/`fra1` ifadelerini güncelle.

---

## 6. Hız sınırı ve IP (güvenlik)

- Self-host'ta ters proxy arkasındaysan `x-forwarded-for`'ın **ilk** değeri istemci tarafından yazılmış olabilir → hız sınırları atlatılır.
- Çözüm: origin'e **yalnızca Cloudflare** erişsin (güvenlik duvarında yalnızca Cloudflare IP aralıklarına 80/443 izni ya da Cloudflare Tunnel) ve `CLIENT_IP_HEADER=cf-connecting-ip` ayarla. Origin doğrudan erişilebilirse bu ayarı **yapma**.
- Doğrulama: aynı IP'den `POST /api/rooms/create`'i saatte 10'dan fazla dene (test odaları `TEST-` ile başlasın) → `429`.
- Mobil kullanıcılar çoğunlukla CGNAT arkasında aynı IP'yi paylaşır; sınırlar (oda kurma 10/sa, katılma 10/dk) viral dalgada meşru kullanıcıları engelleyebilir → yük öncesi gözden geçir.

---

## 7. Derleme belleği

- `next build` bellek yer; 4 GB sunucuda Coolify + çalışan eski sürüm + derleme birlikte sığmayabilir (OOM).
- Önlemler (sırayla): swap ekle → (gerekirse) imajı GitHub Actions'ta derleyip registry'den çek → daha büyük sunucu.
- Aynı Dockerfile amd64 ve arm64'te derlenir; ARM sunucuda (CAX) x86 CI çalıştırıcısında derlemek emülasyonla yavaştır.

---

## 8. Yedek ve geri dönüş

- Supabase ücretsiz planda **otomatik yedek yoktur**. Zamanlanmış `supabase db dump` (roles + schema + data), şifreli ve sunucudan ayrı bir yere; **bir kez geri yükleme provası** yap.
- `data.sql` içinde `auth.users` verisinin olup olmadığını ilk yedekte kontrol et (mobil hesaplar).
- Yeni projeye geri yüklemek Supabase URL/anahtarlarını değiştirir ve mobil uygulamayı bozar → felaket senaryosunda aynı projeye geri yükleme ya da Pro'nun yerinde geri yüklemesi tercih edilir.
- Supabase Pro'ya geçiş tetikleyicileri: ilk gerçek satın alma, egress ≈ %70, DB ≈ 300 MB.

---

## 9. Bilinen açık konular

- ~~`/state` ve `/results` token'ı URL'de taşıyordu~~ → **Düzeltildi:** web artık `Authorization: Bearer` başlığını kullanıyor. Sunucuda `?participantToken=` eski istemciler için
  geçici yedek olarak duruyor; mobil build'lerin başlık kullandığını doğrulayınca `extractToken` çağrılarındaki query yedeğini kaldır (URL'ler proxy/CDN günlüklerine düşer).
- **Web'de herkese açık gizlilik / kullanım şartları / hesap silme sayfası yok** (politika `gameofus.app/account-deletion` adresinden söz ediyor). Store başvurusu herkese açık bir gizlilik politikası URL'si ister.
- `@supabase/ssr` ve `@supabase/supabase-js` sürümleri `latest` (sabitlenmeli).
- ~~`docker build` gerçek ortamda henüz çalıştırılmadı~~ → **Çalıştırıldı** (Coolify, sunucuda; x86'da `@resvg/resvg-js` dahil sorunsuz, derleme ~4 dk).

---

## 10. Güncel durum ve işletim (2026-11-21)

### Mimari
```
istemci → Cloudflare (ücretsiz, Proxied, SSL Full strict) → Hetzner CX23 (x86, Nürnberg, Ubuntu 24.04) → Traefik (Coolify) → gameofus-prod (Docker, :3000)
                                                                                                           └→ Supabase Cloud (Frankfurt): DB, Auth, Realtime
```
- **Alan adları:** `www.gameofus.app` kanonik; `gameofus.app` → `www`'ye 307 (Coolify "www redirect"). Web oyuncularının oda token'ları `localStorage`'da `www` kaynağına bağlı: kaynağı değiştirme.
  `coolify.gameofus.app` (yönetim paneli, 2FA açık), `staging.gameofus.app` (ayrı Supabase projesi). Alan adı kaydı Vercel'de, DNS Cloudflare'de.
- **Sunucu:** swap 4 GB, otomatik güvenlik güncellemeleri açık, SSH yalnızca anahtarla. `/data/coolify/source/.env` yedeği parola yöneticisinde.
- **Hetzner Firewall:** 22 herkese; 80/443 **yalnızca Cloudflare IP aralıklarına** (`cloudflare.com/ips-v4`, `ips-v6`; liste değişirse güncelle). Doğrudan IP erişimi kapalı
  (`curl -m 5 -k -sI https://<sunucu-ip>` zaman aşımı vermeli, çıkış kodu 28). Panel portları (8000, 6001, 6002) kapalı.

### Deploy
- `main`'e push → GitHub webhook (`coolify.gameofus.app`) → **yalnızca gameofus-prod** yeniden derlenir (~4 dk). Staging'e webhook YOK (4 GB RAM: iki eşzamanlı derleme belleği tüketir).
- Başarısız derleme çalışan sürümü kaldırmaz ("Deployment failed. Removing the new version"). Çalışma zamanı hatalarını yakalamak için Coolify'da Healthcheck (`GET /en`, 200) açık tutulmalı;
  imajda `curl` bulunur.
- Coolify ortam değişkenleri — **Build:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`. **Runtime:** `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`,
  `APP_BASE_URL`, `CLIENT_IP_HEADER=cf-connecting-ip`. `CRON_SECRET`, `AI_ALLOW_TEST_OVERRIDE`, `OVERVIEW_ALLOW_TEST_OVERRIDE` üretimde **tanımlanmaz**.
- **Ders:** Dockerfile build arg verilmeyen `NEXT_PUBLIC_*` değişkenini boş metin yapar; `??` boş metne düşmez (`new URL("")` derlemeyi düşürdü). Kodda `||` kullan.

### İzleme ve temizlik
- UptimeRobot: `/en`, `/tr`, `/api/categories` (5 dk). Coolify'ın kendi bildirimleri henüz kurulu değil.

### Cloudflare notları
- **Cache Rule** (Caching → Cache Rules): URI Path `starts with /api/solo/red-flag/card` → *Eligible for cache*, Edge/Browser TTL origin'in `Cache-Control` başlığına uyar (kart `s-maxage=31536000, immutable` gönderir).
  Uzantısız yollar Cloudflare'de varsayılan olarak önbelleğe alınmaz, kural olmadan `cf-cache-status: DYNAMIC` döner ve her benzersiz kart 1,2-2,4 sn CPU harcar. Doğrulama: aynı kartı iki kez iste → `MISS`, sonra `HIT`.
- **Hız sınırı IP'si doğrulandı** (2026-11-21): bulunamayan koda 12 ardışık `GET /api/rooms/ZZZ999/state` → 10 × `404`, sonra `429`; sahte `X-Forwarded-For` başlığı da `429` aldı (yani `CLIENT_IP_HEADER=cf-connecting-ip` okunuyor,
  başlık taklit edilemiyor). Bu ayar kaldırılırsa istemci kendi `X-Forwarded-For`'ını göndererek sınırı atlatabilir.
- **Zaman aşımı:** Cloudflare ~100 sn sonra `524` döner. AI üretimi bunun altında kalır (ana model ~20 sn + yedek ~15 sn zaman aşımı); modelleri/zaman aşımlarını artırırsan bunu hatırla.
  Koddaki `maxDuration = 60` yalnızca Vercel'de etkiliydi, kendi sunucumuzda zorlanmaz.
- `pg_cron`: günlük 03:17 UTC `cleanup_expired_data_all()`. Doğrula: `select * from cron.job;`, `select status, start_time from cron.job_run_details order by start_time desc limit 5;`

### Geri dönüş (Vercel hâlâ açıkken)
Cloudflare DNS'te `gameofus.app` ve `www` A kayıtlarını Vercel adreslerine çevir (`64.29.17.1`, `216.198.79.65`; `www` için ayrıca `64.29.17.65`), **DNS only** yap, SSL modunu **Full**'a al.
Vercel Hobby planı ticari kullanıma kapalıdır: bu yalnızca kısa süreli geri dönüş içindir.

### Açık işler
1. **Supabase yedeği** (R2'ye zamanlanmış `pg_dump`, geri yükleme provası): store başvurusundan önce. Ücretsiz planda otomatik yedek yoktur; ilk satın almada Pro.
2. Mobil uygulamanın API için `gameofus.app` mi `www` mi çağırdığını mobil repoda doğrula (apex → `www` 307; bazı istemciler farklı alan adına yönlendirmede `Authorization` başlığını düşürür).
3. Birkaç gün sorunsuz çalışınca: `vercel.json` ve `app/api/cron/cleanup/route.ts`'i sil, Vercel projesini kapat, `proxy.ts` matcher'ındaki `_vercel`'i çıkar.
4. Coolify bildirimleri (Telegram/Discord), `npm audit` (aylık).
5. **Reklam SSV geri çağrısı** (`/api/ads/ssv`) yazılınca Google'ın istekleri Cloudflare WAF / bot korumasına takılmamalı: o yol için bir *skip* kuralı ekle ve Google'ın doğrulama aracıyla test et.
6. **Universal link dosyaları** (`apple-app-site-association`, `assetlinks.json`): yönlendirmesiz ve `Content-Type: application/json` ile sunulmalı (`next.config.ts` `headers()`).
   Apex (`gameofus.app`) `www`'ye 307 verdiği için uygulamadaki *associated domains* kaydı **`www.gameofus.app`** olmalı (Apple yönlendirme kabul etmez). Yol `.well-known` noktası içerdiği için
   `proxy.ts` matcher'ı (dil yönlendirmesi) bu dosyaları zaten atlar.
