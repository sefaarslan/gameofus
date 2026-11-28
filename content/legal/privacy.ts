// Gizlilik Politikası (TR/EN/ES), `/{dil}/privacy`. Gerçek veri akışını anlatır: veri toplama, sağlayıcı ya da saklama süresi
// (`lib/retention.ts`) değişirse ÜÇ DİLİ birlikte ve "son güncelleme" tarihini güncelle.
import type { LegalDoc, LegalLocale } from "./types";

const tr: LegalDoc = {
  title: "Gizlilik Politikası",
  updated: "Son güncelleme: 28 Kasım 2026",
  intro: [
    "Game of Us, iki kişinin birbirini daha iyi tanıması için hazırlanmış bir oyundur. Web'de (gameofus.app) ve mobil uygulamada oynanır. Bu sayfa hangi verileri topladığımızı, nasıl kullandığımızı ve nasıl sildirebileceğinizi anlatır.",
    "Veri sorumlusu: Game of Us · gameofusapp@gmail.com",
  ],
  sections: [
    {
      title: "Kısaca",
      blocks: [
        {
          list: [
            "Web'de hesap açmadan oynarsınız; mobil uygulamada Google veya Apple ile giriş gerekir.",
            "Oyun arkadaşınız cevaplarınızı ancak ikiniz de turunuzu bitirince görür.",
            "Yapay zekâ yorumu isteğe bağlıdır ve onayınızla çalışır.",
            "Mobil uygulamada reklam gösterilebilir; web'de reklam yoktur.",
            "Verilerinizi satmayız.",
            "Telefon numaranızı, rehberinizi, hassas konumunuzu, fotoğraflarınızı ve mikrofonunuzu istemeyiz.",
          ],
        },
      ],
    },
    {
      title: "Topladığımız veriler",
      blocks: [
        {
          list: [
            "**Oyuncu adı:** Odadaki diğer oyuncuya gösterilir. Takma ad kullanabilirsiniz.",
            "**Oyun içeriği:** Cevaplarınız, tahminleriniz, sonuçlar ve oyun ayarları.",
            "**Hesap bilgisi (mobil):** E-posta adresiniz ve hesap kimliğiniz.",
            "**Doğum tarihi ve cinsiyet:** Yalnızca kendiniz için girersiniz. Yaş sınırını uygulamak ve deneyimi kişiselleştirmek için kullanılır; bazı durumlarda isteğe bağlıdır.",
            "**Coin ve satın alma (mobil):** Coin hareketleriniz ve satın alma kayıtlarınız. Kart bilgileriniz bize ulaşmaz.",
            "**Teknik veriler:** Güvenlik ve kötüye kullanımı önlemek için IP adresinizden üretilen bir özet ve standart sunucu kayıtları.",
            "**Hata verileri (mobil):** Uygulama hata verdiğinde cihaz modeli, sistem sürümü ve hatanın teknik dökümü.",
            "**Reklam verileri (mobil):** Reklam sağlayıcımız reklam kimliğinizi (izin verirseniz), yaklaşık konumunuzu, cihaz ve etkileşim bilgilerini işleyebilir.",
            "**Cihazınızda saklananlar:** Oyuna devam edebilmeniz için oturum bilgileri ve tercihler (dil tercihi için bir çerez). Web'de reklam veya izleme çerezi kullanmayız.",
          ],
        },
      ],
    },
    {
      title: "Verileri neden kullanıyoruz?",
      blocks: [
        {
          table: {
            head: ["Amaç", "Hukuki dayanak"],
            rows: [
              ["Oyunu ve hesabı sunmak, satın almaları yönetmek", "Sözleşmenin ifası"],
              ["Güvenlik, hata giderme, toplu istatistiklerle oyunu geliştirmek", "Meşru menfaat"],
              ["Yapay zekâ yorumu, kişiselleştirilmiş reklam", "Açık rıza"],
              ["Muhasebe ve yasal kayıtlar", "Hukuki yükümlülük"],
            ],
          },
        },
      ],
    },
    {
      title: "Yapay zekâ yorumu",
      blocks: [
        "Yorum isteğe bağlıdır ve mobil uygulamada başlatılır. İki kişilik oyunda iki oyuncunun da onayı gerekir.",
        "Yorumu üretmek için yapay zekâ sağlayıcımız **Groq**'a oyun içeriği (sorular, cevaplar, tahminler), oyuncu adları, oyun dili ve ilişki türü, doğum tarihinden türetilen genel bilgiler (ör. yaş aralığı) ve gerektiğinde cinsiyet gönderilir. Tek kişilik analizde yalnızca oyun içeriği ve dil gönderilir. E-posta adresiniz, hesap kimliğiniz ve doğum tarihinizin kendisi gönderilmez.",
        "Yorum eğlence amaçlıdır ve hata yapabilir. Onayınızı istediğiniz zaman bize yazarak geri çekebilirsiniz.",
      ],
    },
    {
      title: "Kimlerle paylaşıyoruz?",
      blocks: [
        "Verilerinizi yalnızca hizmeti çalıştırmak için aşağıdaki sağlayıcılarla ve yasa gerektirdiğinde yetkili makamlarla paylaşırız.",
        {
          table: {
            head: ["Sağlayıcı", "Ne için"],
            rows: [
              ["Supabase", "Veritabanı ve giriş"],
              ["Hetzner", "Sunucu barındırma"],
              ["Cloudflare", "Güvenlik ve içerik iletimi"],
              ["Google, Apple", "Giriş ve ödemeler"],
              ["RevenueCat", "Uygulama içi satın alma yönetimi"],
              ["Google AdMob", "Mobil uygulamada reklam"],
              ["Sentry", "Hata izleme"],
              ["Groq", "Yapay zekâ yorumu"],
            ],
          },
        },
        "Bu sağlayıcıların bir kısmı Türkiye ve Avrupa Birliği dışında veri işler. Aktarımlar KVKK ve GDPR'ın öngördüğü güvencelerle yapılır.",
      ],
    },
    {
      title: "Ne kadar saklıyoruz?",
      blocks: [
        {
          table: {
            head: ["Veri", "Süre"],
            rows: [
              ["Web odaları (odalar 24 saat sonra kapanır)", "Kapandıktan 14 gün sonra"],
              ["Mobil hesapla ilişkili odalar", "Kapandıktan 90 gün sonra"],
              ["Tek kişilik oyunlar", "90 gün"],
              ["Yapay zekâ yorumu ve daha önce gönderilmiş geri bildirim", "İlgili oyunla birlikte silinir"],
              ["IP özeti", "7 gün"],
              ["Hesap ve coin kayıtları", "Hesabınızı silene kadar"],
              ["Satın alma kayıtları", "Yasal saklama süresi boyunca"],
              ["Hata ve reklam verileri", "Sağlayıcının saklama süresince"],
            ],
          },
        },
        "Kişisel veri içermeyen toplu istatistikler daha uzun süre tutulabilir.",
      ],
    },
    {
      id: "account-deletion",
      title: "Hesabınızı ve verilerinizi silme",
      blocks: [
        {
          list: [
            "**Mobil uygulamada:** Ayarlar → Hesabımı Sil. Silme hemen yapılır.",
            "**Uygulamaya erişemiyorsanız:** Giriş yaptığınız e-posta adresinden gameofusapp@gmail.com adresine yazın; en geç 30 gün içinde sileriz.",
            "**Web'de oynadıysanız:** Hesap yoktur, veriler yukarıdaki sürelerde kendiliğinden silinir. Daha erken silinmesini isterseniz oda kodunuzla bize yazın.",
          ],
        },
        "Hesap silindiğinde hesabınız, e-postanız, coinleriniz, kurduğunuz odalar, oyun geçmişiniz ve satın aldığınız yorumlar silinir. Başkasının kurduğu odalarda profil bilgileriniz kaldırılır; cevaplarınız (ve o oyuncunun aldığı yorum) oda silinene kadar kalabilir. Satın alma kayıtları, yasal süre boyunca hesabınızla bağlantısı kesilerek saklanır. Silme geri alınamaz.",
      ],
    },
    {
      title: "Çocuklar",
      blocks: ["Game of Us 13 yaşından küçüklere yönelik değildir ve onlardan bilerek veri toplamayız. Böyle bir veri bize ulaştıysa yazın, sileriz."],
    },
    {
      title: "Haklarınız",
      blocks: [
        "KVKK ve GDPR kapsamında verilerinize erişme, düzeltme, silme, işlemeye itiraz etme, verilerinizi taşıma ve rızanızı geri çekme haklarınız vardır. gameofusapp@gmail.com adresine yazın; en geç 30 gün içinde yanıtlarız. Veri koruma otoritesine (Türkiye'de Kişisel Verileri Koruma Kurulu) şikâyet hakkınız da vardır.",
      ],
    },
    {
      title: "Güvenlik, değişiklikler ve iletişim",
      blocks: [
        "Veriler şifreli bağlantıyla iletilir ve erişim kısıtlıdır; yine de hiçbir sistem tamamen güvenli değildir. Bu politikayı güncellediğimizde yeni metni ve tarihini bu sayfada yayınlarız.",
        "Sorularınız için: gameofusapp@gmail.com",
      ],
    },
  ],
};

