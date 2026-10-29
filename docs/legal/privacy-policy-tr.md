# Gizlilik Politikası — Game of Us (TASLAK)

> **TASLAK — hukuki inceleme gerekir.** `[KÖŞELİ PARANTEZ]` içindekiler doldurulmalı/onaylanmalıdır. `(planlanan)` ile işaretli bölümler ilgili özellik yayına çıkana kadar metinden çıkarılmalı veya özellik canlıya alındığında geçerli sayılmalıdır. Bu metin mevcut sistemin gerçek veri akışına göre yazılmıştır (bkz. `CLAUDE.md`, `docs/DATABASE_SCHEMA.md`).

**Yürürlük tarihi:** [GG.AA.YYYY] · **Son güncelleme:** [GG.AA.YYYY]

## 1. Biz kimiz?

Game of Us ("biz"), iki kişinin birbirini daha iyi tanıması için tasarlanmış bir oyundur (web: gameofus.app, mobil uygulama ve tek kişilik "Red Flag Mayın Tarlası"). Kişisel verilerinizin sorumlusu:

**[ŞİRKET / KİŞİ ADI]**, [ADRES] · İletişim: **[destek@gameofus.app]**

Bu politika, KVKK (6698), GDPR ve ilgili mağaza (App Store / Google Play) kuralları gözetilerek hazırlanmıştır.

## 2. Hangi verileri topluyoruz?

### 2.1. Web'de (hesap gerekmez, anonim)
- **Oyunda görünen ad:** Odayı kurarken/katılırken yazdığınız ad. Gerçek adınızı yazmak zorunda değilsiniz; takma ad kullanabilirsiniz. Kimliğiniz ad ile doğrulanmaz.
- **Oyun içeriği:** Verdiğiniz cevaplar, tahminleriniz, güven seviyeleriniz ve oda ayarları (dil, ilişki türü, kategori, oyun modu, soru sayısı). Partnerinizin cevabı, siz tahmininizi kilitleyene kadar size gösterilmez.
- **Doğum tarihi:** Yalnızca **kendi** doğum tarihiniz. Oda kurarken isteğe bağlıdır. Web'den davetle katılırken yalnızca mobil uygulamadan kurulmuş bir odada sorulur: isteğe bağlıdır, yapay zekâ yorumuna izin verirseniz zorunludur (yaş aralığınız ve burcunuz yoruma ancak izin verirseniz girer; izin vermezseniz o oda için yorum hiç oluşturulmaz). Kullanım amaçları: girilmişse 13 yaş sınırını denetlemek ve yapay zekâ yorumuna izin verdiyseniz yorumun tonunu kişiselleştirmek. [DOĞRULA: amaçların hukuken yeterince açık olması; yeni bir amaç çıkarsa politika ve rıza güncellenir] Hesabınıza yazılmaz, yalnızca ilgili odayla birlikte tutulur ve oda silinince silinir. 13 yaşından küçükler uygulamayı kullanamaz, bu nedenle daha küçük bir tarih kabul edilmez ve saklanmaz.
- **Cinsiyet (isteğe bağlı):** Oda kurarken ya da — web'den davetle katılırken yalnızca mobil bir odada, isteğe bağlı olarak — yalnızca **kendi** cinsiyetiniz (kimse başkası adına girmez); yalnızca animasyonlu karakterleri çizmek ve yapay zekâ yorumlarında dil bilgisini doğru kurmak için kullanılır. Boş bırakabilirsiniz. Hesabınıza yazılmaz, yalnızca ilgili odayla birlikte tutulur ve oda silinince silinir.
- **Yapay zekâ rızası (isteğe bağlı):** Mobil uygulamadan kurulmuş bir odaya web'den katılırken, oda sahibi ileride yapay zekâ yorumu açarsa verilerinizin (adınız, cevaplarınız ve tahminleriniz; girdiyseniz yaş aralığınız, burcunuz ve — yalnızca İspanyolca odalarda — cinsiyetiniz) yapay zekâ hizmetine gönderilmesine izin verip vermediğinizi sorarız. Kutu varsayılan olarak boştur, vermemeniz oyuna katılmanızı etkilemez; vermezseniz o oda için yapay zekâ yorumu hiç oluşturulmaz. Kararınızın tarihi ve metin sürümü yalnızca o odayla birlikte saklanır ve oda silinince silinir. Yorum web'de gösterilmez.
- **Tek kişilik oyun:** "Green/Yellow/Red Flag" seçimleriniz ve tolerans sonucunuz.
- **Geri bildirim (isteğe bağlı):** Puan, AI yorumuna ilginiz ve en fazla 500 karakterlik yorum. Cevap/tahmin içeriği geri bildirim kaydına eklenmez.
- **Cihazınızda saklananlar:** Oda kodu, katılımcı anahtarınız (token) ve karneleriniz tarayıcınızın yerel depolamasında tutulur; oyun kurarken girdiğiniz bilgiler (adlar, seçimler) sayfa yenilenirse kaybolmasın diye yalnızca tarayıcı oturumunda geçici olarak tutulur ve oyun kurulunca ya da sekmeyi kapatınca silinir; dil tercihiniz bir çerezde (`NEXT_LOCALE`) saklanır. Katılımcı anahtarının yalnızca özeti (hash) sunucuda tutulur; ham anahtar adreste taşınmaz.
- **Teknik veriler:** Kötüye kullanımı önlemek için IP adresinizin **geri döndürülemez özeti** (hash) saklanır; ham IP adresi saklanmaz. Barındırma sağlayıcımız standart sunucu günlükleri tutabilir.

