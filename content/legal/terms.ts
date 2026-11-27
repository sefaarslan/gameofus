// Kullanım Koşulları (TR/EN/ES), `/{dil}/terms`. Coin/paket/oda kuralları değişirse ÜÇ DİLİ birlikte ve tarihi güncelle.
// Fiyat ve paket içeriği bilinçli olarak yazılmaz (satın alma ekranında gösterilir; metin eskimesin).
import type { LegalDoc, LegalLocale } from "./types";

const tr: LegalDoc = {
  title: "Kullanım Koşulları",
  updated: "Son güncelleme: 27 Kasım 2026",
  intro: ["Game of Us'ı (gameofus.app ve mobil uygulama) kullanarak bu koşulları kabul etmiş olursunuz."],
  sections: [
    {
      title: "Hizmet",
      blocks: [
        "Game of Us, iki kişinin birbirini daha iyi tanıması için hazırlanmış bir eğlence oyunudur; tek kişilik oyunlar da sunar. Skorlar, sonuçlar ve yorumlar eğlence amaçlıdır; psikolojik, ilişki veya tıbbi danışmanlık ya da teşhis değildir.",
        "Hizmet 13 yaşından küçüklere yönelik değildir. Bazı içerikler için daha yüksek yaş sınırı uygulanabilir.",
      ],
    },
    {
      title: "Kullanım kuralları",
      blocks: [
        {
          list: [
            "Hizmeti başkasını taciz etmek, tehdit etmek veya zorlamak için kullanmayın.",
            "Hakaret içeren, hukuka aykırı veya başkasının kişisel verisini içeren metin girmeyin.",
            "Başkasının adına, onun bilgisi olmadan oynamayın.",
            "Hizmeti otomatik yöntemlerle kötüye kullanmayın, güvenlik ve kullanım sınırlarını aşmaya çalışmayın.",
          ],
        },
      ],
    },
    {
      title: "Odalar",
      blocks: [
        "Her oda 24 saat sonra oynamaya kapanır. Davet bağlantısına veya koduna sahip olan kişi odaya katılabilir (en fazla iki oyuncu); bunları yalnızca davet etmek istediğiniz kişiyle paylaşın.",
      ],
    },
    {
      title: "Hesap (mobil)",
      blocks: [
        "Mobil uygulamada Google veya Apple ile giriş gerekir. Hesabınızın güvenliğinden siz sorumlusunuz. Hesabınızı uygulama içinden istediğiniz zaman silebilirsiniz.",
      ],
    },
    {
      title: "Coin ve satın almalar (mobil)",
      blocks: [
        {
          list: [
            "Coin, uygulama içi özelliklerde kullanılan sanal bir birimdir; para değeri yoktur, nakde çevrilemez ve devredilemez.",
            "Coin kazanma yolları, miktarlar ve özelliklerin coin bedelleri değişebilir.",
            "Paketlerin içeriği ve fiyatı satın alma ekranında gösterilir.",
            "Ödemeler Apple App Store veya Google Play üzerinden alınır; iadeler ilgili mağazanın kurallarına tabidir.",
            "Hesap silinirse coin bakiyesi ve paket erişimi de silinir.",
            "Satın aldığınız şey hesabınıza yansımazsa gameofusapp@gmail.com adresine işlem kimliğiyle yazın.",
          ],
        },
      ],
    },
    {
      title: "Yapay zekâ yorumları",
      blocks: [
        "Yorumlar otomatik üretilir; hatalı veya beklentinizden farklı olabilir ve profesyonel tavsiye değildir. Hangi verilerin kullanıldığı Gizlilik Politikası'nda anlatılır.",
      ],
    },
    {
      title: "Fikri mülkiyet",
      blocks: [
        "Game of Us adı, logosu, tasarımı, soruları, senaryoları ve yazılımı bize veya lisans verenlerimize aittir. Hizmeti kişisel ve ticari olmayan amaçla kullanabilirsiniz; kendi sonuç kartınızı paylaşabilirsiniz.",
      ],
    },
    {
      title: "Sorumluluk",
      blocks: [
        "Hizmet olduğu gibi sunulur; kesintisiz veya hatasız çalışacağını garanti etmeyiz. Yasaların izin verdiği ölçüde dolaylı zararlardan sorumlu değiliz. Tüketici mevzuatından doğan, sınırlanamayan haklarınız saklıdır.",
      ],
    },
    {
      title: "Değişiklik ve sonlandırma",
      blocks: [
        "Hizmeti ve bu koşulları güncelleyebiliriz; güncel metin bu sayfada yayınlanır. Kuralları ihlal eden hesap veya odaları kısıtlayabiliriz. Siz de hizmeti istediğiniz zaman bırakabilirsiniz.",
      ],
    },
    {
      title: "Uygulanacak hukuk ve iletişim",
      blocks: [
        "Bu koşullara Türkiye Cumhuriyeti hukuku uygulanır. Tüketiciler yerleşim yerlerindeki tüketici hakem heyetlerine ve mahkemelerine başvurabilir.",
        "İletişim: gameofusapp@gmail.com",
      ],
    },
  ],
};