const en: LegalDoc = {
  title: "Privacy Policy",
  updated: "Last updated: November 28, 2026",
  intro: [
    "Game of Us is a game that helps two people get to know each other better. You can play it on the web (gameofus.app) and in the mobile app. This page explains what data we collect, how we use it and how you can have it deleted.",
    "Data controller: Game of Us · gameofusapp@gmail.com",
  ],
  sections: [
    {
      title: "In short",
      blocks: [
        {
          list: [
            "On the web you play without an account; the mobile app requires signing in with Google or Apple.",
            "The other player sees your answers only after both of you have finished your turn.",
            "AI commentary is optional and works only with your consent.",
            "The mobile app may show ads; the web version has none.",
            "We do not sell your data.",
            "We do not ask for your phone number, contacts, precise location, photos or microphone.",
          ],
        },
      ],
    },
    {
      title: "Data we collect",
      blocks: [
        {
          list: [
            "**Player name:** Shown to the other player in your room. You can use a nickname.",
            "**Game content:** Your answers, guesses, results and game settings.",
            "**Account information (mobile):** Your email address and account ID.",
            "**Birth date and gender:** You enter them only for yourself. They are used to apply age limits and personalise the experience; in some cases they are optional.",
            "**Coins and purchases (mobile):** Your coin activity and purchase records. We never receive your card details.",
            "**Technical data:** A hash derived from your IP address, used for security and abuse prevention, and standard server logs.",
            "**Error data (mobile):** When the app fails, your device model, system version and technical details of the error.",
            "**Advertising data (mobile):** Our ad provider may process your advertising ID (if you allow it), approximate location, device and interaction information.",
            "**Stored on your device:** Session information and preferences so you can continue playing (a cookie for your language choice). We use no advertising or tracking cookies on the web.",
          ],
        },
      ],
    },
    {
      title: "Why we use your data",
      blocks: [
        {
          table: {
            head: ["Purpose", "Legal basis"],
            rows: [
              ["Providing the game and your account, handling purchases", "Performance of a contract"],
              ["Security, fixing errors, improving the game with aggregate statistics", "Legitimate interest"],
              ["AI commentary, personalised ads", "Consent"],
              ["Accounting and legal records", "Legal obligation"],
            ],
          },
        },
      ],
    },
    {
      title: "AI commentary",
      blocks: [
        "Commentary is optional and is started in the mobile app. In two-player games, both players must consent.",
        "To write it, we send our AI provider **Groq** the game content (questions, answers, guesses), player names, game language and relationship type, general information derived from birth date (such as age range) and, where needed, gender. For solo analysis only the game content and language are sent. Your email address, account ID and the birth date itself are not sent.",
        "The commentary is for fun and can be wrong. You can withdraw your consent at any time by writing to us.",
      ],
    },
    {
      title: "Who we share data with",
      blocks: [
        "We share data only with the providers below, to run the service, and with authorities when the law requires it.",
        {
          table: {
            head: ["Provider", "Purpose"],
            rows: [
              ["Supabase", "Database and sign-in"],
              ["Hetzner", "Server hosting"],
              ["Cloudflare", "Security and content delivery"],
              ["Google, Apple", "Sign-in and payments"],
              ["RevenueCat", "In-app purchase management"],
              ["Google AdMob", "Ads in the mobile app"],
              ["Sentry", "Error monitoring"],
              ["Groq", "AI commentary"],
            ],
          },
        },
        "Some of these providers process data outside Türkiye and the European Union. Transfers are made with the safeguards required by the GDPR and Turkish data protection law (KVKK).",
      ],
    },
    {
      title: "How long we keep it",
      blocks: [
        {
          table: {
            head: ["Data", "Period"],
            rows: [
              ["Web rooms (rooms close after 24 hours)", "14 days after closing"],
              ["Rooms linked to a mobile account", "90 days after closing"],
              ["Solo games", "90 days"],
              ["AI commentary and previously submitted feedback", "Deleted with the related game"],
              ["IP hash", "7 days"],
              ["Account and coin records", "Until you delete your account"],
              ["Purchase records", "For the legally required period"],
              ["Error and ad data", "The provider's retention period"],
            ],
          },
        },
        "Aggregate statistics that contain no personal data may be kept longer.",
      ],
    },
    {
      id: "account-deletion",
      title: "Deleting your account and data",
      blocks: [
        {
          list: [
            "**In the mobile app:** Settings → Delete My Account. Deletion happens immediately.",
            "**If you cannot access the app:** Write to gameofusapp@gmail.com from the email address you signed in with; we delete your data within 30 days.",
            "**If you played on the web:** There is no account; data is deleted automatically after the periods above. To have it deleted sooner, send us your room code.",
          ],
        },
        "Deleting your account removes your account, email, coins, the rooms you created, your game history and the commentary you bought. In rooms created by someone else, your profile details are removed; your answers (and any commentary that player bought) may remain until the room is deleted. Purchase records are kept for the legally required period, unlinked from your account. Deletion cannot be undone.",
      ],
    },
    {
      title: "Children",
      blocks: ["Game of Us is not directed at children under 13 and we do not knowingly collect their data. If such data has reached us, write to us and we will delete it."],
    },
    {
      title: "Your rights",
      blocks: [
        "Under the GDPR and KVKK you have the right to access, correct and delete your data, to object to processing, to data portability and to withdraw consent. Write to gameofusapp@gmail.com; we reply within 30 days. You also have the right to complain to your data protection authority.",
      ],
    },
    {
      title: "Security, changes and contact",
      blocks: [
        "Data is sent over encrypted connections and access is restricted, but no system is completely secure. When we update this policy, we publish the new text and its date on this page.",
        "Questions: gameofusapp@gmail.com",
      ],
    },
  ],
};

