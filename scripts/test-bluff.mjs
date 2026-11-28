// Blöf modu birim testleri (lib/bluff.ts, lib/bluff-view.ts; veritabanı yok):  node --no-warnings scripts/test-bluff.mjs
import { callStats, countLies, fooledCount, isBluffCall, lieCardsFor, lieFor, oppositeChoice, readChoice, shownChoice, titlesFor } from "../lib/bluff.ts";
import { callItems, callsDone, revealView } from "../lib/bluff-view.ts";

let fails = 0;
const ok = (c, m) => { console.log((c ? "✔ " : "✗ ") + m); if (!c) fails++; };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? "" : ` (gelen: ${JSON.stringify(a)})`}`);
const v = (value) => ({ value });

// ── Seçimler ve Yalan Kartı ─────────────────────────────────────────────────
ok(readChoice(v("yes")) === "yes" && readChoice(v("no")) === "no", "Evet / Hayır okunur");
ok(readChoice(v("unsure")) === null && readChoice({ value: 1 }) === null && readChoice(undefined) === null && readChoice("yes") === null, "Kararsız ve geçersiz biçim reddedilir");
ok(oppositeChoice("yes") === "no" && oppositeChoice("no") === "yes", "ters seçim");
eq([lieFor(v("yes")), lieFor(v("no")), lieFor(v("unsure"))], [v("no"), v("yes"), null], "yalan her zaman gerçeğin tersi");
eq([lieCardsFor(5), lieCardsFor(10)], [2, 3], "Yalan Kartı: 5 soruda 2, 10 soruda 3");
ok(lieCardsFor(1) === 1, "listede olmayan soru sayısında en az 1 kart");
ok(shownChoice(v("yes"), null) === "yes" && shownChoice(v("yes"), v("no")) === "no", "gösterilen: yalan varsa o, yoksa gerçek");
ok(countLies([{ shownValue: null }, { shownValue: v("no") }, { shownValue: undefined }]) === 1, "yalan sayımı");
ok(isBluffCall("believe") && isBluffCall("bluff") && !isBluffCall("Blöf") && !isBluffCall(null), "karar değerleri");

// ── Puan: yakalanan yalan ───────────────────────────────────────────────────
const c = (isLie, call) => ({ isLie, call });
const sample = [c(true, "bluff"), c(true, "believe"), c(false, "believe"), c(false, "bluff"), c(false, "believe")];
eq(callStats(sample), { liesCaught: 1, liesTotal: 2, doubtedTruths: 1 }, "blöf avı istatistiği");
ok(callStats([c(true, "believe"), c(false, "believe"), c(false, "believe")]).liesCaught === 0, "her şeye inanan 0 yalan yakalar (puan alamaz)");
ok(fooledCount(sample) === 1, "kandırma = yakalanamayan yalan sayısı");
ok(fooledCount([c(false, "believe")]) === 0, "inanılan doğru kandırma sayılmaz");

// ── Unvanlar ────────────────────────────────────────────────────────────────
eq(titlesFor([c(true, "bluff"), c(false, "believe")], null), ["lie_detector"], "Yalan Dedektörü: tüm yalanlar yakalandı");
eq(titlesFor([c(true, "bluff"), c(true, "believe")], null), [], "bir yalan kaçarsa Dedektör yok");
eq(titlesFor([c(false, "believe"), c(false, "believe")], null), [], "karşıda yalan yoksa Dedektör de Saf Kalp de yok");
eq(titlesFor([c(true, "believe"), c(false, "bluff"), c(false, "believe")], null), ["pure_heart"], "Saf Kalp: hiçbir yalan yakalanamadı");
eq(titlesFor([c(false, "bluff"), c(false, "bluff"), c(true, "believe")], null), ["too_skeptical"], "iki doğruya 'blöf': Fazla Şüpheci (Saf Kalp ile birlikte verilmez)");
eq(titlesFor([c(true, "bluff"), c(false, "bluff"), c(false, "bluff")], null), ["lie_detector", "too_skeptical"], "birden fazla unvan");
eq(titlesFor(null, [c(true, "believe"), c(false, "bluff")]), ["poker_face"], "Poker Face: hiçbir yalan yakalanmadı");
eq(titlesFor(null, [c(true, "bluff"), c(true, "believe")]), [], "bir yalan yakalanırsa Poker Face yok");
eq(titlesFor(null, [c(false, "believe")]), [], "yalan söylemeyene Poker Face yok");
eq(titlesFor([c(true, "believe")], null), ["pure_heart"], "karşı taraf karar vermediyse Poker Face belirlenmez");

// ── Görünümler ──────────────────────────────────────────────────────────────
const ME = "me", HER = "partner";
const details = [
  { questionId: "q2", roundOrder: 2, answers: [{ participantId: ME, answerValue: v("no"), shownValue: null }, { participantId: HER, answerValue: v("yes"), shownValue: null }] },
  { questionId: "q1", roundOrder: 1, answers: [{ participantId: ME, answerValue: v("yes"), shownValue: v("no") }, { participantId: HER, answerValue: v("no"), shownValue: v("yes") }] },
];
const preds = (myCalls, theirCalls) => [
  ...["q1", "q2"].map((q, i) => ({ predictor_participant_id: ME, question_id: q, predicted_value: v(i ? "yes" : "no"), bluff_call: myCalls[i] })),
  ...["q1", "q2"].map((q, i) => ({ predictor_participant_id: HER, question_id: q, predicted_value: v("yes"), bluff_call: theirCalls[i] })),
];

const none = preds([null, null], [null, null]);
ok(!callsDone(none, ME) && !callsDone([], ME) && !callsDone(preds(["bluff", null], [null, null]), ME), "karar eksikse blöf avı bitmemiş");
ok(callsDone(preds(["bluff", "believe"], [null, null]), ME), "tüm kararlar verilince bitmiş");

const items = callItems(details, preds([null, null], ["believe", "bluff"]), ME, HER);
eq(items, [
  { questionId: "q1", roundOrder: 1, shownAnswer: v("yes"), myPrediction: v("no") },
  { questionId: "q2", roundOrder: 2, shownAnswer: v("yes"), myPrediction: v("yes") },
], "av maddeleri: sıralı, yalnızca gösterilen cevap + kendi tahmini");

// Sızıntı: gösterilenler aynı, gerçekler farklı → av görünümü birebir aynı
const flipped = structuredClone(details);
flipped[0].answers[1] = { participantId: HER, answerValue: v("no"), shownValue: v("yes") }; // artık yalan
flipped[1].answers[1] = { participantId: HER, answerValue: v("yes"), shownValue: null }; // artık doğru
eq(callItems(flipped, none, ME, HER), callItems(details, none, ME, HER), "av görünümü gerçek cevaptan bağımsız (sızıntı yok)");

const half = revealView(details, preds(["bluff", "bluff"], [null, null]), ME, HER);
eq(half.summary.me, { callsDone: true, caught: 1, total: 1, falseAlarms: 1, lies: 1, fooled: null, titles: ["lie_detector"] }, "açılış (karşı taraf karar vermedi): kandırma bekliyor");
eq(half.summary.partner, { callsDone: false, caught: null, total: null, falseAlarms: null, lies: 1, fooled: 0, titles: [] }, "karşı tarafın av puanı bekliyor");
ok(half.questions.get("q1").partnerCall === null && half.questions.get("q1").partnerLie && half.questions.get("q1").myCall === "bluff", "soru dökümü");

const full = revealView(details, preds(["believe", "believe"], ["believe", "bluff"]), ME, HER);
eq(full.summary.me, { callsDone: true, caught: 0, total: 1, falseAlarms: 0, lies: 1, fooled: 1, titles: ["poker_face", "pure_heart"] }, "açılış: iki taraf da karar verdi (ben)");
eq(full.summary.partner, { callsDone: true, caught: 0, total: 1, falseAlarms: 1, lies: 1, fooled: 1, titles: ["poker_face", "pure_heart"] }, "açılış: iki taraf da karar verdi (karşı)");

console.log(fails ? `\n${fails} test başarısız` : "\nTüm testler geçti");
process.exit(fails ? 1 : 0);