const en: LegalDoc = {
  title: "Terms of Use",
  updated: "Last updated: November 27, 2026",
  intro: ["By using Game of Us (gameofus.app and the mobile app) you accept these terms."],
  sections: [
    {
      title: "The service",
      blocks: [
        "Game of Us is an entertainment game that helps two people get to know each other better; it also offers solo games. Scores, results and commentary are for fun; they are not psychological, relationship or medical advice or a diagnosis.",
        "The service is not directed at children under 13. Higher age limits may apply to some content.",
      ],
    },
    {
      title: "Rules of use",
      blocks: [
        {
          list: [
            "Do not use the service to harass, threaten or pressure anyone.",
            "Do not enter abusive or unlawful text, or other people's personal data.",
            "Do not play on someone's behalf without their knowledge.",
            "Do not abuse the service by automated means or try to bypass security and usage limits.",
          ],
        },
      ],
    },
    {
      title: "Rooms",
      blocks: [
        "Every room closes for play after 24 hours. Anyone who has the invite link or code can join the room (two players at most); share them only with the person you want to invite.",
      ],
    },
    {
      title: "Account (mobile)",
      blocks: [
        "The mobile app requires signing in with Google or Apple. You are responsible for keeping your account secure. You can delete your account in the app at any time.",
      ],
    },
    {
      title: "Coins and purchases (mobile)",
      blocks: [
        {
          list: [
            "Coins are a virtual unit used for in-app features; they have no monetary value and cannot be exchanged for cash or transferred.",
            "Ways of earning coins, amounts and the coin cost of features may change.",
            "The contents and price of packages are shown on the purchase screen.",
            "Payments are taken through the Apple App Store or Google Play; refunds follow the rules of that store.",
            "If you delete your account, your coin balance and package access are deleted too.",
            "If a purchase does not appear on your account, write to gameofusapp@gmail.com with the transaction ID.",
          ],
        },
      ],
    },
    {
      title: "AI commentary",
      blocks: [
        "Commentary is generated automatically; it may be wrong or differ from what you expect and is not professional advice. The Privacy Policy explains which data is used.",
      ],
    },
    {
      title: "Intellectual property",
      blocks: [
        "The Game of Us name, logo, design, questions, scenarios and software belong to us or our licensors. You may use the service for personal, non-commercial purposes and share your own result cards.",
      ],
    },
    {
      title: "Liability",
      blocks: [
        "The service is provided as is; we do not guarantee that it will be uninterrupted or error-free. To the extent the law allows, we are not liable for indirect damages. Consumer rights that cannot be limited remain unaffected.",
      ],
    },
    {
      title: "Changes and termination",
      blocks: [
        "We may update the service and these terms; the current text is published on this page. We may restrict accounts or rooms that break the rules. You can stop using the service at any time.",
      ],
    },
    {
      title: "Governing law and contact",
      blocks: [
        "These terms are governed by the law of the Republic of Türkiye. Consumers may also rely on the mandatory protections and courts of their place of residence.",
        "Contact: gameofusapp@gmail.com",
      ],
    },
  ],
};

