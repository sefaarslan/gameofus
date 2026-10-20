// AI yorum için "özet" üretimi: ham oda verisi → modele giden, kodda hesaplanmış sinyallerle zenginleştirilmiş özet.
//
// Neden kodda? Model "bu iki cevap aynı mı?", "kim kimi daha iyi okudu?" gibi sorularda yanılabilir (ve uydurabilir).
// Bunlar deterministik hesaplardır; kodda yapıp hazır veririz, model yalnızca anlamlandırır ve yazar.
// Çıktı ayrıca: kimlik/UUID içermez (veri minimizasyonu), cevaplar okunabilir metindir.

import { calculateReadingScore, compareAnswers } from "../scoring.ts";
import type { PredictionResult } from "../scoring.ts";
import type { ZodiacSign } from "./zodiac.ts";

export type Locale = "tr" | "en" | "es";
export type RelationshipType = "friend" | "dating" | "partner";
export type Mode = "secret_choice" | "prediction" | "orderline";
export type Confidence = "guess" | "think" | "sure";
export type Player = "A" | "B";

/** DB'deki answer_value / predicted_value JSONB biçimleri */
export type RawValue = { value: "yes" | "unsure" | "no" } | { option_id: string } | { order: string[] };

export interface RawQuestion {
  mode: Mode;
  /** Kullanıcıya görünmeyen tema etiketi (insight_tag) */
  tag: string;
  text: string;
  /** prediction/orderline için seçenekler (kimlik + metin) */
  options: Array<{ id: string; text: string }> | null;
  answerA: RawValue;
  answerB: RawValue;
  guessAboutB: { value: RawValue; confidence: Confidence }; // A'nın B hakkındaki tahmini
  guessAboutA: { value: RawValue; confidence: Confidence }; // B'nin A hakkındaki tahmini
}

/** İsteğe bağlı oyuncu bilgisi. Doğum tarihi ASLA gönderilmez; yalnızca yaş aralığı. */
export interface RawProfile {
  gender?: "female" | "male" | null;
  ageBand?: string | null;
  /** Batı burcu (kodda doğum tarihinden hesaplanır). Modele yalnızca SESSİZ arka plan olarak gider; yorumda anılması yasaktır. */
  sign?: ZodiacSign | null;
}

export interface RawRoom {
  locale: Locale;
  relationshipType: RelationshipType;
  nameA: string;
  nameB: string;
  profileA?: RawProfile;
  profileB?: RawProfile;
  questions: RawQuestion[];
}

/** Doğum tarihinden (YYYY-AA-GG) kaba yaş aralığı; ham tarih modele gitmez. */
export function ageBandFor(birthDate: string | null | undefined, now = new Date()): string | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const m = now.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < b.getUTCDate())) age--;
  if (age < 13) return null;
  if (age < 18) return "13-17";
  if (age < 25) return "18-24";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  if (age < 55) return "45-54";
  return "55+";
}

export type Readable = string | string[];
/** İki oyuncunun KENDİ cevapları birbirine ne kadar benziyor? */
export type Relation = "same" | "close" | "different";

/**
 * Modele giden yapıda "A/B" harfleri YOK: her şey oyuncu adıyla etiketlenir. Harfli etiketlerde model kimin kimi
 * tahmin ettiğini karıştırabiliyordu ("by"/"about" alanları bu karışıklığı ortadan kaldırır).
 */
export interface DigestGuess {
  by: string;
  about: string;
  guess: Readable;
  confidence: Confidence;
  result: PredictionResult;
}

export interface DigestQuestion {
  n: number;
  mode: Mode;
  tag: string;
  question: string;
  /** Oyuncu adı → o oyuncunun kendi cevabı */
  answers: Record<string, Readable>;
  relation: Relation;
  guesses: [DigestGuess, DigestGuess];
}

/**
 * Olgu kartı: tek başına anlaşılır, çapraz birleştirme gerektirmeyen bir an. Model ham soru listesinden "kim kimi
 * tahmin etti"yi kendisi çıkarmaya çalışınca hata yapıyordu; bu yüzden kodda çözülmüş olguları verir, modele yalnızca yazdırırız.
 */
export type FactKind =
  | "answered_alike"
  | "answered_similarly"
  | "answered_differently"
  | "sure_but_missed"
  | "both_read_each_other_correctly";

export interface Fact {
  kind: FactKind;
  question: string;
  /**
   * Olgunun açık, kendi içinde tam İngilizce cümlesi (kim kimi/neyi nasıl yaptı). Model, "by/about" gibi alanları
   * kendi birleştirmek yerine bu cümleyi kullanır: kişi atıflarındaki hatalar ancak böyle azaldı.
   */
  sentence: string;
}

