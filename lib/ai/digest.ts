// AI yorum için "özet" üretimi: ham oda verisi → modele giden, kodda hesaplanmış sinyallerle zenginleştirilmiş özet.
//
// Neden kodda? Model "bu iki cevap aynı mı?", "kim kimi daha iyi okudu?" gibi sorularda yanılabilir (ve uydurabilir).
// Bunlar deterministik hesaplardır; kodda yapıp hazır veririz, model yalnızca anlamlandırır ve yazar.
// Çıktı ayrıca: kimlik/UUID içermez (veri minimizasyonu), cevaplar okunabilir metindir.

import { calculateReadingScore, compareAnswers } from "../scoring.ts";
import type { PredictionResult } from "../scoring.ts";
import type { ZodiacSign } from "./zodiac.ts";
import { isSensitiveTag, themeOf } from "./themes.ts";

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
  /** Sorunun türü: secret_choice (evet/kararsız/hayır), prediction (seçenek seçme), orderline (seçenekleri SIRALAMA) */
  mode: Mode;
  /** Sorunun teması (insight_tag'den; örüntü yakalamak için) */
  theme: string;
  /** Hassas konu (çatışma, para gerilimi, kıskançlık, güven, yakınlık…): yorumda takılma/şaka yok, yumuşak dil */
  sensitive?: true;
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
  /** Temalar arası örüntüler (tek tek cevap değil "büyük resim"): ör. "para konusunda hep aynı cevapları verdiniz" */
  patterns: string[];
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

/**
 * Temalar arası örüntüler (kodda): aynı temadaki ≥2 soruda belirgin uyum/ayrışma ya da tekrarlayan ıska. Model tek tek olgulardan değil
 * "büyük resimden" yazabilsin diye. Sayılar modele kelimeyle aktarılabilir ("üçünde de"), yüzde olarak değil.
 */
