// UYDURMA oda üretici (yalnızca geliştirme/değerlendirme için): gerçek kullanıcı verisi içermez.
// Soru metinleri seeds/v2'den gelir; iki sahte oyuncunun cevapları ve tahminleri tohumlu rastgeleyle üretilir
// (aynı tohum = aynı oda, böylece modelleri aynı girdiyle karşılaştırabiliriz). Çıktı: lib/ai/digest.ts RawRoom biçimi.
import { readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";

const DIR = resolve("seeds/v2");
const NAMES = { tr: ["Deniz", "Elif"], en: ["Alex", "Sam"], es: ["Carmen", "Diego"] };
const MODE_COUNTS = { secret_choice: 4, prediction: 3, orderline: 3 }; // "Karma" 10 soru: 4 / 3 / 3
const MODE_ORDER = ["secret_choice", "prediction", "orderline"];

// mulberry32: küçük, tohumlu rastgele sayı üreteci
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function loadCategories() {
  const files = readdirSync(DIR).filter((f) => f.endsWith(".ts") && f !== "types.ts" && f !== "helpers.ts");
  const cats = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(join(DIR, f)).href);
    for (const v of Object.values(mod)) if (v && v.slug && v.questions) cats.push(v);
  }
  return cats;
}

const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

// Senaryolar: gerçek bir sorunlu odayı (skor 45) ve yüksek skorlu bir odayı (85) kontrollü yeniden üretir.
//  rel: iki oyuncunun KENDİ cevapları (same | opposite | close) · a / b: A'nın B'yi, B'nin A'yı tahmin sonucu (correct | near | miss)
//  Sıra: 4 evet/hayır, 3 seçenek, 3 sıralama sorusu.
const PLANS = {
  // 20 tahmin: 7 doğru, 2 yakın, 11 yanlış → Okuma Skoru 45; 3 zıt cevap (0, 4, 7), 2+ "aynı cevap yanlış tahmin" (1, 5, 6)
  low: [
    { rel: "opposite", a: "miss", b: "miss" },
    { rel: "same", a: "miss", b: "miss" },
    { rel: "same", a: "correct", b: "near" },
    { rel: "same", a: "correct", b: "correct" },
    { rel: "opposite", a: "miss", b: "miss" },
    { rel: "same", a: "miss", b: "miss" },
    { rel: "same", a: "correct", b: "miss" },
    { rel: "opposite", a: "miss", b: "miss" },
    { rel: "same", a: "correct", b: "near" },
    { rel: "same", a: "correct", b: "correct" },
  ],
  // 20 tahmin: 15 doğru, 2 yakın, 3 yanlış → Okuma Skoru 85
  high: [
    { rel: "same", a: "correct", b: "correct" },
    { rel: "same", a: "correct", b: "correct" },
    { rel: "same", a: "correct", b: "near" },
    { rel: "opposite", a: "near", b: "correct" },
    { rel: "same", a: "correct", b: "correct" },
    { rel: "same", a: "correct", b: "correct" },
    { rel: "opposite", a: "miss", b: "correct" },
    { rel: "same", a: "correct", b: "correct" },
    { rel: "close", a: "correct", b: "correct" },
    { rel: "opposite", a: "miss", b: "miss" },
  ],
};

