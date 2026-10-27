import type { RedFlagScenario, RedFlagTag } from "./types.ts";

// Red Flag Mayın Tarlası — ikinci içerik partisi: friend-104…107 ve romantic-104…107 (8 set × 9 kart = 72 senaryo, TR/EN/ES).
// Dağılım kuralları (scripts/check-solo.mjs doğrular):
//  - Her set 9 kart: 6 temanın hepsi + 3 ekstra (aynı tema bir kez daha, farklı tonda).
//  - Her kategoride (4 set = 36 kart) her tema tam 6 kez: 2 sağlıklı (H), 2 gri (G), 2 endişe verici (C).
//  - Her sette ton 3 H / 3 G / 3 C; sıra karışık (ardışık aynı tema yok, ardışık en fazla 2 aynı ton, ilk kart C değil).
//  - Metinler ikinci tekil kişi ve cinsiyetsiz; Arkadaşlık setlerinde romantik çağrışım yok.
// Senaryo numaraları (n) 21'den başlar ve tema başına sırayla verilir: kimlikler (`tema:n`) belirlenimcidir, sırayı DEĞİŞTİRME.
type Tone = "H" | "G" | "C";

const counters: Record<string, number> = {};
const out: RedFlagScenario[] = [];
const add = (pack: string, pos: number, tag: RedFlagTag, tone: Tone, tr: string, en: string, es: string) => {
  const n = (counters[tag] = (counters[tag] ?? 20) + 1);
  out.push({ tag, n, tr, en, es, pack, pos, tone });
};

// ── friend-104 ──────────────────────────────────────────────────────────────
add("friend-104", 1, "trust", "H",
  "Birisi sana anlattığın özel bir şeyi arkadaşına sorduğunda arkadaşın “Bunu ondan duymalısın, bana düşmez” deyip konuyu değiştiriyor.",
  "When someone asks your friend about something private you told them, they say “That's yours to share, not mine” and change the subject.",
  "Cuando alguien pregunta a tu amigo por algo privado que le contaste, este responde «eso te toca contarlo a ti, no a mí» y cambia de tema.");
add("friend-104", 2, "jealousy", "C",
  "Arkadaşın, diğer arkadaşlarınla yaptığın planları ona önceden haber vermeni bekliyor; vermezsen küsüyor.",
  "Your friend expects you to tell them in advance about plans with your other friends, and sulks if you don't.",
  "Tu amigo espera que le avises con antelación de tus planes con otros amigos y se enfada si no lo haces.");
add("friend-104", 3, "respect", "H",
  "Fikrine katılmayan arkadaşın “Bir de senin gözünden bakayım” deyip seni sonuna kadar dinliyor.",
  "Your friend disagrees with you, yet says “Let me try to see it your way” and hears you out completely.",
  "Tu amigo no está de acuerdo contigo, pero dice «déjame verlo desde tu punto de vista» y te escucha hasta el final.");
add("friend-104", 4, "money_lifestyle", "G",
  "Ortak bir hediye için para toplanırken arkadaşın payını hep son güne bırakıyor ama sonunda mutlaka ödüyor.",
  "When your group chips in for a shared gift, your friend always pays their share on the last day, but they do pay.",
  "Cuando el grupo reúne dinero para un regalo, tu amigo siempre paga su parte el último día, pero la paga.");
add("friend-104", 5, "boundaries", "C",
  "“Bu akşam olmaz” dediğin halde arkadaşın kapına gelip “Bir dakika sadece” diyerek içeri girmeye çalışıyor.",
  "You said “Not tonight,” but your friend shows up at your door and says “Just one minute” while stepping inside.",
  "Dijiste «esta noche no», pero tu amigo se presenta en tu puerta y dice «solo un minuto» mientras intenta entrar.");
