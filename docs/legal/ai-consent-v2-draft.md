# AI yorum rızası — v2 TASLAK (mobil uygulama için)

> **TASLAK — hukuki inceleme ve mobil sürümle koordinasyon gerekir.** Rıza metni mobil repoda durur (`gameofus-mobile`); sunucu yalnızca
> `users.ai_consent_at` / `ai_consent_version` saklar (`POST /api/users/ai-consent`, gövde `{ "version": "ai-v2" }`).
> CLAUDE.md kuralı: metin değişirse sürüm artırılır; mobil sürümü sabit tuttuğu için **önce mobil tarafa haber ver**.
> ES ve EN çevirileri ana dili o olan biri tarafından gözden geçirilmeli.

## Neden v2

`ai-v1` metni, yapay zekâya aşağıdakilerin gittiğini kapsamıyordu; kod bunları göndermektedir (`lib/ai/digest.ts`, `lib/ai/room-data.ts`):

| Veri | Oda yorumu | Solo analiz |
|---|---|---|
| Soru/seçenek metni, cevaplar, tahminler, sıralamalar | Evet (iki oyuncununki) | Evet (senaryo + seçilen bayrak) |
| Oyunda görünen ad | Evet | **Hayır** |
| Yaş aralığı (ham doğum tarihi **asla**) | Evet | Hayır |
| Burç (doğum tarihinden kodda hesaplanır; yorumda geçmez) | Evet | Hayır |
| Cinsiyet | Yalnızca İspanyolca odalarda | Hayır |
| Oda dili, ilişki türü | Evet | Yalnızca dil |
| E-posta, hesap kimliği, token | **Hayır** | **Hayır** |

Sürüm ipucu: `ai-v2`. Önceki rıza (`ai-v1`) verenlerin yeniden onayı **şu an sunucuda zorunlu değildir** (sunucu yalnızca rızanın var olup olmadığına bakar);
yeni veri türleri nedeniyle store öncesinde `ai_consent_version >= v2` şartı eklenmesi önerilir (bkz. "Açık kararlar").

---

## Türkçe

**Yapay zekâ yorumu için onayın**

Yorumu hazırlamak için oyununuzdaki bazı bilgiler, yapay zekâ hizmeti sağlayıcımıza (Groq; yedek olarak OpenRouter) gönderilir.

**Gönderilenler**
- Soruların ve seçeneklerin metni; senin ve oyun arkadaşının cevapları, tahminleri ve sıralamaları
- Oyunda görünen adlarınız, oda dili ve ilişki türü
- Yaş aralığın (ör. 25-34) ve doğum tarihinden hesaplanan burcun: yalnızca yorumun tonunu ayarlamak için kullanılır ve yorumda geçmez. Doğum tarihin gönderilmez.
- İspanyolca odalarda, cümleler doğru kurulsun diye cinsiyet (belirttiysen)
- Tek kişilik analizde: yalnızca senaryo metinleri, seçtiğin bayraklar ve dil. Ad, cinsiyet, doğum tarihi gönderilmez.

**Gönderilmeyenler:** e-posta adresin, hesap kimliğin, telefonun, konumun.

Yorum eğlence amaçlıdır ve hata yapabilir; tavsiye, değerlendirme ya da teşhis değildir. Onay isteğe bağlıdır: vermezsen oyunun geri kalanı etkilenmez.
İstediğin zaman geri çekebilirsin. Üretilen yorum, oda/oyun silinene kadar (en fazla 90 gün) ya da hesabını silene kadar saklanır. Ayrıntılar: Gizlilik Politikası.

☐ Okudum; yukarıdaki bilgilerin yapay zekâ hizmetine gönderilmesini kabul ediyorum.

---

## English

**Your consent for AI commentary**

To write the commentary, some information from your game is sent to our AI service provider (Groq; OpenRouter as a backup).

