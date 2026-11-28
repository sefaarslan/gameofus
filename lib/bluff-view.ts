// Blöf modu sonuç görünümü: veritabanı satırlarından istemciye gidecek yapıyı kurar (saf; birim testi `scripts/test-bluff.mjs`).
//
// GÜVENLİK KURALI: bir oyuncu kendi blöf avını bitirmeden karşı tarafın GERÇEK cevabından türeyen HİÇBİR ŞEY alamaz (gerçek cevap,
// yalan bilgisi, tahmin sonuçları, skorlar). Bu yüzden "call" aşaması yalnızca izinli alanlardan sıfırdan kurulur; tam sonuçtan
// alan silerek üretilmez.

import { callStats, fooledCount, isBluffCall, shownChoice, titlesFor, type BluffCall, type CalledAnswer, type Choice } from "./bluff.ts";

export interface BluffDetail {
  questionId: string;
  roundOrder: number;
  answers: Array<{ participantId: string; answerValue: unknown; shownValue?: unknown }>;
}

export interface BluffPrediction {
  predictor_participant_id: string;
  question_id: string;
  predicted_value: unknown;
  bluff_call: string | null;
}

const answerOf = (d: BluffDetail, participantId: string) => d.answers.find((a) => a.participantId === participantId);

const predictionBy = (predictions: BluffPrediction[], participantId: string, questionId: string) =>
  predictions.find((p) => p.predictor_participant_id === participantId && p.question_id === questionId);

/** Oyuncu blöf avını bitirdi mi: tahmin ettiği her cevap için karar vermiş olmalı. */
export function callsDone(predictions: BluffPrediction[], participantId: string): boolean {
  const mine = predictions.filter((p) => p.predictor_participant_id === participantId);
  return mine.length > 0 && mine.every((p) => isBluffCall(p.bluff_call));
}

export interface CallItem {
  questionId: string;
  roundOrder: number;
  /** Karşı tarafın GÖSTERDİĞİ cevap (gerçek olabilir de yalan da) */
  shownAnswer: { value: Choice | null };
  /** Oyuncunun kendi tahmini (ipucu olarak yanında gösterilir) */
  myPrediction: unknown;
}

/** Blöf avı bekleyen oyuncunun göreceği maddeler: yalnızca gösterilen cevap ve kendi tahmini. */
export function callItems(details: BluffDetail[], predictions: BluffPrediction[], meId: string, partnerId: string): CallItem[] {
  return details
    .slice()
    .sort((a, b) => a.roundOrder - b.roundOrder)
    .flatMap((d) => {
      const theirs = answerOf(d, partnerId);
      const mine = predictionBy(predictions, meId, d.questionId);
      if (!theirs || !mine) return [];
      return [
        {
          questionId: d.questionId,
          roundOrder: d.roundOrder,
          shownAnswer: { value: shownChoice(theirs.answerValue, theirs.shownValue) },
          myPrediction: mine.predicted_value,
        },
      ];
    });
}

/** `caller`ın `target`ın cevaplarına verdiği kararlar (yalan bilgisiyle). Karar verilmemiş maddeler atlanır. */
function calledAnswers(details: BluffDetail[], predictions: BluffPrediction[], callerId: string, targetId: string): CalledAnswer[] {
  return details.flatMap((d) => {
    const target = answerOf(d, targetId);
    const call = predictionBy(predictions, callerId, d.questionId)?.bluff_call;
    return target && isBluffCall(call) ? [{ isLie: target.shownValue != null, call }] : [];
  });
}

/** Açılış (oyuncu blöf avını bitirdikten sonra): soru başına döküm ve iki oyuncunun puan/unvanları. */
export function revealView(details: BluffDetail[], predictions: BluffPrediction[], meId: string, partnerId: string) {
  const partnerDone = callsDone(predictions, partnerId);
  const myCalls = calledAnswers(details, predictions, meId, partnerId);
  const partnerCalls = partnerDone ? calledAnswers(details, predictions, partnerId, meId) : null;
  const liesOf = (id: string) => details.filter((d) => answerOf(d, id)?.shownValue != null).length;
  const call = (by: string, questionId: string): BluffCall | null => {
    const c = predictionBy(predictions, by, questionId)?.bluff_call;
    return isBluffCall(c) ? c : null;
  };

  const questions = new Map(
    details.map((d) => {
      const mine = answerOf(d, meId);
      const theirs = answerOf(d, partnerId);
      return [
        d.questionId,
        {
          myShownAnswer: mine ? { value: shownChoice(mine.answerValue, mine.shownValue) } : null,
          myLie: mine?.shownValue != null,
          partnerCall: partnerDone ? call(partnerId, d.questionId) : null,
          partnerShownAnswer: theirs ? { value: shownChoice(theirs.answerValue, theirs.shownValue) } : null,
          partnerLie: theirs?.shownValue != null,
          myCall: call(meId, d.questionId),
        },
      ] as const;
    }),
  );

  const mine = callStats(myCalls);
  const theirs = partnerCalls ? callStats(partnerCalls) : null;

  return {
    questions,
    summary: {
      phase: "reveal" as const,
      me: {
        callsDone: true,
        /** Av puanı: karşı tarafın `total` yalanından `caught` tanesi yakalandı; `falseAlarms` boşa giden "Blöf!" */
        caught: mine.liesCaught,
        total: mine.liesTotal,
        falseAlarms: mine.doubtedTruths,
        lies: liesOf(meId),
        /** Karşı tarafın yakalayamadığı yalan sayın; o blöf avını yapmadıysa null */
        fooled: partnerCalls ? fooledCount(partnerCalls) : null,
        titles: titlesFor(myCalls, partnerCalls),
      },
      partner: {
        callsDone: partnerDone,
        caught: theirs ? theirs.liesCaught : null,
        total: theirs ? theirs.liesTotal : null,
        falseAlarms: theirs ? theirs.doubtedTruths : null,
        lies: liesOf(partnerId),
        fooled: fooledCount(myCalls),
        titles: titlesFor(partnerCalls, myCalls),
      },
    },
  };
}