add("friend-104", 6, "trust", "C",
  "Arkadaşın, birlikte hazırladığınız bir işin başarısını grubun önünde tek başına üstleniyor ve senden hiç söz etmiyor.",
  "Your friend takes all the credit in front of the group for something you made together and never mentions you.",
  "Tu amigo se atribuye ante el grupo todo el mérito de algo que hicisteis juntos y ni te menciona.");
add("friend-104", 7, "communication", "H",
  "Seni yanlış anladığını fark eden arkadaşın “Sanırım yanlış anladım, bir daha anlatır mısın?” diye soruyor.",
  "Realizing they misread you, your friend asks “I think I misunderstood, could you explain again?”",
  "Al darse cuenta de que te malinterpretó, tu amigo pregunta «creo que te entendí mal, ¿me lo explicas otra vez?».");
add("friend-104", 8, "jealousy", "G",
  "Yeni bir hobiye başladığında arkadaşın ilgi gösteriyor ama ara sıra “Artık hep orada mısın?” diye takılıyor.",
  "You start a new hobby; your friend shows interest but keeps teasing “Are you always there now?”",
  "Empiezas una afición nueva y tu amigo se interesa, pero de vez en cuando te suelta «¿ahora siempre estás ahí?».");
add("friend-104", 9, "respect", "G",
  "Arkadaşın seni yeni insanlara hep “Bizim sakar” diye tanıştırıyor; sen gülüyorsun ama pek hoşlanmıyorsun.",
  "Your friend always introduces you to new people as “our klutz”; you laugh along, but you don't really like it.",
  "Tu amigo siempre te presenta a gente nueva como «el torpe del grupo»; tú te ríes, pero no te hace mucha gracia.");

// ── friend-105 ──────────────────────────────────────────────────────────────
add("friend-105", 1, "respect", "H",
  "Hakkında bir dedikodu dolaştığında arkadaşın “Onu tanıyorum, öyle biri değil” diyerek seni savunuyor.",
  "When a rumor about you goes around, your friend says “I know them, that's not true” and stands up for you.",
  "Cuando circula un rumor sobre ti, tu amigo dice «lo conozco, no es verdad» y sale en tu defensa.");
add("friend-105", 2, "communication", "G",
  "Neyin var diye sorduğunda arkadaşın “Sonra anlatırım” diyor ve birkaç gün sonra gerçekten kendiliğinden anlatıyor.",
  "When you ask what's wrong, your friend says “I'll tell you later,” and a few days later they really do.",
  "Cuando preguntas qué le pasa, tu amigo dice «ya te lo cuento» y, de hecho, unos días después te lo cuenta.");
add("friend-105", 3, "jealousy", "H",
  "Yeni biriyle yakınlaştığını gören arkadaşın “Seni mutlu eden herkes bana da iyi geliyor” diyor.",
  "Seeing you grow close to someone new, your friend says “Anyone who makes you happy is good news to me.”",
  "Al ver que te acercas a alguien nuevo, tu amigo dice «quien te hace feliz también me cae bien a mí».");
add("friend-105", 4, "boundaries", "C",
  "Sen odadan çıkınca arkadaşın telefonunu açıp mesajlarına bakıyor ve “Arkadaşlar arasında sır olmaz” diyor.",
  "While you're out of the room, your friend opens your phone, reads your messages, and says “Friends have no secrets.”",
  "Mientras sales de la habitación, tu amigo abre tu móvil, lee tus mensajes y dice «entre amigos no hay secretos».");
add("friend-105", 5, "money_lifestyle", "G",
  "Arkadaşın, grup tatillerinde hep en ucuz seçeneği öneriyor; bütçesine uymazsa sessizce katılmıyor.",
  "On group trips your friend always pushes for the cheapest option, and quietly sits it out if it doesn't fit their budget.",
  "En los viajes en grupo tu amigo siempre empuja por la opción más barata y, si no cabe en su presupuesto, no se apunta sin hacer ruido.");