**What is sent**
- The text of the questions and options; your answers, guesses and rankings, and your partner's
- The names shown in the game, the room language and the relationship type
- Your age range (e.g. 25-34) and the zodiac sign calculated from your birth date: used only to adjust the tone, and never mentioned in the commentary. Your birth date itself is not sent.
- In Spanish rooms, your gender (if you provided it), so sentences are grammatically correct
- For solo analysis: only the scenario texts, the flags you chose and the language. Name, gender and birth date are not sent.

**What is not sent:** your email address, account ID, phone number or location.

The commentary is for fun and can be wrong; it is not advice, an assessment or a diagnosis. Consent is optional: if you decline, the rest of the game works as usual.
You can withdraw it at any time. The generated commentary is kept until the room/game is deleted (at most 90 days) or you delete your account. See the Privacy Policy for details.

☐ I have read this and agree to the information above being sent to the AI service.

---

## Español

**Tu consentimiento para el comentario de IA**

Para redactar el comentario, parte de la información de tu partida se envía a nuestro proveedor de IA (Groq; OpenRouter como respaldo).

**Qué se envía**
- El texto de las preguntas y opciones; tus respuestas, predicciones y ordenaciones, y las de la otra persona
- Los nombres que se muestran en el juego, el idioma de la sala y el tipo de relación
- Tu rango de edad (p. ej., 25-34) y el signo zodiacal calculado a partir de tu fecha de nacimiento: solo sirven para ajustar el tono y nunca se mencionan en el comentario. Tu fecha de nacimiento no se envía.
- En las salas en español, tu género (si lo indicaste), para que las frases queden bien construidas
- En el análisis individual: solo los textos de los escenarios, las banderas que elegiste y el idioma. No se envían nombre, género ni fecha de nacimiento.

**Qué no se envía:** tu correo electrónico, ID de cuenta, teléfono ni ubicación.

El comentario es solo para divertirse y puede equivocarse; no es un consejo, una evaluación ni un diagnóstico. El consentimiento es opcional: si no lo das, el resto del juego funciona igual.
Puedes retirarlo en cualquier momento. El comentario generado se conserva hasta que se elimine la sala o la partida (como máximo 90 días) o hasta que elimines tu cuenta. Consulta la Política de Privacidad para más detalles.

☐ He leído esto y acepto que la información anterior se envíe al servicio de IA.

---

## Açık kararlar (kod/ürün; kullanıcıya sorulacak)

1. ~~**Karşı oyuncunun rızası.**~~ **KARAR VERİLDİ ve uygulandı (2026-10-29):** yorum yalnızca odadaki HERKESİN rızası varsa üretilir.
   Hesaplı oyuncunun rızası `users`'ta (bu metin, `ai-v2`); mobilden kurulmuş odaya web'den katılan hesapsız misafir ise katılma ekranındaki **isteğe bağlı,
   varsayılan kapalı** kutuyla onay verir (`messages/*.json` → `join.aiConsent`, sürüm `web-ai-v1`, `participants.ai_consent_at/version`).
   Rıza yoksa sunucu hiçbir veri göndermeden ve coin düşmeden `403 AI_PARTNER_CONSENT_REQUIRED` döner. Web metni bu belgedeki metinle aynı veri listesini içermeli:
   biri değişirse ikisini birlikte güncelle. Mobilde bu hata kodu için kullanıcıya anlaşılır mesaj gösterilmeli ("Diğer oyuncu yapay zekâ yorumuna izin vermedi").
   Mobilden kurulan odada KARŞI taraf da mobil kullanıcıysa onun rızası da `users`'tan aranır: o da `ai-v2` rıza ekranını geçmiş olmalı.
2. **Sürüm şartı.** Store öncesi sunucu `ai_consent_version` değerinin güncel sürüme (`ai-v2`) eşit/yeni olmasını istemeli; aksi halde eski rıza ile yeni veri türleri gider.
3. **Geri çekme.** Sunucuda rızayı geri çeken bir uç yok (`ai-consent` yalnızca `POST`); mobilde uygulama içi bir geri çekme akışı gerekiyorsa uç eklenmeli.