const es: LegalDoc = {
  title: "Política de Privacidad",
  updated: "Última actualización: 28 de noviembre de 2026",
  intro: [
    "Game of Us es un juego para que dos personas se conozcan mejor. Se juega en la web (gameofus.app) y en la aplicación móvil. Esta página explica qué datos recopilamos, cómo los usamos y cómo puedes pedir que se eliminen.",
    "Responsable del tratamiento: Game of Us · gameofusapp@gmail.com",
  ],
  sections: [
    {
      title: "En resumen",
      blocks: [
        {
          list: [
            "En la web juegas sin cuenta; en la aplicación móvil hay que iniciar sesión con Google o Apple.",
            "La otra persona ve tus respuestas solo cuando ambos habéis terminado vuestro turno.",
            "El comentario de IA es opcional y solo funciona con tu consentimiento.",
            "La aplicación móvil puede mostrar anuncios; la web no tiene.",
            "No vendemos tus datos.",
            "No pedimos tu número de teléfono, contactos, ubicación precisa, fotos ni micrófono.",
          ],
        },
      ],
    },
    {
      title: "Datos que recopilamos",
      blocks: [
        {
          list: [
            "**Nombre de jugador:** Se muestra a la otra persona de la sala. Puedes usar un apodo.",
            "**Contenido del juego:** Tus respuestas, predicciones, resultados y ajustes de la partida.",
            "**Datos de la cuenta (móvil):** Tu correo electrónico e identificador de cuenta.",
            "**Fecha de nacimiento y género:** Solo introduces los tuyos. Sirven para aplicar límites de edad y personalizar la experiencia; en algunos casos son opcionales.",
            "**Monedas y compras (móvil):** Tus movimientos de monedas y registros de compra. Nunca recibimos los datos de tu tarjeta.",
            "**Datos técnicos:** Un resumen (hash) derivado de tu dirección IP, para seguridad y prevención de abusos, y registros estándar del servidor.",
            "**Datos de errores (móvil):** Cuando la aplicación falla, el modelo del dispositivo, la versión del sistema y los detalles técnicos del error.",
            "**Datos publicitarios (móvil):** Nuestro proveedor de anuncios puede tratar tu identificador publicitario (si lo permites), ubicación aproximada, información del dispositivo e interacciones.",
            "**Guardado en tu dispositivo:** Información de sesión y preferencias para que puedas seguir jugando (una cookie para el idioma). En la web no usamos cookies publicitarias ni de seguimiento.",
          ],
        },
      ],
    },
    {
      title: "Para qué usamos tus datos",
      blocks: [
        {
          table: {
            head: ["Finalidad", "Base legal"],
            rows: [
              ["Ofrecer el juego y la cuenta, gestionar compras", "Ejecución de un contrato"],
              ["Seguridad, corrección de errores, mejora del juego con estadísticas agregadas", "Interés legítimo"],
              ["Comentario de IA, anuncios personalizados", "Consentimiento"],
              ["Contabilidad y registros legales", "Obligación legal"],
            ],
          },
        },
      ],
    },
    {
      title: "Comentario de IA",
      blocks: [
        "El comentario es opcional y se inicia en la aplicación móvil. En las partidas de dos, ambas personas deben dar su consentimiento.",
        "Para redactarlo enviamos a nuestro proveedor de IA, **Groq**, el contenido del juego (preguntas, respuestas, predicciones), los nombres de jugador, el idioma y el tipo de relación, información general derivada de la fecha de nacimiento (como el rango de edad) y, cuando hace falta, el género. En el análisis individual solo se envían el contenido del juego y el idioma. No se envían tu correo, tu identificador de cuenta ni tu fecha de nacimiento.",
        "El comentario es para divertirse y puede equivocarse. Puedes retirar tu consentimiento en cualquier momento escribiéndonos.",
      ],
    },
    {
      title: "Con quién compartimos datos",
      blocks: [
        "Solo compartimos datos con los proveedores siguientes, para que el servicio funcione, y con las autoridades cuando la ley lo exige.",
        {
          table: {
            head: ["Proveedor", "Para qué"],
            rows: [
              ["Supabase", "Base de datos e inicio de sesión"],
              ["Hetzner", "Alojamiento del servidor"],
              ["Cloudflare", "Seguridad y entrega de contenido"],
              ["Google, Apple", "Inicio de sesión y pagos"],
              ["RevenueCat", "Gestión de compras en la aplicación"],
              ["Google AdMob", "Anuncios en la aplicación móvil"],
              ["Sentry", "Seguimiento de errores"],
              ["Groq", "Comentario de IA"],
            ],
          },
        },
        "Algunos de estos proveedores tratan datos fuera de Turquía y de la Unión Europea. Las transferencias se realizan con las garantías que exigen el RGPD y la ley turca de protección de datos (KVKK).",
      ],
    },
    {
      title: "Cuánto tiempo los conservamos",
      blocks: [
        {
          table: {
            head: ["Datos", "Plazo"],
            rows: [
              ["Salas web (se cierran a las 24 horas)", "14 días tras el cierre"],
              ["Salas vinculadas a una cuenta móvil", "90 días tras el cierre"],
              ["Juegos individuales", "90 días"],
              ["Comentario de IA y opiniones enviadas anteriormente", "Se eliminan con la partida"],
              ["Hash de IP", "7 días"],
              ["Cuenta y monedas", "Hasta que elimines tu cuenta"],
              ["Registros de compra", "Durante el plazo legal"],
              ["Datos de errores y anuncios", "El plazo del proveedor"],
            ],
          },
        },
        "Las estadísticas agregadas sin datos personales pueden conservarse más tiempo.",
      ],
    },
    {
      id: "account-deletion",
      title: "Eliminar tu cuenta y tus datos",
      blocks: [
        {
          list: [
            "**En la aplicación móvil:** Ajustes → Eliminar mi cuenta. La eliminación es inmediata.",
            "**Si no puedes acceder a la aplicación:** Escribe a gameofusapp@gmail.com desde el correo con el que iniciaste sesión; eliminamos tus datos en un máximo de 30 días.",
            "**Si jugaste en la web:** No hay cuenta; los datos se eliminan solos tras los plazos anteriores. Para eliminarlos antes, envíanos el código de tu sala.",
          ],
        },
        "Al eliminar la cuenta se borran tu cuenta, correo, monedas, las salas que creaste, tu historial y los comentarios que compraste. En las salas creadas por otra persona se eliminan tus datos de perfil; tus respuestas (y el comentario que esa persona haya comprado) pueden permanecer hasta que se elimine la sala. Los registros de compra se conservan durante el plazo legal, desvinculados de tu cuenta. La eliminación no se puede deshacer.",
      ],
    },
    {
      title: "Menores",
      blocks: ["Game of Us no está dirigido a menores de 13 años y no recopilamos sus datos a sabiendas. Si nos han llegado, escríbenos y los eliminaremos."],
    },
    {
      title: "Tus derechos",
      blocks: [
        "Según el RGPD y la KVKK puedes acceder a tus datos, corregirlos y eliminarlos, oponerte a su tratamiento, pedir su portabilidad y retirar tu consentimiento. Escribe a gameofusapp@gmail.com; respondemos en un máximo de 30 días. También puedes reclamar ante tu autoridad de protección de datos.",
      ],
    },
    {
      title: "Seguridad, cambios y contacto",
      blocks: [
        "Los datos se envían por conexiones cifradas y el acceso está restringido, pero ningún sistema es totalmente seguro. Si actualizamos esta política, publicaremos aquí el nuevo texto y su fecha.",
        "Preguntas: gameofusapp@gmail.com",
      ],
    },
  ],
};

export const privacyDocs: Record<LegalLocale, LegalDoc> = { tr, en, es };