add("friend-105", 6, "boundaries", "G",
  "Konuşmak istemediğin bir konuyu arkadaşın “Anlatırsan rahatlarsın” diyerek birkaç kez daha açıyor.",
  "Your friend brings up a topic you'd rather not discuss, saying “You'd feel better if you talked,” and tries again a few times.",
  "Tu amigo saca varias veces un tema del que no quieres hablar, diciendo «te sentirás mejor si lo cuentas».");
add("friend-105", 7, "communication", "C",
  "Arkadaşın, seninle ilgili bir şikâyetini sana söylemek yerine ortak arkadaşlar üzerinden ulaştırıyor.",
  "Instead of telling you directly, your friend passes on a complaint about you through other friends.",
  "En lugar de decírtelo directamente, tu amigo te hace llegar una queja sobre ti a través de otros amigos.");
add("friend-105", 8, "trust", "H",
  "Verdiği sözü tutamayacağını anlayan arkadaşın seni önceden bilgilendirip başka bir plan öneriyor.",
  "Realizing they can't keep a promise, your friend tells you ahead of time and suggests an alternative.",
  "Al darse cuenta de que no podrá cumplir una promesa, tu amigo te avisa con tiempo y propone otra opción.");
add("friend-105", 9, "money_lifestyle", "C",
  "Ödünç aldığı parayı sorduğunda arkadaşın “Ben sana vermiştim, hatırlamıyor musun?” diyor; oysa vermemişti.",
  "When you ask about money they borrowed, your friend says “I already paid you back, don't you remember?” though they didn't.",
  "Cuando le preguntas por el dinero que te pidió prestado, tu amigo dice «ya te lo devolví, ¿no te acuerdas?», aunque no lo hizo.");

// ── friend-106 ──────────────────────────────────────────────────────────────
add("friend-106", 1, "trust", "G",
  "Arkadaşın senin sırlarını iyi saklıyor ama kendi hayatında olup bitenleri sana neredeyse hiç anlatmıyor.",
  "Your friend keeps your secrets well, but almost never tells you what's going on in their own life.",
  "Tu amigo guarda bien tus secretos, pero casi nunca te cuenta lo que pasa en su propia vida.");
add("friend-106", 2, "boundaries", "G",
  "Arkadaşın seni sık sık haber vermeden ziyaret ediyor; bazen güzel bir sürpriz, bazen yorucu oluyor.",
  "Your friend drops by without notice quite often; sometimes it's a nice surprise, sometimes it's tiring.",
  "Tu amigo te visita a menudo sin avisar; a veces es una grata sorpresa y a veces resulta agotador.");
add("friend-106", 3, "respect", "C",
  "Sen konuşurken arkadaşın gözlerini deviriyor ve herkesin duyacağı kadar yüksek sesle iç çekiyor.",
  "While you're talking, your friend rolls their eyes and sighs loudly enough for everyone to hear.",
  "Mientras hablas, tu amigo pone los ojos en blanco y suspira lo bastante alto para que todos lo oigan.");
add("friend-106", 4, "money_lifestyle", "C",
  "Arkadaşın, hesabı sen ödeyesin diye cüzdanını “unutuyor” ve bu neredeyse her buluşmada tekrar ediyor.",
  "Your friend “forgets” their wallet so that you end up paying, and it happens at nearly every meetup.",
  "Tu amigo «se olvida» la cartera para que acabes pagando tú, y pasa en casi todas las quedadas.");
add("friend-106", 5, "jealousy", "H",
  "Başka bir arkadaşınla çok vakit geçirdiğini söylediğinde arkadaşın “Güzel, anlat bakalım neler yaptınız” diyor.",
  "When you mention spending lots of time with another friend, yours says “Nice, tell me what you did.”",
  "Cuando comentas que pasaste mucho tiempo con otro amigo, el tuyo dice «qué bien, cuéntame qué hicisteis».");