### 2.2. Mobil uygulamada (giriş zorunlu)
- **Hesap:** Google veya Apple ile giriş yaptığınızda e-posta adresiniz ve hesap kimliğiniz.
- **Coin ve satın alma:** Coin bakiyeniz ve hareketleriniz (kazanma/harcama), satın alma kayıtlarınız (işlem kimliği, tutar, para birimi, tarih). **Kart/ödeme bilgileriniz bize ulaşmaz;** ödeme Apple/Google tarafından işlenir.
- **Oyun geçmişi:** Kurduğunuz odalar, tek kişilik oyun geçmişiniz ve sonuçlar.
- **Doğum tarihi (hesap):** +18 kategorileri korumak için hesabınızdaki **kendi** doğum tarihiniz; oyun arkadaşınızın doğum tarihini siz girmezsiniz, o kendi hesabından doğrulanır.
- **Yapay zekâ yorumu ve analizi (isteğe bağlı, açık rızanızla):** Başlattığınızda üretilen yorum/analiz metni, bağlı olduğu oda ya da oyunla birlikte saklanır; rıza kaydınız (tarih ve metin sürümü) hesabınıza yazılır. Yapay zekâ hizmetine hangi verilerin gönderildiği bölüm 4'te yazılıdır. Rızanızı geri çekmek için [destek@gameofus.app] adresine yazabilirsiniz; geri çekme önceki işlemleri etkilemez. [DOĞRULA: uygulama içinde rızayı geri çekme akışı]
- **(planlanan) Bildirim:** Anlık bildirim göndermek için cihaz bildirim anahtarı.
- **(planlanan) Reklam:** Ödüllü reklam gösterimi için reklam sağlayıcısının topladığı veriler; ilgili izinler (ATT/rıza) ayrıca sorulur.

## 3. Verileri neden kullanıyoruz? (Amaç ve hukuki dayanak)

