// UYDURMA oda üretici (yalnızca geliştirme/değerlendirme için): gerçek kullanıcı verisi içermez.
// Soru metinleri seeds/v2'den gelir; iki sahte oyuncunun cevapları ve tahminleri tohumlu rastgeleyle üretilir
// (aynı tohum = aynı oda, böylece modelleri aynı girdiyle karşılaştırabiliriz). Çıktı: lib/ai/digest.ts RawRoom biçimi.
import { readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";

const DIR = resolve("seeds/v2");
const NAMES = { tr: ["Deniz", "Elif"], en: ["Alex", "Sam"], es: ["Carmen", "Diego"] };
const MODE_COUNTS = { secret_choice: 4, prediction: 3, orderline: 3 }; // "Karma" 10 soru: 4 / 3 / 3

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

export async function buildFakeRoom({ lang = "tr", relationshipType = "friend", seed = 1, signs = true } = {}) {
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
  const questions = shuffle(chosen);

  const SC = ["yes", "unsure", "no"];
  const CONF = ["guess", "guess", "think", "think", "sure"]; // "eminim" biraz daha nadir
  const [nameA, nameB] = NAMES[lang];

  const rawQuestions = questions.map((q) => {
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