add("friend-106", 6, "communication", "C",
  "Bir tartışmanın ortasında arkadaşın konuyu değiştirip hiçbir şey olmamış gibi davranıyor.",
  "In the middle of a disagreement, your friend changes the subject and acts as if nothing happened.",
  "En mitad de una discusión, tu amigo cambia de tema y actúa como si nada hubiera pasado.");
add("friend-106", 7, "boundaries", "H",
  "Fotoğrafını sosyal medyada paylaşmadan önce arkadaşın “Paylaşsam sorun olur mu?” diye soruyor.",
  "Before posting a photo of you on social media, your friend asks “Is it okay if I share this?”",
  "Antes de publicar una foto tuya en redes, tu amigo pregunta «¿te parece bien que la suba?».");
add("friend-106", 8, "communication", "G",
  "Duygularını konuşmak yerine arkadaşın komik bir çıkartma gönderip geçiştirmeyi tercih ediyor.",
  "Instead of talking about feelings, your friend would rather send a funny sticker and move on.",
  "En lugar de hablar de sentimientos, tu amigo prefiere mandar un sticker gracioso y pasar página.");
add("friend-106", 9, "money_lifestyle", "H",
  "Maddi olarak sıkıştığını söylediğinde arkadaşın seni yargılamadan “Birlikte bir çözüm bulalım” diyor.",
  "When you say money is tight, your friend doesn't judge and says “Let's figure something out together.”",
  "Cuando dices que andas justo de dinero, tu amigo no te juzga y dice «busquemos una solución juntos».");

// ── friend-107 ──────────────────────────────────────────────────────────────
add("friend-107", 1, "trust", "G",
  "Arkadaşın verdiği sözleri çoğu zaman tutuyor ama küçük ayrıntıları sık sık unutuyor.",
  "Your friend usually keeps their promises, but often forgets the small details.",
  "Tu amigo suele cumplir sus promesas, pero con frecuencia olvida los detalles pequeños.");
add("friend-107", 2, "money_lifestyle", "H",
  "Senden ödünç aldığı bir eşyayı bozan arkadaşın saklamak yerine hemen söylüyor ve yenisini alıyor.",
  "After breaking something they borrowed from you, your friend tells you right away and replaces it.",
  "Tras romper algo que te pidió prestado, tu amigo te lo dice enseguida y lo repone.");
add("friend-107", 3, "respect", "C",
  "Yaptığın bir işi arkadaşın herkesin içinde “Bunu ben çocukken yapardım” diyerek küçümsüyor.",
  "In front of everyone, your friend brushes off something you did with “I could do that as a kid.”",
  "Delante de todos, tu amigo quita importancia a algo que hiciste con un «eso lo hacía yo de niño».");
add("friend-107", 4, "jealousy", "C",
  "Başka biriyle sohbet ederken arkadaşın yanınıza gelip konuşmayı bölüyor ve seni oradan uzaklaştırıyor.",
  "When you're chatting with someone else, your friend walks over, interrupts, and steers you away.",
  "Cuando charlas con otra persona, tu amigo se acerca, interrumpe y te aparta de allí.");
add("friend-107", 5, "communication", "H",
  "Seni kırdığını fark eden arkadaşın konuyu kendisi açıp “Nasıl telafi edebilirim?” diye soruyor.",
  "Realizing they hurt you, your friend brings it up themselves and asks “How can I make it right?”",
  "Al darse cuenta de que te hirió, tu amigo saca el tema y pregunta «¿cómo puedo arreglarlo?».");
add("friend-107", 6, "respect", "G",
  "Arkadaşın sen anlatırken sık sık sözünü kesiyor ama bunu sadece heyecanlandığı için yaptığını söylüyor.",
  "Your friend often cuts in while you're talking, saying it's only because they get excited.",
  "Tu amigo te interrumpe a menudo mientras hablas y dice que es solo porque se emociona.");
