# SECURITY_AND_RLS.md — Game of Us

Bu doküman anonim link bazlı oyun modelinde güvenlik, gizlilik ve RLS beklentilerini tanımlar.

---

## 1. Ana Güvenlik İlkeleri

- Ücretsiz oyun login gerektirmez ama kimlik doğrulama token ile yapılır.
- İsim kimlik doğrulama aracı değildir.
- Partner cevapları reveal öncesi client'a ham veri olarak dönmez.
- Token URL'de taşınmaz.
- Token DB'de plaintext tutulmaz.
- Cevap ve tahmin kilitlendikten sonra değiştirilemez.
- Oda iki kişiyle sınırlıdır.
- Expired oda üzerinde yazma işlemi yapılamaz.

---

## 2. Anonim Token Modeli

### Owner

Oda oluşturulduğunda:

```txt
raw participant_token üretilir
token_hash hesaplanır
token_hash DB'ye yazılır
raw token client'a döner
```

Owner kimliği için isim kullanılmaz.

### Guest

Guest katıldığında aynı model uygulanır.

```txt
room_code + raw participant_token
→ server token hash hesaplar
→ participants tablosunda eşleşme arar
→ role ve erişim doğrulanır
```

### Token Saklama

MVP and Production hardening:

```txt
HttpOnly Secure SameSite cookie
```

### Yasaklar

```txt
Token query param olarak URL'de taşınmaz.
Token DB'de plaintext tutulmaz.
Owner adıyla owner recovery yapılmaz.
```

---

## 3. Veri Gizliliği

### Reveal öncesi yasak veriler

Client aşağıdaki ham verilere erişmemelidir:

```txt
partnerin gerçek cevabı
partnerin tahmini
partnerin confidence level bilgisi
tüm cevaplar listesi
tüm predictions listesi
```

### İzin verilen veri

```txt
room status
participant status
participant display names
question list
kendi cevap/tahmin progress bilgisi
tahmin kilitlendikten sonra ilgili sorunun türetilmiş mikro-reveal sonucu
result_ready sonrası sonuç detayları
```

---

## 4. Mikro-reveal Güvenlik Kuralı

Mikro-reveal yalnızca şu koşullarda döner:

```txt
1. Kullanıcı kendi cevabını verdi.
2. Kullanıcı partner tahminini kilitledi.
3. Partner aynı soruya daha önce cevap verdi.
4. Server yalnızca ilgili sorunun türetilmiş sonucunu hesapladı.
```

Dönmemesi gerekenler:

```txt
partnerin tüm cevapları
partnerin henüz oynanmamış sorularına ait bilgi
tahmin kilitlenmeden partner cevabına dair sinyal
```

---

## 5. RLS Yaklaşımı

MVP'de kritik işlemler server-side endpoint üzerinden yapılacağı için RLS daha kısıtlayıcı tutulabilir.

### Önerilen MVP yaklaşımı

- `answers` ve `predictions` için client select kapalı.
- Yazma işlemleri server-side API üzerinden.
- `results` sadece `result_ready` sonrası API üzerinden okunur.
- Public read sadece soru bankası gibi hassas olmayan veriler için düşünülebilir.

### Minimum RLS beklentileri

| Tablo | Client direct access |
|---|---|
| rooms | kısıtlı read |
| participants | kısıtlı read |
| questions | read |
| room_questions | read, sadece oda bağlamında |
| answers | direct select yok |
| predictions | direct select yok |
| results | direct select yerine API tercih edilir |

---

## 6. Server-side Kontroller

Her kritik endpoint aşağıdaki kontrolleri yapmalıdır:

```txt
room_code geçerli mi?
room expired mı?
participant_token geçerli mi?
participant bu odaya ait mi?
oda dolu mu?
participant bu soruya daha önce submit yaptı mı?
soru bu odaya atanmış mı?
iki oyuncu completed mı?
```

---

## 7. Rate Limit / Abuse Kontrol

Başlangıç limitleri:

```txt
Aynı IP/IP hash için saatte max 10 oda
Aynı IP/IP hash için günde max 50 oda
Aynı oda için max 2 participant
```

Oda dolduğunda:

```txt
join_locked = true
```

Rate limit ilk MVP'de basit Postgres tablosu veya middleware ile yapılabilir. Daha sonra Redis tabanlı çözüme geçilebilir.

---

## 8. Analytics Gizliliği

Analytics eventlerinde tutulabilir:

```txt
room_created
link_copied
whatsapp_shared
guest_joined
owner_completed
guest_completed
result_viewed
premium_mock_clicked
```

Tutulmamalı:

```txt
gerçek cevap metinleri
tahmin değerleri
partner isimleriyle birlikte cevap içerikleri
özel ilişki verileri
```

---

## 9. Expire Mantığı

- Ücretsiz oda: 24 saat
- Premium oda: 72 saat

Expire kontrolü:

```txt
expires_at < now()
```

Cron job gerekmez. Okuma/yazma anında kontrol edilir.

Expired oda:

```txt
yeni cevap kabul etmez
yeni guest kabul etmez
sonuç hazır değilse oyun devam ettirilmez
kullanıcıya süre doldu ekranı gösterilir
```