const es: LegalDoc = {
  title: "Términos de Uso",
  updated: "Última actualización: 27 de noviembre de 2026",
  intro: ["Al usar Game of Us (gameofus.app y la aplicación móvil) aceptas estos términos."],
  sections: [
    {
      title: "El servicio",
      blocks: [
        "Game of Us es un juego de entretenimiento para que dos personas se conozcan mejor; también ofrece juegos individuales. Las puntuaciones, los resultados y los comentarios son para divertirse; no son asesoramiento ni diagnóstico psicológico, de pareja o médico.",
        "El servicio no está dirigido a menores de 13 años. Algunos contenidos pueden exigir una edad mayor.",
      ],
    },
    {
      title: "Normas de uso",
      blocks: [
        {
          list: [
            "No uses el servicio para acosar, amenazar o presionar a nadie.",
            "No introduzcas textos ofensivos o ilegales, ni datos personales de otras personas.",
            "No juegues en nombre de alguien sin que lo sepa.",
            "No abuses del servicio con métodos automatizados ni intentes saltarte los límites de seguridad y de uso.",
          ],
        },
      ],
    },
    {
      title: "Salas",
      blocks: [
        "Cada sala se cierra al juego a las 24 horas. Quien tenga el enlace o el código de invitación puede entrar en la sala (dos personas como máximo); compártelos solo con quien quieras invitar.",
      ],
    },
    {
      title: "Cuenta (móvil)",
      blocks: [
        "La aplicación móvil exige iniciar sesión con Google o Apple. Eres responsable de la seguridad de tu cuenta. Puedes eliminarla desde la aplicación en cualquier momento.",
      ],
    },
    {
      title: "Monedas y compras (móvil)",
      blocks: [
        {
          list: [
            "Las monedas son una unidad virtual para funciones de la aplicación; no tienen valor monetario, no se canjean por dinero y no se transfieren.",
            "Las formas de ganar monedas, las cantidades y el coste de las funciones pueden cambiar.",
            "El contenido y el precio de los paquetes se muestran en la pantalla de compra.",
            "Los pagos se realizan a través de Apple App Store o Google Play; los reembolsos siguen las normas de la tienda.",
            "Si eliminas tu cuenta, también se eliminan el saldo de monedas y el acceso a los paquetes.",
            "Si una compra no aparece en tu cuenta, escribe a gameofusapp@gmail.com con el identificador de la transacción.",
          ],
        },
      ],
    },
    {
      title: "Comentarios de IA",
      blocks: [
        "Los comentarios se generan automáticamente; pueden contener errores o no ser lo que esperas y no son asesoramiento profesional. La Política de Privacidad explica qué datos se usan.",
      ],
    },
    {
      title: "Propiedad intelectual",
      blocks: [
        "El nombre, el logotipo, el diseño, las preguntas, los escenarios y el software de Game of Us son nuestros o de nuestros licenciantes. Puedes usar el servicio con fines personales y no comerciales y compartir tus propias tarjetas de resultado.",
      ],
    },
    {
      title: "Responsabilidad",
      blocks: [
        "El servicio se ofrece tal cual; no garantizamos que funcione sin interrupciones ni errores. En la medida en que la ley lo permita, no respondemos de daños indirectos. Se mantienen los derechos de consumo que no pueden limitarse.",
      ],
    },
    {
      title: "Cambios y finalización",
      blocks: [
        "Podemos actualizar el servicio y estos términos; el texto vigente se publica en esta página. Podemos restringir cuentas o salas que incumplan las normas. Puedes dejar de usar el servicio cuando quieras.",
      ],
    },
    {
      title: "Ley aplicable y contacto",
      blocks: [
        "Estos términos se rigen por la legislación de la República de Turquía. Los consumidores conservan además la protección obligatoria y los tribunales de su lugar de residencia.",
        "Contacto: gameofusapp@gmail.com",
      ],
    },
  ],
};

export const termsDocs: Record<LegalLocale, LegalDoc> = { tr, en, es };