add("friend-107", 7, "trust", "C",
  "Arkadaşın sana bir bahane, başkalarına başka bir bahane söylüyor; fark ettirdiğinde “Yanlış duymuşsun” diyor.",
  "Your friend gives you one excuse and others a different one; when you point it out, they say “You must have misheard.”",
  "Tu amigo te da una excusa y a otros una distinta; cuando lo señalas, responde «habrás oído mal».");
add("friend-107", 8, "boundaries", "H",
  "Sana özel bir şey sorarken arkadaşın “Anlatmak istemezsen sorun değil” diye ekliyor.",
  "When asking about something personal, your friend adds “No worries if you'd rather not say.”",
  "Al preguntarte algo personal, tu amigo añade «si prefieres no contarlo, no pasa nada».");
add("friend-107", 9, "jealousy", "G",
  "Başka biriyle yeni bir proje başlattığını duyan arkadaşın “Bana hiç sormadın bile” diye hafifçe sitem ediyor.",
  "Hearing you started a project with someone else, your friend mildly complains “You didn't even ask me.”",
  "Al enterarse de que empezaste un proyecto con otra persona, tu amigo se queja suavemente: «ni me lo preguntaste».");

// ── romantic-104 ────────────────────────────────────────────────────────────
add("romantic-104", 1, "money_lifestyle", "G",
  "Sevgilin birikiminin büyük kısmını pahalı bir telefona harcamak istiyor ve bunu karar vermeden önce sana söylüyor.",
  "Your partner wants to spend most of their savings on an expensive phone and tells you before deciding.",
  "Tu pareja quiere gastar casi todos sus ahorros en un móvil caro y te lo cuenta antes de decidir.");
add("romantic-104", 2, "boundaries", "C",
  "Sevgilin konumunu sürekli paylaşmanı istiyor; kapattığında “Demek bir şey saklıyorsun” diyor.",
  "Your partner wants you to share your location all the time, and when you turn it off says “So you're hiding something.”",
  "Tu pareja quiere que compartas tu ubicación todo el tiempo y, cuando la apagas, dice «entonces escondes algo».");
add("romantic-104", 3, "communication", "H",
  "Canı sıkkın olan sevgilin “Şu an biraz yoğunum ama anlatmak istiyorum, akşam konuşalım mı?” diyor.",
  "When upset, your partner says “I'm a bit swamped right now, but I want to tell you. Can we talk tonight?”",
  "Cuando algo le preocupa, tu pareja dice «ahora ando mal de tiempo, pero quiero contártelo, ¿hablamos esta noche?».");
add("romantic-104", 4, "respect", "G",
  "Sevgilin arkadaşlarının yanında seninle ilgili şakalar yapıyor; çoğu tatlı ama ara sıra biraz fazla kaçıyor.",
  "Your partner jokes about you in front of friends; most are sweet, but now and then they go a bit too far.",
  "Tu pareja bromea sobre ti delante de sus amigos; casi siempre son simpáticas, pero a veces se pasa un poco.");
add("romantic-104", 5, "trust", "C",
  "Nerede olduğunu her sorduğunda sevgilin sana farklı bir hikâye anlatıyor.",
  "Each time you ask where your partner was, they give a different story.",
  "Cada vez que preguntas dónde estaba tu pareja, cuenta una historia distinta.");
add("romantic-104", 6, "communication", "C",
  "İlişkinizdeki bir sorunu konuşmak istediğinde sevgilin “Yine mi başlıyorsun?” diyerek konuyu kapatıyor.",
  "Whenever you try to talk about a problem in the relationship, your partner shuts it down with “Here you go again.”",
  "Cada vez que intentas hablar de un problema de la relación, tu pareja lo corta con un «ya estás otra vez».");
add("romantic-104", 7, "respect", "H",
  "Bir işe verdiğin emeği fark eden sevgilin “Bunun için ne kadar uğraştığını biliyorum” diyor.",
  "Your partner notices the effort you put into something and says “I know how hard you worked on this.”",
  "Tu pareja nota el esfuerzo que pusiste en algo y dice «sé cuánto te has esforzado con esto».");
