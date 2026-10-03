# SEED_QUESTIONS.md — Soru Bankası (v2)

Bu doküman soru bankasının **güncel (v2)** yapısını ve nasıl yönetildiğini anlatır. Soruların kendisi
`seeds/v2/` altındadır; okunabilir dökümler `docs/questions-v2-{tr,en,es}.md` dosyalarındadır.
Ürün kuralları için PRD Bölüm 20, şema için `DATABASE_SCHEMA.md` esas alınır.

> Eski v1 seti (5 kategori, çoğu yalnızca Türkçe, 75 + 75 soru) **pasife alınmıştır, silinmemiştir**
> (mevcut odalar, sonuçlar ve geçmiş ekranları bozulmasın diye). Aktif set yalnızca v2'dir.

---

## 1. Özet

| | |
|---|---|
| Kategori | 11 |
| Soru / kategori | 30 (10 Secret Choice + 10 Prediction + 10 Orderline) |
| Dil | TR, EN, ES — her soru üç dilde elle yazılmış/uyarlanmış (otomatik çeviri yok) |
| Toplam | 330 soru / dil → **990 satır** (`questions`), 2640 seçenek (`question_options`) |
| Seçenek | Prediction ve Orderline'da her soru tam **4** seçenek/kart; Secret Choice'ta seçenek yok (Evet / Kararsız / Hayır sabit) |
| Etiket | Her sorunun kullanıcıya görünmeyen `insight_tag`'i var (AI yorumu için tema) |

## 2. Kategoriler ve ilişki türü matrisi

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
| Cesur Sorular (premium, 18+) | `bold` | | ✓ | ✓ |

Ücretsiz havuz (premium hariç) her modda: Kanka 60, Sevgili 50, Hayat Arkadaşı 50 soru.
`sort_order`: ilişkiye özel kategoriler önce, ortaklar sonra, Cesur Sorular en sonda.

## 3. Yazım kuralları

- **Kanka'ya açık hiçbir kategoride (ortak olanlar dahil) romantik çağrışım olmaz.** "Partner", "sevgili",
  "aşk", "flört", "evlilik", "kıskançlık", "ilişki", ilk buluşma… ve EN/ES karşılıkları yasaktır.
  Ortak kategoriler (İletişim, Yaşam Tarzı, Değerler) tür-bağımsız yazılır. Otomatik denetlenir.
- **Cesur Sorular:** açık cinsel içerik yok; "cesur/romantik" çerçevede dürüstlük, kırılganlık, sınırlar.
- **Hayat Arkadaşı:** evlilik/çocuk gibi hassas konular varsayılmaz.
- **AI için bilgilendirici cevap:** soru bir tercih, ödünleşme ya da davranış ortaya koymalı; Prediction/Orderline
  seçenekleri "iyi/daha iyi" değil, birbirinden net ayrışan **farklı tavırlar** olmalı.
- Ton sıcak, yargılayıcı olmayan. Soru metni ≤ 160 karakter, seçenek ≤ 80 karakter.
- Orderline'da sıranın 1. elemanı "en çok / en önemli / en rahatsız eden" anlamına gelir; soru metni bunu
  açıkça söylemelidir ("…, en çok uyandan başlayarak sırala").
- Aynı metin hiçbir dilde iki kez geçmez (kategori içi ve kategoriler arası); her sorunun `tag`'i benzersizdir.

## 4. Dosya biçimi (`seeds/v2/<kategori>.ts`)

```ts
import type { SeedCategory } from "./types.ts";
import { sc, pr, ol } from "./helpers.ts";

export const communication: SeedCategory = {
  slug: "communication",
  names: { tr: "İletişim", en: "Communication", es: "Comunicación" },
  relationshipTypes: ["friend", "dating", "partner"],
  isPremium: false,
  sortOrder: 8,
  questions: [
    // Secret Choice: sc(tag, tr, en, es)
    sc("conflict_cooling",
      "Bir tartışma sırasında önce biraz ara verip sakinleşmeyi tercih eder misin?",
      "During a disagreement, do you prefer to take a break and cool down first?",
      "En un desacuerdo, ¿prefieres tomarte un descanso y calmarte primero?"),

    // Prediction / Orderline: pr|ol(tag, [metin, [4 seçenek]], [en…], [es…])
    pr("conflict_style",
      ["Biriyle fikir ayrılığına düştün … Genelde ne yaparsın?", ["…", "…", "…", "…"]],
      ["…", ["…", "…", "…", "…"]],
      ["…", ["…", "…", "…", "…"]]),
  ],
};
```

