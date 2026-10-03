import type { SeedCategory } from "./types";

// Kanka Testi — yalnızca "friend". Hiçbir soru romantik çağrışım taşımamalı (scripts/check-questions.mjs denetler).
// secret_choice cevapları: Evet / Kararsız / Hayır. orderline'da 1. sıra "en çok" demektir.
export const friendTest: SeedCategory = {
  slug: "friend_test",
  names: { tr: "Kanka Testi", en: "Bestie Test", es: "Test de Colegas" },
  relationshipTypes: ["friend"],
  isPremium: false,
  sortOrder: 1,
  questions: [
    // ── Secret Choice (8) ────────────────────────────────────────────────
    {
      mode: "secret_choice",
      tag: "responsiveness",
      tr: { text: "Bir grup mesajını okuyup günlerce cevap vermediğin olur mu?" },
      en: { text: "Do you ever read a group chat message and forget to reply for days?" },
      es: { text: "¿Te pasa leer un mensaje del grupo y olvidarte de responder durante días?" },
    },
    {
      mode: "secret_choice",
      tag: "social_energy",
      tr: { text: "Hiç tanımadığın bir kalabalıkta bile rahatça sohbet başlatabilir misin?" },
      en: { text: "Can you easily start a conversation in a crowd of strangers?" },
      es: { text: "¿Puedes iniciar una conversación con facilidad entre desconocidos?" },
    },
    {
      mode: "secret_choice",
      tag: "impulse_buying",
      tr: { text: "Alışverişe çıktığında listendeki şeyler dışında bir şey almadan dönebilir misin?" },
      en: { text: "Can you go shopping and come home with only what was on your list?" },
      es: { text: "¿Puedes ir de compras y volver solo con lo que tenías en la lista?" },
    },
    {
      mode: "secret_choice",
      tag: "competitiveness",
      tr: { text: "Sıradan bir oyunu bile ciddiye alıp kazanmak ister misin?" },
      en: { text: "Do you take even a casual game seriously and want to win?" },
      es: { text: "¿Te tomas en serio hasta un juego casual y quieres ganar?" },
    },
    {
      mode: "secret_choice",
      tag: "trust_discretion",
      tr: { text: "Bir arkadaşının sana anlattığı şeyi, “kimseye söyleme” demese bile saklar mısın?" },
      en: { text: "If a friend tells you something, do you keep it to yourself even if they don't ask you to?" },
      es: { text: "Si alguien de tu grupo te cuenta algo, ¿lo guardas para ti aunque no te pida que lo hagas?" },
    },
    {
      mode: "secret_choice",
      tag: "self_reliance",
      tr: { text: "Yolunu kaybedince telefonu çıkarmadan önce kendi başına bulmaya çalışır mısın?" },
      en: { text: "When you're lost, do you try to figure it out yourself before pulling out your phone?" },
      es: { text: "Cuando te pierdes, ¿intentas orientarte por tu cuenta antes de sacar el móvil?" },
    },
    {
      mode: "secret_choice",
      tag: "novelty_seeking",
      tr: { text: "Yeni çıkan bir yiyeceği ya da içeceği ilk haftasında denemek ister misin?" },
      en: { text: "Do you like to try a newly released food or drink in its first week?" },
      es: { text: "¿Te gusta probar una comida o bebida nueva en su primera semana?" },
    },
    {
      mode: "secret_choice",
      tag: "humor_expressiveness",
      tr: { text: "Komik bir anıyı hatırlayıp tek başınayken gülmeye başladığın olur mu?" },
      en: { text: "Do you ever start laughing on your own remembering a funny moment?" },
      es: { text: "¿Te ríes a solas al acordarte de un momento gracioso?" },
    },

    // ── Prediction (5) ───────────────────────────────────────────────────
    {
      mode: "prediction",
      tag: "planning_style",
      tr: {
        text: "Arkadaş grubuyla bir hafta sonu kaçamağı planlıyorsunuz. Sen genelde ne yaparsın?",
        options: [
          "Programı saat saat ben hazırlarım",
          "Birkaç fikir atarım, gerisini akışa bırakırım",
          "Biri karar verene kadar beklerim",
          "Hiçbir şey planlamam, orada karar veririm",
        ],
      },
      en: {
        text: "You're planning a weekend getaway with friends. What do you usually do?",
        options: [
          "Build the whole schedule, hour by hour",
          "Throw out a few ideas and go with the flow",
          "Wait until someone else decides",
          "Plan nothing and decide when we get there",
        ],
      },
      es: {
        text: "Estáis planeando una escapada de fin de semana con amigos. ¿Qué sueles hacer?",
        options: [
          "Preparo el plan hora por hora",
          "Propongo algunas ideas y me dejo llevar",
          "Espero a que alguien decida",
          "No planeo nada y decido al llegar",
        ],
      },
    },
    {
      mode: "prediction",
      tag: "social_awkwardness",
      tr: {
        text: "Arkadaş ortamında biri çok kötü bir şaka yaptı ve kimse gülmedi. Sen ne yaparsın?",
        options: [
          "Mahcup olmasın diye gülerim",
          "Konuyu hemen değiştiririm",
          "Daha kötü bir şakayla ortamı kurtarırım",
          "Sessizce telefonuma bakarım",
        ],
      },
      en: {
        text: "Someone makes a terrible joke in a group and nobody laughs. What do you do?",
        options: [
          "Laugh, so they don't feel embarrassed",
          "Change the subject right away",
          "Save the moment with an even worse joke",
          "Quietly check my phone",
        ],
      },
      es: {
        text: "Alguien suelta un chiste malísimo en el grupo y nadie se ríe. ¿Qué haces?",
        options: [
          "Me río para que no se sienta mal",
          "Cambio de tema enseguida",
          "Lo salvo con un chiste aún peor",
          "Miro el móvil en silencio",
        ],
      },
    },
    {
      mode: "prediction",
      tag: "supportiveness",
      tr: {
        text: "Gece yarısı bir arkadaşın “Acil, konuşabilir miyiz?” diye mesaj attı. Ne yaparsın?",
        options: [
          "Hemen ararım",
          "Önce ne olduğunu mesajla sorarım",
          "Uyanıksam yazarım, değilsem sabah ilk iş dönerim",
          "Kim olduğuna ve konuya göre karar veririm",
        ],
      },
      en: {
        text: "A friend texts you at midnight: “It's urgent, can we talk?” What do you do?",
        options: [
          "Call right away",
          "Text first to ask what's going on",
          "Reply if I'm awake, first thing in the morning if not",
          "Depends on who it is and what it's about",
        ],
      },
      es: {
        text: "Un amigo te escribe a medianoche: «Es urgente, ¿podemos hablar?». ¿Qué haces?",
        options: [
          "Lo llamo enseguida",
          "Primero le escribo para saber qué pasa",
          "Respondo si estoy despierto; si no, a primera hora",
          "Depende de quién sea y del tema",
        ],
      },
    },
    {
      mode: "prediction",
      tag: "honesty_vs_tact",
      tr: {
        text: "Bir arkadaşın yeni aldığı kıyafeti gösterdi ve sence ona hiç yakışmamış. Ne dersin?",
        options: [
          "Dürüstçe söylerim",
          "Nazikçe başka bir seçenek öneririm",
          "Beğenmiş gibi yaparım",
          "Konuyu değiştirmeye çalışırım",
        ],
      },
      en: {
        text: "A friend shows you an outfit they just bought, and you think it doesn't suit them. What do you say?",
        options: [
          "Tell them honestly",
          "Gently suggest another option",
          "Pretend I like it",
          "Try to change the subject",
        ],
      },
      es: {
        text: "Un amigo te enseña una prenda que acaba de comprar y crees que no le queda bien. ¿Qué le dices?",
        options: [
          "Se lo digo con sinceridad",
          "Le sugiero otra opción con tacto",
          "Finjo que me gusta",
          "Intento cambiar de tema",
        ],
      },
    },
    {
      mode: "prediction",
      tag: "money_generosity",
      tr: {
        text: "Beklenmedik bir para ödülü kazandın. İlk ne yaparsın?",
        options: [
          "Arkadaşlara bir şeyler ısmarlarım",
          "Büyük kısmını kenara koyarım",
          "Uzun zamandır istediğim bir şeyi alırım",
          "Bir kısmını ihtiyacı olan birine ayırırım",
        ],
      },
      en: {
        text: "You win an unexpected cash prize. What's the first thing you do?",
        options: [
          "Treat my friends to something",
          "Save most of it",
          "Buy something I've wanted for a long time",
          "Give some to someone in need",
        ],
      },
      es: {
        text: "Ganas un premio en efectivo inesperado. ¿Qué es lo primero que haces?",
        options: [
          "Invito a mis amigos a algo",
          "Ahorro la mayor parte",
          "Me compro algo que llevo tiempo queriendo",
          "Dono una parte a alguien que lo necesite",
        ],
      },
    },

    // ── Orderline (4) ────────────────────────────────────────────────────
    {
      mode: "orderline",
      tag: "group_role",
      tr: {
        text: "Bir arkadaş grubundaki rolünü en iyi anlatan şeyleri, sana en çok uyandan başlayarak sırala:",
        options: ["Planlayan", "Güldüren", "Dinleyen", "Cesaret veren"],
      },
      en: {
        text: "Rank what best describes your role in a friend group, starting with what fits you most:",
        options: ["The planner", "The funny one", "The listener", "The encourager"],
      },
      es: {
        text: "Ordena lo que mejor describe tu papel en un grupo de amigos, empezando por lo que más te representa:",
        options: ["El que organiza", "El gracioso", "El que escucha", "El que anima"],
      },
    },
    {
      mode: "orderline",
      tag: "weekend_style",
      tr: {
        text: "Mükemmel bir cumartesi gününü nasıl geçirmek istersin? Sırala:",
        options: [
          "Dışarıda arkadaşlarla vakit",
          "Evde film ya da dizi",
          "Spor ya da doğada yürüyüş",
          "Yeni bir şey öğrenmek veya üretmek",
        ],
      },
      en: {
        text: "How would you spend a perfect Saturday? Rank:",
        options: [
          "Time out with friends",
          "A movie or series at home",
          "Sports or a walk in nature",
          "Learning or making something new",
        ],
      },
      es: {
        text: "¿Cómo pasarías un sábado perfecto? Ordena:",
        options: [
          "Salir con amigos",
          "Una película o serie en casa",
          "Deporte o paseo por la naturaleza",
          "Aprender o crear algo nuevo",
        ],
      },
    },
    {
      mode: "orderline",
      tag: "pet_peeves",
      tr: {
        text: "Bir arkadaşının hangi davranışı seni en çok rahatsız eder? En rahatsız edenden başlayarak sırala:",
        options: [
          "Sürekli geç kalması",
          "Verdiği sözü tutmaması",
          "Arkadan konuşması",
          "Planı son dakikada iptal etmesi",
        ],
      },
      en: {
        text: "Which friend behavior bothers you most? Rank from most to least annoying:",
        options: [
          "Always being late",
          "Not keeping their word",
          "Talking behind your back",
          "Cancelling plans at the last minute",
        ],
      },
      es: {
        text: "¿Qué comportamiento de un amigo te molesta más? Ordena de más a menos molesto:",
        options: [
          "Llegar siempre tarde",
          "No cumplir su palabra",
          "Hablar a tus espaldas",
          "Cancelar planes a última hora",
        ],
      },
    },
    {
      mode: "orderline",
      tag: "roadtrip_style",
      tr: {
        text: "Arkadaşlarla uzun bir yolculukta olmazsa olmazlarını sırala:",
        options: [
          "Güzel bir müzik listesi",
          "Yol atıştırmalıkları",
          "İyi sohbet",
          "Sessizlik ve rahat bir koltuk",
        ],
      },
      en: {
        text: "Rank your must-haves on a long road trip with friends:",
        options: ["A great playlist", "Road snacks", "Good conversation", "Peace and quiet in a comfy seat"],
      },
      es: {
        text: "Ordena tus imprescindibles en un viaje largo en coche con amigos:",
        options: ["Una buena playlist", "Snacks para el camino", "Buena conversación", "Silencio y un asiento cómodo"],
      },
    },

    // ── Tamamlama: her modda 10'a ──────────────────────────────────────
    {
      mode: "secret_choice",
      tag: "openness_to_plans",
      tr: { text: "Bir arkadaşının önerdiği, pek ilgini çekmeyen bir etkinliğe “bir şans vereyim” diye gider misin?" },
      en: { text: "If a friend suggests an activity that doesn't interest you, do you go along to give it a chance?" },
      es: { text: "Si un amigo propone una actividad que no te interesa, ¿vas para darle una oportunidad?" },
    },
    {
      mode: "secret_choice",
      tag: "inside_jokes",
      tr: { text: "Arkadaşlarınla sadece sizin anladığınız iç şakalarınız ya da gizli kod sözleriniz var mı?" },
      en: { text: "Do you and your friends have inside jokes or secret code words only you understand?" },
      es: { text: "¿Tienes con tus amigos bromas internas o palabras clave que solo entendéis vosotros?" },
    },
    {
      mode: "prediction",
      tag: "competitiveness_reaction",
      tr: { text: "Arkadaşlarınla oyun oynarken kaybetmeye başladın. Tepkin ne olur?", options: ["Gülüp eğlenmeye devam ederim", "Daha çok çabalayıp geri dönmeye çalışırım", "Kuralları sorgulamaya başlarım", "Kısa bir süre somurtur, sonra geçer"] },
      en: { text: "You start losing a game with friends. How do you react?", options: ["Laugh and keep having fun", "Try harder to come back", "Start questioning the rules", "Sulk for a bit, then get over it"] },
      es: { text: "Empiezas a perder un juego con tus amigos. ¿Cómo reaccionas?", options: ["Me río y sigo disfrutando", "Me esfuerzo más para remontar", "Empiezo a cuestionar las reglas", "Me enfurruño un rato y luego se me pasa"] },
    },
    {
      mode: "prediction",
      tag: "bill_style",
      tr: { text: "Arkadaşlarınla yemeğe gittiniz ve hesap geldi. Genelde ne yaparsın?", options: ["Hesabı eşit bölmeyi öneririm", "Herkes yediğini öder, hesabı ben yaparım", "Bu sefer ben ısmarlarım", "Hesap konusunu açmaya çekinir, geç açarım"] },
      en: { text: "You go out for a meal with friends and the bill arrives. What do you usually do?", options: ["Suggest splitting equally", "Everyone pays for what they had, I do the math", "Treat everyone this time", "Feel awkward and bring it up late"] },
      es: { text: "Salís a comer con amigos y llega la cuenta. ¿Qué sueles hacer?", options: ["Propongo dividir a partes iguales", "Cada uno paga lo suyo y yo hago las cuentas", "Invito yo esta vez", "Me da apuro y lo saco tarde"] },
    },
    {
      mode: "prediction",
      tag: "celebrating_others",
      tr: { text: "Bir arkadaşın büyük bir başarı elde etti. Ne yaparsın?", options: ["Hemen arayıp kutlarım", "Herkese duyurup bir kutlama organize ederim", "Kısa ve içten bir mesaj yazarım", "Gerçekten sevinirim ama pek belli etmem"] },
      en: { text: "A friend just achieved something big. What do you do?", options: ["Call right away to congratulate them", "Tell everyone and organize a celebration", "Send a short, heartfelt message", "Genuinely happy, but I don't show it much"] },
      es: { text: "Un amigo ha conseguido algo grande. ¿Qué haces?", options: ["Lo llamo enseguida para felicitarlo", "Se lo cuento a todos y organizo una celebración", "Le mando un mensaje corto y sincero", "Me alegro de verdad, pero lo muestro poco"] },
    },
    {
      mode: "prediction",
      tag: "roadtrip_role",
      tr: { text: "Arkadaşlarınla uzun bir yolculuğa çıkıyorsunuz ve aracı kimin süreceği konuşuluyor. Sen ne dersin?", options: ["Ben sürerim, direksiyonda rahatım", "Navigasyon ve müzik benden", "Sırayla sürelim", "Sürmek istemem, arka koltuk bana yeter"] },
      en: { text: "Your group is deciding who'll drive on a long trip. What do you say?", options: ["I'll drive, I'm comfortable behind the wheel", "I'll handle navigation and music", "Let's take turns", "I'd rather not drive, the back seat suits me"] },
      es: { text: "Vuestro grupo decide quién conducirá en un viaje largo. ¿Qué dices?", options: ["Conduzco yo, me siento cómodo al volante", "Yo me encargo del GPS y la música", "Turnémonos", "Prefiero no conducir, me va bien el asiento de atrás"] },
    },
    {
      mode: "prediction",
      tag: "surprise_role",
      tr: { text: "Bir arkadaşının sürpriz doğum günü partisini planlıyorsunuz. Sen hangi işi üstlenirsin?", options: ["Tüm planı koordine ederim", "Dekor ve atmosfer işini yaparım", "Hediye araştırmasını ben yaparım", "Arkadaşı oyalayıp sürprizi gizlerim"] },
      en: { text: "You're planning a surprise birthday for a friend. What's your job?", options: ["Coordinate the whole plan", "Handle the decor and atmosphere", "Research the gift", "Keep them distracted so the surprise stays secret"] },
      es: { text: "Estáis organizando una fiesta sorpresa de cumpleaños para un amigo. ¿Cuál es tu tarea?", options: ["Coordino todo el plan", "Me encargo de la decoración y el ambiente", "Investigo el regalo", "Lo distraigo para que no sospeche"] },
    },
    {
      mode: "orderline",
      tag: "happiest_moments",
      tr: { text: "Bir arkadaş grubunda seni en çok mutlu eden anları sırala:", options: ["Birlikte kahkaha atmak", "Başarılarımın kutlanması", "Sakin bir sohbet", "Beklenmedik bir macera"] },
      en: { text: "Rank the moments in a friend group that make you happiest:", options: ["Laughing together", "Having my wins celebrated", "A calm conversation", "An unexpected adventure"] },
      es: { text: "Ordena los momentos de un grupo de amigos que más te hacen feliz:", options: ["Reírnos juntos", "Que celebren mis logros", "Una charla tranquila", "Una aventura inesperada"] },
    },
    {
      mode: "orderline",
      tag: "admired_traits",
      tr: { text: "Bir arkadaşında en çok takdir ettiğin özellikleri sırala:", options: ["Güvenilir olması", "Komik olması", "Cömert olması", "Dürüst olması"] },
      en: { text: "Rank the traits you most admire in a friend:", options: ["Being reliable", "Being funny", "Being generous", "Being honest"] },
      es: { text: "Ordena los rasgos que más admiras en un amigo:", options: ["Ser fiable", "Ser gracioso", "Ser generoso", "Ser sincero"] },
    },
    {
      mode: "orderline",
      tag: "weekend_plans",
      tr: { text: "Arkadaşlarınla yapabileceğin en iyi hafta sonu planlarını sırala:", options: ["Kamp ya da doğa yürüyüşü", "Evde oyun gecesi", "Şehirde gezip yemek keşfetmek", "Konser ya da etkinlik"] },
      en: { text: "Rank the best weekend plans with friends:", options: ["Camping or a nature hike", "A game night at home", "Exploring the city and its food", "A concert or event"] },
      es: { text: "Ordena los mejores planes de fin de semana con amigos:", options: ["Acampada o ruta por la naturaleza", "Noche de juegos en casa", "Recorrer la ciudad y probar su comida", "Un concierto o evento"] },
    },
    {
      mode: "orderline",
      tag: "groupchat_style",
      tr: { text: "Bir grup sohbetinde en sık yaptığın şeyleri, en çok yaptığından başlayarak sırala:", options: ["Meme ve video paylaşmak", "Plan önermek", "Sadece okuyup sessiz kalmak", "Uzun uzun anlatmak"] },
      en: { text: "Rank what you do most in a group chat, starting with the most frequent:", options: ["Sharing memes and videos", "Proposing plans", "Just reading and staying quiet", "Writing long stories"] },
      es: { text: "Ordena lo que más haces en un chat de grupo, empezando por lo más frecuente:", options: ["Compartir memes y vídeos", "Proponer planes", "Solo leer y callarme", "Contar historias largas"] },
    },
    {
      mode: "orderline",
      tag: "quirky_habits",
      tr: { text: "Arkadaşlarının hangi tuhaf alışkanlığına en çok gülersin? En çok güldürenden başla:", options: ["Sürekli yön şaşırması", "Her şeyi unutması", "Her konuda iddiaya girmesi", "Hiç susmaması"] },
      en: { text: "Which quirky friend habit makes you laugh most? Start with the funniest:", options: ["Always getting lost", "Forgetting everything", "Betting on everything", "Never stopping talking"] },
      es: { text: "¿Qué manía rara de un amigo te hace más gracia? Empieza por la más graciosa:", options: ["Perderse siempre", "Olvidarse de todo", "Apostar por todo", "No parar de hablar"] },
    },
    {
      mode: "orderline",
      tag: "competition_strengths",
      tr: { text: "Arkadaş grubuyla bir yarışmada hangisinde en iyi olurdun? En iyi olduğundan başla:", options: ["Bilgi yarışması", "Fiziksel bir meydan okuma", "Yaratıcı yarışma (çizim, performans)", "Strateji oyunu"] },
      en: { text: "In a competition with friends, which would you be best at? Start with your strongest:", options: ["A trivia quiz", "A physical challenge", "A creative contest (drawing, performance)", "A strategy game"] },
      es: { text: "En una competición con amigos, ¿en cuál serías mejor? Empieza por tu fuerte:", options: ["Un concurso de preguntas", "Un reto físico", "Un concurso creativo (dibujo, actuación)", "Un juego de estrategia"] },
    },
  ],
};