add("romantic-104", 8, "money_lifestyle", "H",
  "Sevgilin ortak giderler için sade bir bütçe hazırlıyor, tüm rakamları açıkça paylaşıyor ve senin de fikrini soruyor.",
  "Your partner puts together a simple budget for shared costs, shares every number openly, and asks for your input.",
  "Tu pareja prepara un presupuesto sencillo para los gastos comunes, comparte todas las cifras y te pide tu opinión.");
add("romantic-104", 9, "jealousy", "G",
  "İş arkadaşlarınla yediğin akşam yemeğini merak eden sevgilin “Kimler vardı?” diye soruyor; cevabını alınca konuyu kapatıyor.",
  "Curious about your dinner with colleagues, your partner asks “Who was there?” and drops it once you answer.",
  "Con curiosidad por tu cena con compañeros de trabajo, tu pareja pregunta «¿quiénes estaban?» y lo deja ahí cuando respondes.");

// ── romantic-105 ────────────────────────────────────────────────────────────
add("romantic-105", 1, "communication", "H",
  "Bir şey canını sıktığında sevgilin bunu sakin sakin anlatıyor: “Şu oldu ve bana şöyle hissettirdi.”",
  "When something bothers your partner, they explain it calmly: “This happened, and it made me feel this way.”",
  "Cuando algo le molesta, tu pareja lo explica con calma: «pasó esto y me hizo sentir así».");
add("romantic-105", 2, "jealousy", "C",
  "Sevgilin eski arkadaşlarınla görüşmeni “Onlar sana iyi gelmiyor” diyerek azaltmaya çalışıyor.",
  "Your partner tries to cut down your time with old friends, saying “They're not good for you.”",
  "Tu pareja intenta que veas menos a tus viejos amigos diciendo «no te convienen».");
add("romantic-105", 3, "money_lifestyle", "H",
  "Büyük bir alışverişten önce sevgilin “Birlikte bakalım, bütçeye uyar mı?” diye sana danışıyor.",
  "Before a big purchase, your partner asks “Shall we look together and see if it fits the budget?”",
  "Antes de una compra grande, tu pareja pregunta «¿lo miramos juntos y vemos si entra en el presupuesto?».");
add("romantic-105", 4, "respect", "H",
  "Kararına katılmasa bile sevgilin “Sen bilirsin, arkandayım” diyor.",
  "Even when your partner disagrees with your decision, they say “Your call, I've got your back.”",
  "Aunque no esté de acuerdo con tu decisión, tu pareja dice «tú decides, cuentas conmigo».");
add("romantic-105", 5, "boundaries", "G",
  "Sevgilin her akşam bir telefon bekliyor; aramazsan sitem etmiyor ama morali biraz bozuluyor.",
  "Your partner likes a call every evening; if you skip it they don't complain, but their mood dips a little.",
  "A tu pareja le gusta una llamada cada noche; si no llamas no se queja, pero se le nota el ánimo algo bajo.");
add("romantic-105", 6, "trust", "G",
  "Eski ilişkilerini sorduğunda sevgilin kısa cevaplar verip “Şimdilik bu kadar” diyor.",
  "When you ask about past relationships, your partner gives short answers and says “That's all for now.”",
  "Cuando preguntas por sus relaciones pasadas, tu pareja responde poco y dice «por ahora, hasta aquí».");
add("romantic-105", 7, "boundaries", "C",
  "Senin için önemli bir planı iptal ettirmek için sevgilin “Beni seviyorsan kalırsın” diyor.",
  "To make you cancel something important to you, your partner says “If you loved me, you'd stay.”",
  "Para que canceles un plan importante para ti, tu pareja dice «si me quisieras, te quedarías».");