| Amaç | Dayanak |
|---|---|
| Oyunu sunmak, sonucu hesaplamak, odaları ve hesabı yönetmek | Sözleşmenin ifası |
| Kötüye kullanımı/otomatik istekleri önlemek, güvenlik | Meşru menfaat |
| Satın almaları ve coin bakiyesini yönetmek, muhasebe kayıtları | Sözleşme, yasal yükümlülük |
| Hizmeti iyileştirmek (yalnızca toplu davranış metrikleri: açılan oda sayısı, tamamlanma gibi; **bireysel cevap içeriği analize girmez**) | Meşru menfaat |
| AI yorumu ve analizi (mobil; yalnızca siz başlattığınızda) | Açık rıza |
| (planlanan) Bildirim, reklam | Açık rıza |

## 4. Verilerinizi kimlerle paylaşıyoruz?

Verileri satmayız ve profil çıkarıp reklam amacıyla paylaşmayız. Hizmetin çalışması için şu hizmet sağlayıcılarla (veri işleyenler) çalışırız:

- **Supabase** — veritabanı ve kimlik doğrulama. [BÖLGE: ör. Frankfurt/AB]
- **Vercel** — web sitesi ve API barındırma. [BÖLGE: ör. Frankfurt/AB]
- **Apple / Google** — giriş ve uygulama içi satın alma.
- **(planlanan) RevenueCat** — satın alma doğrulama.
- **Groq** — yapay zekâ yorumu/analizi üretimi. Yalnızca **mobil uygulamada, siz başlattığınızda ve açık rızanızla** çalışır; web'de yapay zekâ yorumu yoktur. Oda yorumunda şunlar gönderilir: soruların ve seçeneklerin metni, **iki oyuncunun** cevapları, tahminleri ve sıralamaları, ilişki türü ve oda dili; oyunda görünen **adlar**; **yaş aralığı** (örn. 25-34; ham doğum tarihi gönderilmez); doğum tarihinden hesaplanan **burç adı** (yalnızca yorumun tonunu ayarlayan sessiz bir arka plan bilgisi olarak; yorumda geçmez); yalnızca İspanyolca odalarda, cümlelerin doğru kurulması için **cinsiyet** (belirttiyseniz). Tek kişilik oyun analizinde yalnızca senaryo metinleri, seçtiğiniz bayraklar ve dil gönderilir; ad, cinsiyet, doğum tarihi ve e-posta gönderilmez. Hiçbir durumda e-posta adresi, hesap kimliği, katılımcı anahtarı ya da ham doğum tarihi gönderilmez. Gönderilen içerik günlüklerimize yazılmaz. [DOĞRULA: Groq'un veriyi saklama / model eğitiminde kullanma politikası ve veri işleme bölgesi]
- **OpenRouter** (yalnızca yapılandırıldığında, Groq'un yedeği olarak) — yukarıdakiyle aynı içerik, aynı koşullarla; sağlayıcının veriyi saklamamasını ve model eğitiminde kullanmamasını talep ediyoruz. [DOĞRULA: yedek sağlayıcı fiilen kullanılıyor mu; kullanılmıyorsa bu madde kaldırılır]
- **(planlanan) Expo** — bildirim iletimi.
- Yasal zorunluluk halinde yetkili makamlar.

Oyun sırasında oyun arkadaşınız cevaplarınızı ve tahminlerinizi görmez; iki taraf da turunu tamamlayınca cevaplar, tahminler ve sonuç, sonuç ekranında birlikte açılır.

## 5. Yurt dışına aktarım

Hizmet sağlayıcılarımızın bir kısmı Türkiye ve AB/AEA dışında olabilir. Bu durumda KVKK md. 9 ve GDPR kapsamında uygun güvenceler (ör. standart sözleşme maddeleri) uygulanır. [DOĞRULA: sağlayıcı bölgeleri ve sözleşmeleri]

## 6. Ne kadar saklıyoruz?

| Veri | Süre |
|---|---|
| Web odaları (anonim): oda 24 saat sonra erişilemez | Erişime kapandıktan **14 gün** sonra otomatik silinir (günlük temizleme işi) |
| Tek kişilik web oyunu (anonim) | **90 gün** sonra otomatik silinir |
| IP özeti (hız sınırı) | **7 gün** sonra otomatik silinir |
| Anonim toplu istatistik (günlük oda/tamamlanma/geri bildirim sayıları) | Kişisel veri içermez; silme sonrası da tutulur |
| Mobil hesap ve coin kayıtları | Hesabınızı silene kadar |
| Mobil oyun geçmişi (kurduğunuz/katıldığınız odalar, tek kişilik oyunlar) | **90 gün** sonra otomatik silinir (veya hesabınızı silince hemen) |
| Yapay zekâ yorumu/analizi metni | Bağlı olduğu oda ya da oyunla birlikte (**90 gün**) veya hesabınızı silince |
| Satın alma kayıtları | Yasal saklama süresi boyunca (muhasebe/vergi mevzuatı: [10 yıl — DOĞRULA]) **kimliğinizden ayrılmış (anonim)** halde; hesap silindiğinde kullanıcı bağlantısı kaldırılır |
| Geri bildirim | İlişkili oda/oyun silindiğinde birlikte silinir |

## 7. Çocuklar

+18 kategoriler yalnızca mobil uygulamada ve yalnızca ilişki türü ile iki oyuncunun yaşı şartı sağlandığında sunulur. [DOĞRULA: yaş sınırı ifadesi gerekip gerekmediği ve KVKK/GDPR veli rızası; mağaza yaş derecelendirmesi bu bölümle tutarlı olmalı]

## 8. Haklarınız

KVKK md. 11 ve GDPR kapsamında: verilerinize erişme, düzeltme, silme, işlemeyi kısıtlama/itiraz, veri taşınabilirliği ve rızanızı geri çekme haklarına sahipsiniz. Başvuru: **[destek@gameofus.app]**; en geç **30 gün** içinde yanıtlarız. Şikayet hakkınız: KVKK Kurulu / bulunduğunuz ülkenin veri koruma otoritesi.

## 9. Hesabınızı ve verilerinizi silme

- **Mobil uygulamada:** Profil/Ayarlar → **Hesabımı Sil**.
- **Web üzerinden (uygulamayı kurmadan):** gameofus.app/account-deletion adresindeki talep formu veya [destek@gameofus.app].
- Silinen ve saklanan veriler ayrıntısıyla o sayfada ve aşağıdadır:
  - **Silinir:** hesap kaydı, e-posta, coin bakiyesi ve hareketleri, kurduğunuz odalar (oda içindeki cevaplar, tahminler, sonuçlar ve geri bildirimler dahil), tek kişilik oyun geçmişiniz, yapay zekâ yorum ve analizleriniz, bildirim anahtarınız.
  - **Saklanır (yasal zorunluluk):** satın alma kayıtlarının işlem kimliği, tutar, para birimi ve tarihi — **sizinle bağlantısı kesilerek (anonim)** yasal süre boyunca.
  - Oyun arkadaşınızın kurduğu odalardaki katılımınız **anonimleştirilir** (adınız kaldırılır, hesabınızla bağlantısı kesilir); oda, diğer oyuncunun sonuçlarını görebilmesi için kalır ve süresi dolunca silinir.
- Satın alma ve abonelik (varsa) kayıtları ayrıca Apple/Google nezdinde tutulur; bunlar ilgili mağazanın politikalarına tabidir.

## 10. Güvenlik

Veriler HTTPS ile iletilir; katılımcı anahtarları yalnızca özet (hash) olarak saklanır; veritabanı erişimi satır bazlı güvenlik kurallarıyla kısıtlanır; coin işlemleri yalnızca sunucuda yapılır. Hiçbir sistem %100 güvenli değildir; bir ihlal halinde yasal bildirim yükümlülüklerimizi yerine getiririz.

## 11. Değişiklikler ve iletişim

Bu politikayı güncelleyebiliriz; önemli değişiklikleri uygulama/web üzerinden duyururuz. Sorularınız için: **[destek@gameofus.app]**.