function themePatterns(questions: DigestQuestion[]): string[] {
  const byTheme = new Map<string, DigestQuestion[]>();
  for (const x of questions) {
    const t = themeOf(x.tag);
    byTheme.set(t, [...(byTheme.get(t) ?? []), x]);
  }
  const out: string[] = [];
  for (const [label, qs] of byTheme) {
    const n = qs.length;
    if (n < 2) continue;
    const note = qs.every((q) => isSensitiveTag(q.tag)) ? " (sensitive topic: stay gentle)" : "";
    const alike = qs.filter((q) => q.relation !== "different").length;
    const diff = n - alike;
    const allSensitive = qs.every((q) => isSensitiveTag(q.tag));
    if (alike === n && !allSensitive) out.push(`On ${label} you answered alike or almost alike every single time (${n} of ${n} questions).`);
    else if (diff >= 2 && diff * 2 >= n) out.push(`On ${label} your answers differed in ${diff} of ${n} questions.${note}`);
    for (const i of [0, 1] as const) {
      const g = qs[0].guesses[i];
      const misses = qs.filter((q) => q.guesses[i].result === "miss").length;
      if (misses >= 2 && misses * 2 >= n) out.push(`${g.by} misread ${g.about} on ${misses} of ${n} ${label} questions.${note}`);
    }
    if (!allSensitive && qs.every((q) => q.guesses[0].result !== "miss" && q.guesses[1].result !== "miss")) {
      out.push(`You both read each other right on every ${label} question (${n} of ${n}).${note}`);
    }
  }
  return out.slice(0, 4);
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

  const SURE: Record<Confidence, string> = { sure: "very sure", think: "fairly sure", guess: "just guessing" };

  // Mod farkındalıklı ifade. Sıralama sorusunda oyuncular soruya CEVAP VERMEZ, seçenekleri SIRALAR (1 = en önemli);
  // olgu cümlesi bunu açıkça söylemezse model sıralamayı "soruya verilen cevap" gibi yorumluyordu.
  const list = (v: Readable) => (Array.isArray(v) ? v.map((t, i) => `${i + 1}) ${t}`).join(", ") : v);
  const top = (v: Readable) => (Array.isArray(v) ? v[0] : v);
  // Evet/kararsız/hayır cevapları tırnaksız ve İngilizce kelimeyle verilir ("unsure" tırnak içinde verilince model onu çevirmeden kopyalıyordu).
  // Tırnak içindeki metinler oyuncuların kendi sözcükleri (oda dilinde); tırnaksız her şey modelin çevireceği İngilizce girdidir.
  const sc = (v: Readable) => ({ yes: "Yes", no: "No", unsure: "Not sure" })[String(v) as "yes" | "no" | "unsure"] ?? String(v);
  const said = (m: Mode, v: Readable) =>
    m === "orderline" ? `ranked the options like this (1 = most important): ${list(v)}` : m === "prediction" ? `picked "${v}"` : `answered ${sc(v)}`;
  const wouldSay = (m: Mode, v: Readable) =>
    m === "orderline" ? `would rank the options like this (1 = most important): ${list(v)}` : m === "prediction" ? `would pick "${v}"` : `would answer ${sc(v)}`;
  const topNote = (m: Mode, a: Readable, b: Readable) =>
    m !== "orderline"
      ? ""
      : top(a) === top(b)
        ? ` They agree on the first choice ("${top(a)}").`
        : ` Their first choices differ: ${nameA} put "${top(a)}" first, ${nameB} put "${top(b)}" first.`;

  const themeFields = (tag: string) => ({ theme: themeOf(tag), ...(isSensitiveTag(tag) ? { sensitive: true as const } : {}) });
  const byN = new Map(questions.map((x) => [x.n, x]));
  const facts: Fact[] = [];
  // Hassas konular (çatışma, para gerilimi, kıskançlık, güven, yakınlık…) için kutlama/şaka/ödüle yol açabilecek olgular
  // (aynı/benzer cevap, ikisi de doğru bildi) HİÇ gönderilmez; yalnızca "farklı cevap" ve "ıska" gider ve prompt bunları yalnızca
  // nazik bir merak notu olarak kullandırır. Prompt kuralı tek başına yetmediği için bu kodda zorlanır.
  const plain = questions.filter((x) => !isSensitiveTag(x.tag));
  const shared = nums(plain.filter((x) => x.relation === "same"), 4);
  const different = nums(questions.filter((x) => x.relation === "different"), 3);
  const similar = nums(plain.filter((x) => x.relation === "close"), 3);
  const bothCorrect = nums(
    plain.filter((x) => x.guesses[0].result === "correct" && x.guesses[1].result === "correct"),
    2,
  );
  for (const n of shared) {
    const x = byN.get(n)!;
    const a = x.answers[nameA];
    facts.push({
      kind: "answered_alike",
      mode: x.mode,
      ...themeFields(x.tag),
      question: x.question,
      sentence:
        x.mode === "orderline"
          ? `${nameA} and ${nameB} ranked the options in exactly the same order (1 = most important): ${list(a)}.`
          : x.mode === "prediction"
            ? `${nameA} and ${nameB} both picked "${a}".`
            : `${nameA} and ${nameB} both answered ${sc(a)}.`,
    });
  }
  for (const n of similar) {
    const x = byN.get(n)!;
    const [a, b] = [x.answers[nameA], x.answers[nameB]];
    facts.push({
      kind: "answered_similarly",
      mode: x.mode,
      ...themeFields(x.tag),
      question: x.question,
      sentence:
        x.mode === "orderline"
          ? `${nameA} ${said(x.mode, a)}. ${nameB} ${said(x.mode, b)}. Nearly the same ranking: only two neighbouring options are swapped.${topNote(x.mode, a, b)}`
          : `${nameA} ${said(x.mode, a)} and ${nameB} ${said(x.mode, b)} (close, not identical).`,
    });
  }
  for (const n of different) {
    const x = byN.get(n)!;
    const [a, b] = [x.answers[nameA], x.answers[nameB]];
    facts.push({
      kind: "answered_differently",
      mode: x.mode,
      ...themeFields(x.tag),
      question: x.question,
      sentence: `${nameA} ${said(x.mode, a)}${x.mode === "orderline" ? "." : " while"} ${nameB} ${said(x.mode, b)}.${topNote(x.mode, a, b)}`.replace(".  ", ". "),
    });
  }
  for (const m of confidentMisses.slice(0, 3)) {
    const x = byN.get(m.n)!;
    const g = x.guesses.find((y) => y.by === m.by)!;
    const actual = x.answers[g.about];
    // Sıralamada uzun listeler modeli karıştırıyordu: yalnızca ilk tercih karşılaştırılır (kısa ve net).
    const sentence =
      x.mode === "orderline"
        ? `${g.by} was ${SURE[g.confidence]} that ${g.about} would put "${top(g.guess)}" first when ranking the options, but ${g.about} actually put "${top(actual)}" first. (This is about ${g.by} misreading ${g.about}'s priorities.)`
        : `${g.by} was ${SURE[g.confidence]} that ${g.about} ${wouldSay(x.mode, g.guess)}, but ${g.about} actually ${said(x.mode, actual)}. (This is about ${g.by} misreading ${g.about}.)`;
    facts.push({ kind: "sure_but_missed", mode: x.mode, ...themeFields(x.tag), question: x.question, sentence });
  }
  for (const n of bothCorrect) {
    const x = byN.get(n)!;
    facts.push({
      kind: "both_read_each_other_correctly",
      mode: x.mode,
      ...themeFields(x.tag),
      question: x.question,
      sentence: `${nameA} and ${nameB} each predicted the other's ${x.mode === "orderline" ? "ranking" : "answer"} correctly (${nameA} ${said(x.mode, x.answers[nameA])}; ${nameB} ${said(x.mode, x.answers[nameB])}).`,
    });
  }

  const patterns = themePatterns(questions);

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
    patterns,
    questions,
  };
}