add("romantic-105", 8, "communication", "C",
  "Tartışmanın ortasında sevgilin “Sen zaten anlamazsın” deyip telefonuna dönüyor.",
  "In the middle of an argument, your partner says “You wouldn't understand anyway” and turns to their phone.",
  "En plena discusión, tu pareja dice «tú no lo entenderías» y se pone con el móvil.");
add("romantic-105", 9, "money_lifestyle", "G",
  "Sevgilin hesabı hep kendisi ödemekte ısrar ediyor; bölüşmek istediğinde kabul etmiyor ve bu seni biraz rahatsız ediyor.",
  "Your partner insists on paying every bill and won't let you split it, which makes you a little uneasy.",
  "Tu pareja insiste en pagar siempre la cuenta y no te deja dividirla, lo que te incomoda un poco.");

// ── romantic-106 ────────────────────────────────────────────────────────────
add("romantic-106", 1, "respect", "G",
  "Sevgilin senin projene “Hobi gibi bir şey” diyor ama sonunda yine de seni desteklediğini söylüyor.",
  "Your partner calls your project “just a hobby,” yet in the end says they support you.",
  "Tu pareja llama a tu proyecto «una especie de afición», aunque al final dice que te apoya.");
add("romantic-106", 2, "money_lifestyle", "C",
  "Sevgilin senin gelirini ayrıntılı soruyor ama kendi gelirini “Bu özel” diyerek hiç paylaşmıyor.",
  "Your partner asks about your income in detail but never shares theirs, saying “That's private.”",
  "Tu pareja te pregunta por tus ingresos con detalle, pero nunca comparte los suyos y dice «eso es privado».");
add("romantic-106", 3, "boundaries", "H",
  "Sevgilin telefonuna hiç bakmıyor ve “Paylaşmak istediğini anlatırsın” diyor.",
  "Your partner never checks your phone and says “Tell me whatever you want to share.”",
  "Tu pareja nunca mira tu móvil y dice «cuéntame lo que quieras compartir».");
add("romantic-106", 4, "communication", "G",
  "Sevgilinin duygularını konuşmak zor geliyor; onun yerine sana küçük notlar bırakıyor.",
  "Your partner finds it hard to talk about feelings, so they leave you small notes instead.",
  "A tu pareja le cuesta hablar de sus sentimientos, así que te deja notitas.");
add("romantic-106", 5, "jealousy", "G",
  "Eski sevgilinle hâlâ konuştuğunu öğrenen sevgilin sakin kalıyor ama birkaç gün bunu düşünüp duruyor.",
  "Learning you still talk to an ex, your partner stays calm but keeps turning it over for a few days.",
  "Al enterarse de que sigues hablando con un ex, tu pareja mantiene la calma, pero anda dándole vueltas unos días.");
add("romantic-106", 6, "trust", "H",
  "Sevgilin, itiraf etmekte zorlandığı bir hatasını kendiliğinden gelip sana anlatıyor.",
  "Your partner comes to you on their own to confess a mistake they found hard to admit.",
  "Tu pareja viene por su cuenta a contarte un error que le costaba admitir.");
add("romantic-106", 7, "respect", "C",
  "Başkalarının yanında yaptığın bir işi sevgilin “Yanlış yapıyorsun” diyerek düzeltiyor ve herkesin önünde baştan yaptırıyor.",
  "In front of others, your partner says “You're doing it wrong” and makes you redo something right there.",
  "Delante de otras personas, tu pareja dice «lo estás haciendo mal» y te hace repetir algo allí mismo.");
add("romantic-106", 8, "jealousy", "H",
  "Eski bir arkadaşınla buluşacağını duyan sevgilin “Selam söyle” diyor ve konuyu uzatmıyor.",
  "Hearing you're meeting an old friend, your partner says “Say hi from me” and doesn't make a thing of it.",
  "Al saber que quedarás con un viejo amigo, tu pareja dice «dale recuerdos» y no le da más vueltas.");