export async function buildFakeRoom({ lang = "tr", relationshipType = "friend", seed = 1, signs = true, scenario = "random" } = {}) {
  const rand = rng(seed);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Havuz: ilişki türüne uygun, ücretsiz kategoriler (üretimdeki oda havuzuyla aynı kural)
  const pool = (await loadCategories())
    .filter((c) => !c.isPremium && c.relationshipTypes.includes(relationshipType))
    .flatMap((c) => c.questions);

  const chosen = [];
  for (const [mode, n] of Object.entries(MODE_COUNTS)) {
    chosen.push(...shuffle(pool.filter((q) => q.mode === mode)).slice(0, n));
  }
  // Senaryolarda sıra sabittir (plan indeksine göre): önce evet/hayır, sonra seçenek, sonra sıralama
  const questions = scenario === "random" ? shuffle(chosen) : [...chosen].sort((x, y) => MODE_ORDER.indexOf(x.mode) - MODE_ORDER.indexOf(y.mode));
  const plan = PLANS[scenario];

  const SC = ["yes", "unsure", "no"];
  const CONF = ["guess", "guess", "think", "think", "sure"]; // "eminim" biraz daha nadir
  const [nameA, nameB] = NAMES[lang];

  // Plana göre: cevap çifti (ilişki) ve her iki tahminin istenen sonucu (correct | near | miss) üretilir.
  const swapFirstTwo = (order) => [order[1], order[0], ...order.slice(2)];
  const planned = (q, loc, options, ids, step) => {
    const mode = q.mode;
    const flip = rand() < 0.5; // hangi oyuncunun "evet/ilk seçenek" olduğu çeşitlensin
    let a, b;
    if (mode === "secret_choice") {
      a = { value: flip ? "yes" : "no" };
      b = step.rel === "opposite" ? { value: flip ? "no" : "yes" } : { value: a.value };
    } else if (mode === "prediction") {
      a = { option_id: ids[0] };
      b = step.rel === "opposite" ? { option_id: ids[2] } : { option_id: ids[0] };
    } else {
      a = { order: [...ids] };
      b = step.rel === "opposite" ? { order: [...ids].reverse() } : step.rel === "close" ? { order: swapFirstTwo([...ids]) } : { order: [...ids] };
    }
    // Gerçek cevaba göre istenen sonuçta bir tahmin üretir
    const guessWith = (actual, result) => {
      if (result === "correct") return JSON.parse(JSON.stringify(actual));
      if (mode === "secret_choice") return { value: result === "near" ? "unsure" : actual.value === "yes" ? "no" : "yes" };
      if (mode === "prediction") return { option_id: actual.option_id === ids[1] ? ids[3] : ids[1] }; // her zaman farklı bir seçenek
      return { order: result === "near" ? swapFirstTwo(actual.order) : [...actual.order].reverse() };
    };
    return {
      mode,
      tag: q.tag,
      text: loc.text,
      options,
      answerA: a,
      answerB: b,
      guessAboutB: { value: guessWith(b, step.a), confidence: pick(CONF) },
      guessAboutA: { value: guessWith(a, step.b), confidence: pick(CONF) },
    };
  };

  const rawQuestions = questions.map((q, qi) => {
    const loc = q[lang];
    const options = loc.options ? loc.options.map((text, i) => ({ id: String(i), text })) : null;
    const ids = options ? options.map((o) => o.id) : [];

    // Gerçek cevaplar (DB'deki JSONB biçimiyle birebir)
    const randomAnswer = () =>
      q.mode === "secret_choice" ? { value: pick(SC) } : q.mode === "prediction" ? { option_id: pick(ids) } : { order: shuffle(ids) };
    const answerA = randomAnswer();
    // B, A'ya yaklaşık yarı yarıya benzer cevap verir (gerçekçi bir "ortak/farklı" karışımı)
    let answerB = randomAnswer();
    if (rand() < 0.5) {
      answerB = JSON.parse(JSON.stringify(answerA));
      if (q.mode === "orderline" && rand() < 0.4) {
        const o = answerB.order;
        const i = Math.floor(rand() * (o.length - 1));
        [o[i], o[i + 1]] = [o[i + 1], o[i]]; // yan yana takas → "yakın"
      }
    }
    if (plan) return planned(q, loc, options, ids, plan[qi]);

    // Tahminler: ~%60 gerçek cevaba eşit, aksi halde rastgele
    const guessFor = (real) => (rand() < 0.6 ? JSON.parse(JSON.stringify(real)) : randomAnswer());
    return {
      mode: q.mode,
      tag: q.tag,
      text: loc.text,
      options,
      answerA,
      answerB,
      guessAboutB: { value: guessFor(answerB), confidence: pick(CONF) },
      guessAboutA: { value: guessFor(answerA), confidence: pick(CONF) },
    };
  });

  // Uydurma burçlar (sonda üretilir ki cevap/tahmin üretimini etkilemesin; aynı tohum = aynı oda ve aynı burçlar)
  const signA = pick(SIGNS);
  const signB = pick(SIGNS);
  return {
    locale: lang,
    relationshipType,
    nameA,
    nameB,
    ...(signs ? { profileA: { sign: signA }, profileB: { sign: signB } } : {}),
    questions: rawQuestions,
  };
}
