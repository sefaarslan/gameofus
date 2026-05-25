export type OrderlineCard = {
  option_text: string;
  sort_order: number; // başlangıç görüntüleme sırası; "doğru sıra" değil
};

export type OrderlineQuestionSeed = {
  mode: "orderline";
  category: string;
  question_text: string;
  locale: string;
  is_active: boolean;
  options: OrderlineCard[];
};

// answer_value / predicted_value formatı:
//   { "order": ["<option_id_1>", "<option_id_2>", ...] }
// Dizinin 1. elemanı en önemli / en tercihli karttır.
// Doğruluk kuralı: tam eşleşme = doğru; ≤1 komşu takas = yakın; ≥2 farklı = yanlış.

export const orderlineQuestions: OrderlineQuestionSeed[] = [
  {
    mode: "orderline",
    category: "values",
    question_text: "Bir ilişkide en önemli özellikleri sırala:",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Sadakat", sort_order: 1 },
      { option_text: "Empati", sort_order: 2 },
      { option_text: "Mizah", sort_order: 3 },
      { option_text: "Zeka", sort_order: 4 },
    ],
  },
  {
    mode: "orderline",
    category: "lifestyle",
    question_text: "Stresi azaltmak için başvurduğun yolları sırala:",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Uyku", sort_order: 1 },
      { option_text: "Egzersiz", sort_order: 2 },
      { option_text: "Müzik", sort_order: 3 },
      { option_text: "Sohbet", sort_order: 4 },
    ],
  },
  {
    mode: "orderline",
    category: "lifestyle",
    question_text: "İdeal bir hafta sonu için olmazsa olmaz şeyler — sırala:",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Dinlenme", sort_order: 1 },
      { option_text: "Sosyalleşme", sort_order: 2 },
      { option_text: "Doğa", sort_order: 3 },
      { option_text: "Kişisel zaman", sort_order: 4 },
    ],
  },
  {
    mode: "orderline",
    category: "values",
    question_text: "Bir partnerde seni en çok etkileyen şeyler — sırala:",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Dürüstlük", sort_order: 1 },
      { option_text: "Mizah", sort_order: 2 },
      { option_text: "Empati", sort_order: 3 },
      { option_text: "Özgüven", sort_order: 4 },
    ],
  },
  {
    mode: "orderline",
    category: "lifestyle",
    question_text: "Tatilde tercih ettiğin aktiviteler — önem sırasına göre:",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Yeme içme", sort_order: 1 },
      { option_text: "Keşif", sort_order: 2 },
      { option_text: "Dinlenme", sort_order: 3 },
      { option_text: "Kültür", sort_order: 4 },
    ],
  },
  {
    mode: "orderline",
    category: "values",
    question_text: "Mutlu bir ilişkinin temelleri — önem sırasına göre:",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Güven", sort_order: 1 },
      { option_text: "İletişim", sort_order: 2 },
      { option_text: "Fiziksel yakınlık", sort_order: 3 },
      { option_text: "Ortak ilgiler", sort_order: 4 },
    ],
  },
  {
    mode: "orderline",
    category: "values",
    question_text: "Bu değerleri hayatındaki önem sırasına göre diz:",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Aile", sort_order: 1 },
      { option_text: "Kariyer", sort_order: 2 },
      { option_text: "Arkadaşlar", sort_order: 3 },
      { option_text: "Kişisel gelişim", sort_order: 4 },
    ],
  },
  {
    mode: "orderline",
    category: "communication",
    question_text: "Birinin seni iyi tanıdığını hissettiren şeyler — sırala:",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Detayları hatırlamak", sort_order: 1 },
      { option_text: "Dinlemek", sort_order: 2 },
      { option_text: "Zaman ayırmak", sort_order: 3 },
      { option_text: "Sürpriz yapmak", sort_order: 4 },
    ],
  },
  {
    mode: "orderline",
    category: "values",
    question_text: "İlişkide zorlayan konular — kolaydan zora sırala:",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Farklı hobiler", sort_order: 1 },
      { option_text: "Farklı sosyal enerji", sort_order: 2 },
      { option_text: "Para yönetimi", sort_order: 3 },
      { option_text: "Gelecek planları", sort_order: 4 },
    ],
  },
  {
    mode: "orderline",
    category: "lifestyle",
    question_text: "Güzel bir akşam için tercih sıran:",
    locale: "tr",
    is_active: true,
    options: [
      { option_text: "Yemek", sort_order: 1 },
      { option_text: "Müzik", sort_order: 2 },
      { option_text: "Sohbet", sort_order: 3 },
      { option_text: "Film", sort_order: 4 },
    ],
  },
];