add("romantic-106", 9, "trust", "C",
  "Bir tartışma sırasında sevgilin, sana güvenerek anlattığın bir şeyi sana karşı kullanıyor.",
  "During an argument, your partner uses against you something you confided in them.",
  "En plena discusión, tu pareja usa en tu contra algo que le confiaste.");

// ── romantic-107 ────────────────────────────────────────────────────────────
add("romantic-107", 1, "jealousy", "H",
  "Bir ortamda ne kadar parladığını gören sevgilin kıskanmak yerine bunu gururla anlatıyor.",
  "Seeing you shine in a crowd, your partner doesn't get jealous and happily tells others how proud they are.",
  "Al verte lucir en un grupo, tu pareja no siente celos y comenta a los demás cuánto le alegra.");
add("romantic-107", 2, "trust", "H",
  "Sevgilin verdiği küçük sözleri bile sen hatırlatmadan zamanında yerine getiriyor.",
  "Your partner keeps even small promises on time without needing a reminder.",
  "Tu pareja cumple hasta las promesas pequeñas a tiempo, sin que haga falta recordárselo.");
add("romantic-107", 3, "communication", "G",
  "Bir tartışmanın ardından sevgilin konuşmak yerine sevdiğin yemeği yapıp barışmayı tercih ediyor.",
  "After an argument, your partner would rather cook your favorite meal than talk it through.",
  "Tras una discusión, tu pareja prefiere cocinar tu plato favorito antes que hablarlo.");
add("romantic-107", 4, "jealousy", "C",
  "Bir arkadaşınla çekilmiş fotoğrafını gören sevgilin “Onunla görüşmeni istemiyorum” diyor.",
  "Seeing a photo of you with a friend, your partner says “I don't want you seeing them.”",
  "Al ver una foto tuya con un amigo, tu pareja dice «no quiero que te veas con esa persona».");
add("romantic-107", 5, "boundaries", "G",
  "Sevgilin her şeyi birlikte yapmayı seviyor; sen ise ara sıra yalnız kalmak istiyorsun ve bunu söylemekte zorlanıyorsun.",
  "Your partner loves doing everything together, while you sometimes want time alone and find it hard to say so.",
  "A tu pareja le encanta hacerlo todo juntos, mientras que tú a veces quieres tiempo a solas y te cuesta decirlo.");
add("romantic-107", 6, "respect", "C",
  "Sevgilin senin ilgi alanını “Çocukça” diye alaya alıyor ve buna dair şakaları sürdürüyor.",
  "Your partner mocks one of your interests as “childish” and keeps making jokes about it.",
  "Tu pareja se burla de una de tus aficiones llamándola «infantil» y sigue haciendo bromas al respecto.");
add("romantic-107", 7, "boundaries", "H",
  "Seni ailesiyle tanıştırmadan önce sevgilin “Hazır hissediyor musun?” diye soruyor.",
  "Before introducing you to their family, your partner asks “Do you feel ready?”",
  "Antes de presentarte a su familia, tu pareja pregunta «¿te parece bien dar el paso?».");
add("romantic-107", 8, "trust", "G",
  "Sevgilin bir konuda sana tüm gerçeği söylemiyor ve bunu seni üzmemek için yaptığını söylüyor.",
  "Your partner doesn't tell you the whole truth about something, saying it's to avoid upsetting you.",
  "Tu pareja no te cuenta toda la verdad sobre algo y dice que lo hace para no disgustarte.");
add("romantic-107", 9, "money_lifestyle", "C",
  "Sevgilin ortak bütçeye sözleştiğiniz payı üç aydır yatırmıyor ve sorduğunda “Sonra” diyor.",
  "Your partner hasn't put in their agreed share of the shared budget for three months and says “Later” when asked.",
  "Tu pareja lleva tres meses sin aportar lo acordado al presupuesto común y responde «luego» cuando se lo preguntas.");

/** friend-104…107 ve romantic-104…107 senaryoları (pack/pos/tone dolu). */
export const setsBatch2: RedFlagScenario[] = out;
