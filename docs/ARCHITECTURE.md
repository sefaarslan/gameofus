# ARCHITECTURE.md — Game of Us

Bu doküman Game of Us MVP mimarisini tanımlar. Amaç, Claude Code ve diğer AI ajanlarının gereksiz karmaşıklık eklemeden, güvenli ve hızlı bir MVP geliştirmesidir.

---

## 1. Mimari Özeti

Game of Us, iki kişilik link bazlı, anonim başlayabilen, mobil öncelikli bir web oyunudur.

MVP mimarisi:

```txt
Next.js App Router
TypeScript
Tailwind CSS
next-intl
Supabase Postgres
Supabase Realtime
Next.js API Routes / Server Actions
Vercel Deploy
```

Faz 1'de ödeme ve zorunlu login yoktur. Premium ekran mock olarak gösterilir.

---

## 2. Temel Teknik Kararlar

| Konu | Karar |
|---|---|
| Frontend | Next.js App Router |
| Backend | Next.js server-side API routes / server actions |
| Database | Supabase Postgres |
| Realtime | Supabase Realtime, sadece status değişiklikleri için |
| Auth | Faz 1'de ücretsiz oyunda login yok |
| Token | `participant_token` client'ta, `token_hash` DB'de |
| Payment | Faz 2'de Lemon Squeezy |
| Deploy | Vercel |
| UI | Stitch çıktılarından üretilen Tailwind/React bileşenleri |
| Component library | shadcn/ui vb. kullanılmaz |
| Edge Function | MVP için kullanılmaz / belirtilmez |

---

## 3. Backend Yaklaşımı

Kritik işlemler client-only yapılmaz. Aşağıdaki işlemler server-side endpoint üzerinden doğrulanır:

- Oda oluşturma
- Odaya katılma
- Token doğrulama
- Cevap ve tahmin kaydetme
- Mikro-reveal sonucu hesaplama
- Oyuncu tamamlandı durumuna geçirme
- Sonuç hesaplama
- Sonuç okuma

Önerilen endpoint yaklaşımı:

```txt
Client → Next.js API Route → Supabase Service Role / Server Client → Postgres
```

Client doğrudan `answers`, `predictions` ve reveal öncesi hassas verilere erişmemelidir.

---

## 4. Realtime Yaklaşımı

Realtime sadece soft realtime durumlar için kullanılacaktır.

Realtime kapsamına girebilecek alanlar:

```txt
rooms.status
participants.status
participants.last_seen_at
```

Realtime kapsamına alınmayacak tablolar/veriler:

```txt
answers
predictions
partnerin gerçek cevapları
partnerin tahminleri
reveal öncesi sonuç detayları
```

Bu karar hem performans hem gizlilik için kritiktir.

---

## 5. Oyun Veri Akışı

### Oda oluşturma

```txt
Kullanıcı isim girer
→ API oda oluşturur
→ owner participant oluşturulur
→ raw participant_token client'a döner
→ token_hash DB'ye kaydedilir
→ room_code ile paylaşım linki üretilir
```

### Guest katılım

```txt
Guest linki açar
→ isim girer
→ API oda uygun mu kontrol eder
→ guest participant oluşturulur
→ raw participant_token client'a döner
→ token_hash DB'ye kaydedilir
→ oda status guest_joined olur
```

### Soru oynama

```txt
Room questions oyun başında tek seferde yüklenir
→ kullanıcı client state üzerinden sorular arasında ilerler
→ her soru sonunda cevap + tahmin tek request ile kaydedilir
→ partner cevabı varsa mikro-reveal türetilmiş sonuç döner
```

### Sonuç

```txt
İki oyuncu completed olduğunda
→ server-side sonuç hesaplama çalışır
→ results tablosuna tek kayıt yazılır
→ rooms.status = result_ready
```

---

## 6. Performans İlkeleri

- Oyun soruları başlangıçta tek seferde yüklenecek.
- Her soru geçişinde DB'ye gidilmeyecek.
- Cevap ve tahmin ayrı ayrı değil, tek request ile yazılacak.
- Sonuç hesaplama client'ta yapılmayacak.
- Realtime sadece status için kullanılacak.
- Ağ gecikmelerinde kullanıcıya kısa loading/fallback mesajları gösterilecek.

---

## 7. Fazlara Göre Mimari

### Faz 1

- Anonim oyun
- Secret Choice
- Link paylaşımı
- Token + hash modeli
- Soft realtime status
- Server-side scoring
- Premium mock ekran

### Faz 2

- Supabase Auth
- Lemon Squeezy ödeme
- Premium hak yönetimi
- Prediction ve Orderline
- Sonuç paylaşım kartları

### Faz 3

- PWA
- AI soru önerileri
- Admin panel
- Geçmiş oyunlar
- HttpOnly cookie hardening