Kimlikler belirlenimcidir (UUID v5; `slug:tag:lang`), bu yüzden aynı soru her migration'da aynı `id`'yi alır.

## 5. İş akışı

```bash
# 1) seeds/v2/ altında düzenle
node scripts/check-questions.mjs            # yapı + Kanka romantik-çağrışım + havuz denetimi
node scripts/export-questions-md.mjs tr     # (ops.) docs/questions-v2-tr.md (en|es için de)
node scripts/build-questions-migration.mjs  # supabase/migrations/*_questions_v2_*.sql üretir
# 2) migration'ları SIRAYLA çalıştır: schema → part1..4 → activate
```

`check-questions.mjs` şunları denetler: kategori başına 10/10/10, Prediction/Orderline'da 4 seçenek,
üç dilde metin, yinelenen metin, uzunluk, benzersiz/geçerli `tag`, Kanka'ya açık kategorilerde yasak
sözcükler ve ilişki türü başına ücretsiz havuzun her modda ≥ 10 olması. Hata varsa çıkış kodu 1'dir;
migration üretmeden önce temiz olmalı.

### Migration tasarımı
1. **schema:** `questions.insight_tag` kolonu + kategorilerin (ad, sıra, `relationship_types`, premium) upsert'i.
2. **part1..4:** yeni sorular ve seçenekler **pasif** eklenir (canlıyı etkilemez, tekrar çalıştırmak güvenlidir).
3. **activate:** sayıları, kategori eşleşmesini ve seçenek sayılarını doğrular; geçerse eski soruları pasife alıp
   yenileri aktifleştirir (tek işlemde). Doğrulama başarısızsa hiçbir şey değişmez.

Üretilen SQL dosyalarını **elle düzenleme**; seed'i düzeltip yeniden üret.

## 6. Mevcut bir soruyu değiştirmek / eklemek

- **Metin düzeltmesi:** seed'de metni düzelt, yeniden üret. Kimlikler sabit olduğu için aynı satır hedeflenir;
  ancak mevcut veritabanı için ayrı bir "metin güncelleme" migration'ı (`update … where id = …`) yazılmalıdır
  (`on conflict do nothing` mevcut satırı güncellemez).
- **Yeni soru:** yeni benzersiz `tag` ile ekle; kategori başına hedef 10'u aşarsa `check-questions.mjs`'in
  `TARGET` değerini bilinçli olarak güncelle (10'luk tek modlu oyun tüm havuzu tüketir; havuzu büyütmek tekrar
  oynanabilirliği artırır).
- **Soruyu kaldırmak:** silme, `is_active = false` yap (`answers`/`predictions`/geçmiş bozulmasın).
- **Yeni dil:** satır bazlı yapı sayesinde şema değişikliği gerekmez; her soru için yeni `locale` satırı ve kategori
  satırları eklenir.

## 7. Soru seçimi (çalışma zamanı)

`POST /api/rooms/create`: oda diline ait + aktif + ücretsiz + ilişki türüne uygun kategorilerden; seçilen kategori
önceliklidir, yetmezse yalnızca aynı güvenli havuzdan tamamlanır; tüm havuz çekilip rastgele seçilir (Karma: 10
soruda 4/3/3). Ayrıntı: `API_SPEC.md` Bölüm 4.

## 8. AI yorum için `insight_tag`

Tag'ler tema etiketidir (ör. `conflict_style`, `planning_style`, `love_language`, `money_generosity`,
`honesty_vs_tact`, `group_role`). AI yorumu (planlanan, mobil) cevapları bu temalara göre gruplayıp ilişki
türüne uygun, yargılayıcı olmayan bir yorum üretir. AI'a yalnızca yapılandırılmış cevaplar (seçilen seçenek metni,
sıralama) ve tag'ler gönderilir; serbest metin yoktur. Gizlilik/rıza konusu için bkz. PRD Bölüm 12.3 ve 18.