export interface CommentaryDigest {
  locale: Locale;
  relationshipType: RelationshipType;
  /** Görünen adlar (kullanıcı metni — model için veri, talimat değil). Aynı ad iki kez girilmişse ayrıştırılır. */
  players: [string, string];
  /**
   * İsteğe bağlı: oyuncu adı → { gender (yalnızca İspanyolca odalarda, dil bilgisi uyumu için), ageBand (yalnızca ton için) }.
   * Veri minimizasyonu: Türkçede dilbilgisel cinsiyet olmadığı için cinsiyet yalnızca `es` odalarında gönderilir.
   */
  profiles?: Record<string, { gender?: "female" | "male"; ageBand?: string; sign?: ZodiacSign }>;
  summary: {
    questionCount: number;
    /** Oyuncu adı → karşısındakini okuma skoru (0-100; yakın = doğru sayılır) */
    readingScore: Record<string, number>;
    /** Daha iyi okuyan oyuncunun adı; fark ≤ 10 puansa "even" */
    betterReader: string;
    sameCount: number;
    closeCount: number;
    differentCount: number;
  };
  /** Yorumda öne çıkarılacak anlar: soru numaraları (n) */
  highlights: {
    shared: number[];
    different: number[];
    confidentMisses: Array<{ by: string; n: number; confidence: Confidence }>;
    bothReadCorrectly: number[];
  };
  /** Yorumun dayanacağı olgu kartları (modele giden asıl içerik) */
  facts: Fact[];
  /** Tam soru listesi: test/inceleme içindir, modele GÖNDERİLMEZ */
  questions: DigestQuestion[];
}

const MODE_PRIORITY: Record<Mode, number> = { orderline: 0, prediction: 1, secret_choice: 2 }; // daha bilgilendirici olanlar önce
const CONFIDENCE_RANK: Record<Confidence, number> = { sure: 0, think: 1, guess: 2 };

function readable(q: RawQuestion, v: RawValue): Readable {
  if (q.mode === "secret_choice") return (v as { value: string }).value;
  const text = (id: string) => q.options?.find((o) => o.id === id)?.text ?? id;
  if (q.mode === "prediction") return text((v as { option_id: string }).option_id);
  return (v as { order: string[] }).order.map(text);
}

function relationOf(mode: Mode, a: RawValue, b: RawValue): Relation {
  const r = compareAnswers(mode, a, b); // aynı karşılaştırma kuralı: aynı / yakın / farklı
  return r === "correct" ? "same" : r === "near" ? "close" : "different";
}

/** İki oyuncu aynı adı girdiyse ("Ali" / "Ali") modelin ayırt edebilmesi için ikinciye sayı ekler. */
function distinctNames(a: string, b: string): [string, string] {
  // Ad kullanıcı metnidir: satır sonlarını/fazla boşluğu temizle ve uzunluğu sınırla (uygulamada ad zaten ≤30 karakter);
  // uzun/çok satırlı bir ad prompt enjeksiyonu için kullanılamasın.
  const clean = (n: string, fallback: string) => n.replace(/\s+/g, " ").trim().slice(0, 30) || fallback;
  const A = clean(a, "A");
  const B = clean(b, "B");
  return A.toLowerCase() === B.toLowerCase() ? [`${A} (1)`, `${B} (2)`] : [A, B];
}

function profilesFor(room: RawRoom, nameA: string, nameB: string): CommentaryDigest["profiles"] | undefined {
  const one = (p?: RawProfile) => {
    const out: { gender?: "female" | "male"; ageBand?: string; sign?: ZodiacSign } = {};
    if (room.locale === "es" && (p?.gender === "female" || p?.gender === "male")) out.gender = p.gender;
    if (p?.ageBand) out.ageBand = p.ageBand;
    if (p?.sign) out.sign = p.sign;
    return Object.keys(out).length ? out : undefined;
  };
  const a = one(room.profileA);
  const b = one(room.profileB);
  if (!a && !b) return undefined;
  return { ...(a ? { [nameA]: a } : {}), ...(b ? { [nameB]: b } : {}) };
}

