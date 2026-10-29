# Vercel → self-host (Coolify) taşıma rehberi

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
- `docker build` gerçek ortamda henüz çalıştırılmadı (geliştirme makinesinde Docker yok).
