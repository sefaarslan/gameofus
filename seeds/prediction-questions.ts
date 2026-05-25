export type PredictionOption = {
  option_text: string;
  sort_order: number;
};

export type PredictionQuestionSeed = {
  mode: "prediction";
  category: string;
  question_text: string;
  locale: string;
  is_active: boolean;
  options: PredictionOption[];
};

export const predictionQuestions: PredictionQuestionSeed[] = [
  // lifestyle (1–5)
  {
    mode: "prediction",
    category: "lifestyle",
    question_text: "Bu hafta sonu boş vaktinde ne yaparsın?",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Evde dinlenir, bir şeyler izlerim", sort_order: 1 },
      { option_text: "Arkadaşlarla dışarı çıkarım", sort_order: 2 },
      { option_text: "Spor yapar ya da yürüyüşe çıkarım", sort_order: 3 },
      { option_text: "Yeni bir yer keşfederim", sort_order: 4 },
    ],
  },
  {
    mode: "prediction",
    category: "lifestyle",
    question_text: "Uzun ve yorucu bir günün ardından nasıl dinlenirsin?",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Yalnız sessizce oturur, zihnimi boşaltırım", sort_order: 1 },
      { option_text: "Sevdiğim biriyle sohbet ederim", sort_order: 2 },
      { option_text: "Egzersiz yapar ya da hareket ederim", sort_order: 3 },
      { option_text: "Bir şeyler yerim ve uyurum", sort_order: 4 },
    ],
  },
  {
    mode: "prediction",
    category: "lifestyle",
    question_text: "Tatilde önceliğin ne olur?",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Tamamen dinlenirim, plaj veya otel", sort_order: 1 },
      { option_text: "Kültür gezisi, müze ve tarihi yerler", sort_order: 2 },
      { option_text: "Macera ve aktif aktiviteler", sort_order: 3 },
      { option_text: "Restoran ve yerel lezzetler", sort_order: 4 },
    ],
  },
  {
    mode: "prediction",
    category: "lifestyle",
    question_text: "Sürpriz bir tam gün boş kalsan ne yaparsın?",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Bol bol uyur, dinlenirim", sort_order: 1 },
      { option_text: "Film veya dizi maratonu yaparım", sort_order: 2 },
      { option_text: "Arkadaşlara ulaşır, spontane buluşurum", sort_order: 3 },
      { option_text: "Doğaya çıkar, yürürüm", sort_order: 4 },
    ],
  },
  {
    mode: "prediction",
    category: "lifestyle",
    question_text: "Sabah kalkınca ilk ne yaparsın?",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Hemen telefona bakarım", sort_order: 1 },
      { option_text: "Kahve ya da çay, sessizce", sort_order: 2 },
      { option_text: "Duş alırım", sort_order: 3 },
      { option_text: "Egzersiz veya yürüyüş", sort_order: 4 },
    ],
  },

  // first_date (6–8)
  {
    mode: "prediction",
    category: "first_date",
    question_text: "İlk buluşma için ideal yer ne olur?",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Kahve dükkanı — sakin, rahat", sort_order: 1 },
      { option_text: "Yürüyüş ya da park — açık hava", sort_order: 2 },
      { option_text: "Restoran — akşam yemeği", sort_order: 3 },
      { option_text: "Aktivite — bowling, müze, atölye", sort_order: 4 },
    ],
  },
  {
    mode: "prediction",
    category: "first_date",
    question_text: "Akşam planı yapılırken ne tercih edersin?",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Evde yemek yapıp film izlemek", sort_order: 1 },
      { option_text: "Dışarıda yemek ve şehirde vakit geçirmek", sort_order: 2 },
      { option_text: "Arkadaşlarla büyük bir buluşma", sort_order: 3 },
      { option_text: "Sanat, konser veya etkinliğe katılmak", sort_order: 4 },
    ],
  },
  {
    mode: "prediction",
    category: "first_date",
    question_text: "Hediye alacaksan nasıl seçersin?",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Önceden sorar, yanlış almam", sort_order: 1 },
      { option_text: "Uzun düşünür, özel bir şey bulurum", sort_order: 2 },
      { option_text: "En pratik ve kullanışlı olanı alırım", sort_order: 3 },
      { option_text: "Deneyim hediye ederim (etkinlik, yemek)", sort_order: 4 },
    ],
  },

  // communication (9–11)
  {
    mode: "prediction",
    category: "communication",
    question_text: "Bir sorun olduğunda nasıl başa çıkarsın?",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Hemen çözüm arar, aksiyon alırım", sort_order: 1 },
      { option_text: "Konuşur, birinden görüş alırım", sort_order: 2 },
      { option_text: "Bir süre düşünür, olgunlaştırırım", sort_order: 3 },
      { option_text: "Kafamı dağıtır, sonra dönerim", sort_order: 4 },
    ],
  },
  {
    mode: "prediction",
    category: "communication",
    question_text: "Bir anlaşmazlıkta ilk adımı nasıl atarsın?",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Hemen konuşmak isterim, bekleyemem", sort_order: 1 },
      { option_text: "Karşı tarafın gelmesini beklerim", sort_order: 2 },
      { option_text: "Birlikte oturalım, konuşalım derim", sort_order: 3 },
      { option_text: "Sakinleşmek için biraz süre veririm", sort_order: 4 },
    ],
  },
  {
    mode: "prediction",
    category: "communication",
    question_text: "Sosyal medyayı nasıl kullanırsın?",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Günde birkaç kez açar, bakar kapatırım", sort_order: 1 },
      { option_text: "Çok sık, neredeyse hep açık", sort_order: 2 },
      { option_text: "Nadiren, sadece gerektiğinde", sort_order: 3 },
      { option_text: "Neredeyse hiç kullanmam", sort_order: 4 },
    ],
  },

  // social_life (12–13)
  {
    mode: "prediction",
    category: "social_life",
    question_text: "Yeni bir yerde yemek yiyeceksin, nasıl seçersin?",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Google harita yorumlarına bakarım", sort_order: 1 },
      { option_text: "Arkadaşıma sorarım", sort_order: 2 },
      { option_text: "Gözüme çarpan yere girerim", sort_order: 3 },
      { option_text: "Sosyal medyada araştırırım", sort_order: 4 },
    ],
  },
  {
    mode: "prediction",
    category: "social_life",
    question_text: "Yakın arkadaşların seni nasıl tanımlar?",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Güvenilir ve sadık", sort_order: 1 },
      { option_text: "Eğlenceli ve sosyal", sort_order: 2 },
      { option_text: "Sakin ve dinlendirici", sort_order: 3 },
      { option_text: "Meraklı ve yaratıcı", sort_order: 4 },
    ],
  },

  // values (14–15)
  {
    mode: "prediction",
    category: "values",
    question_text: "Bir filmi ya da diziyi seçerken ne istersin?",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Duygusal ve derin hikaye", sort_order: 1 },
      { option_text: "Aksiyon ve görsel şölen", sort_order: 2 },
      { option_text: "Komedi ve hafif eğlence", sort_order: 3 },
      { option_text: "Düşündüren, mesajlı bir konu", sort_order: 4 },
    ],
  },
  {
    mode: "prediction",
    category: "values",
    question_text: "Rutin mi spontanlık mı — sana hangisi daha yakın?",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Planlı ve organize yaşarım", sort_order: 1 },
      { option_text: "Spontane ve anın akışında giderim", sort_order: 2 },
      { option_text: "İkisini dengelerim", sort_order: 3 },
      { option_text: "Duruma göre değişiyor", sort_order: 4 },
    ],
  },
];