export function buildDigest(room: RawRoom): CommentaryDigest {
  const [nameA, nameB] = distinctNames(room.nameA, room.nameB);
  const questions: DigestQuestion[] = room.questions.map((q, i) => ({
    n: i + 1,
    mode: q.mode,
    tag: q.tag,
    question: q.text,
    answers: { [nameA]: readable(q, q.answerA), [nameB]: readable(q, q.answerB) },
    relation: relationOf(q.mode, q.answerA, q.answerB),
    guesses: [
      {
        by: nameA,
        about: nameB,
        guess: readable(q, q.guessAboutB.value),
        confidence: q.guessAboutB.confidence,
        result: compareAnswers(q.mode, q.answerB, q.guessAboutB.value),
      },
      {
        by: nameB,
        about: nameA,
        guess: readable(q, q.guessAboutA.value),
        confidence: q.guessAboutA.confidence,
        result: compareAnswers(q.mode, q.answerA, q.guessAboutA.value),
      },
    ],
  }));

  const scoreA = calculateReadingScore(questions.map((x) => x.guesses[0].result));
  const scoreB = calculateReadingScore(questions.map((x) => x.guesses[1].result));
  const betterReader = Math.abs(scoreA - scoreB) <= 10 ? "even" : scoreA > scoreB ? nameA : nameB;

  const byInfo = (a: DigestQuestion, b: DigestQuestion) => MODE_PRIORITY[a.mode] - MODE_PRIORITY[b.mode] || a.n - b.n;
  const nums = (list: DigestQuestion[], max: number) => list.slice().sort(byInfo).slice(0, max).map((x) => x.n);

  const confidentMisses: CommentaryDigest["highlights"]["confidentMisses"] = [];
  for (const x of questions) {
    for (const g of x.guesses) {
      if (g.result === "miss" && g.confidence !== "guess") confidentMisses.push({ by: g.by, n: x.n, confidence: g.confidence });
    }
  }
  confidentMisses.sort((a, b) => CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence] || a.n - b.n);

  const byN = new Map(questions.map((x) => [x.n, x]));
  const show = (v: Readable) => (Array.isArray(v) ? v.join(" > ") : v);
  const SURE: Record<Confidence, string> = { sure: "very sure", think: "fairly sure", guess: "just guessing" };
  const facts: Fact[] = [];
  const shared = nums(questions.filter((x) => x.relation === "same"), 3);
  const different = nums(questions.filter((x) => x.relation === "different"), 3);
  const similar = nums(questions.filter((x) => x.relation === "close"), 2);
  const bothCorrect = nums(
    questions.filter((x) => x.guesses[0].result === "correct" && x.guesses[1].result === "correct"),
    2,
  );
  for (const n of shared) {
    const x = byN.get(n)!;
    facts.push({ kind: "answered_alike", question: x.question, sentence: `${nameA} and ${nameB} both answered: "${show(x.answers[nameA])}".` });
  }
  for (const n of similar) {
    const x = byN.get(n)!;
    facts.push({
      kind: "answered_similarly",
      question: x.question,
      sentence: `${nameA} answered "${show(x.answers[nameA])}" and ${nameB} answered "${show(x.answers[nameB])}" (close, not identical).`,
    });
  }
  for (const n of different) {
    const x = byN.get(n)!;
    facts.push({
      kind: "answered_differently",
      question: x.question,
      sentence: `${nameA} answered "${show(x.answers[nameA])}" while ${nameB} answered "${show(x.answers[nameB])}".`,
    });
  }
  for (const m of confidentMisses.slice(0, 3)) {
    const x = byN.get(m.n)!;
    const g = x.guesses.find((y) => y.by === m.by)!;
    facts.push({
      kind: "sure_but_missed",
      question: x.question,
      sentence: `${g.by} was ${SURE[g.confidence]} that ${g.about} would answer "${show(g.guess)}", but ${g.about} actually answered "${show(x.answers[g.about])}". (This is about ${g.by} misreading ${g.about}.)`,
    });
  }
  for (const n of bothCorrect) {
    const x = byN.get(n)!;
    facts.push({
      kind: "both_read_each_other_correctly",
      question: x.question,
      sentence: `${nameA} and ${nameB} each guessed the other's answer correctly (${nameA}: "${show(x.answers[nameA])}", ${nameB}: "${show(x.answers[nameB])}").`,
    });
  }

  return {
    locale: room.locale,
    relationshipType: room.relationshipType,
    players: [nameA, nameB],
    ...(profilesFor(room, nameA, nameB) ? { profiles: profilesFor(room, nameA, nameB) } : {}),
    summary: {
      questionCount: questions.length,
      readingScore: { [nameA]: scoreA, [nameB]: scoreB },
      betterReader,
      sameCount: questions.filter((x) => x.relation === "same").length,
      closeCount: questions.filter((x) => x.relation === "close").length,
      differentCount: questions.filter((x) => x.relation === "different").length,
    },
    highlights: {
      shared: nums(questions.filter((x) => x.relation === "same"), 3),
      different: nums(questions.filter((x) => x.relation === "different"), 3),
      confidentMisses: confidentMisses.slice(0, 3),
      bothReadCorrectly: nums(
        questions.filter((x) => x.guesses[0].result === "correct" && x.guesses[1].result === "correct"),
        2,
      ),
    },
    facts,
    questions,
  };
}
