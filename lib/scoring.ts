export type PredictionResult = "correct" | "near" | "miss";

// ---------------------------------------------------------------------------
// Secret Choice
// ---------------------------------------------------------------------------

type ScChoice = "yes" | "unsure" | "no";

function compareSecretChoice(answer: ScChoice, prediction: ScChoice): PredictionResult {
  if (answer === prediction) return "correct";
  if (
    (answer === "yes" && prediction === "unsure") ||
    (answer === "unsure" && prediction === "yes") ||
    (answer === "no" && prediction === "unsure") ||
    (answer === "unsure" && prediction === "no")
  ) {
    return "near";
  }
  return "miss";
}

// ---------------------------------------------------------------------------
// Prediction (çoktan seçmeli — binary, yakın yok)
// ---------------------------------------------------------------------------

function comparePrediction(
  answerOptionId: string,
  predictedOptionId: string,
): PredictionResult {
  return answerOptionId === predictedOptionId ? "correct" : "miss";
}

// ---------------------------------------------------------------------------
// Orderline (kart sıralama — Kendall tau mesafesi ≤ 1 → near)
// ---------------------------------------------------------------------------

function kendallTauDistance(order1: string[], order2: string[]): number {
  const posMap = new Map<string, number>(order2.map((id, i) => [id, i]));
  const translated = order1.map((id) => posMap.get(id) ?? -1);
  let inversions = 0;
  for (let i = 0; i < translated.length; i++) {
    for (let j = i + 1; j < translated.length; j++) {
      if (translated[i] > translated[j]) inversions++;
    }
  }
  return inversions;
}

function compareOrderline(answerOrder: string[], predictedOrder: string[]): PredictionResult {
  const distance = kendallTauDistance(answerOrder, predictedOrder);
  if (distance === 0) return "correct";
  if (distance === 1) return "near";
  return "miss";
}

// ---------------------------------------------------------------------------
// Genel giriş noktası
// ---------------------------------------------------------------------------

type AnswerValue =
  | { value: ScChoice }                          // secret_choice
  | { option_id: string }                        // prediction
  | { order: string[] };                         // orderline

/**
 * Cevap ile tahmin karşılaştırır, moduna göre doğru/yakın/ıska döner.
 * `answerValue` ve `predictedValue` DB'deki JSONB alanlarının içeriğidir.
 */
export function compareAnswers(
  mode: "secret_choice" | "prediction" | "orderline",
  answerValue: AnswerValue,
  predictedValue: AnswerValue,
): PredictionResult {
  if (mode === "secret_choice") {
    const a = (answerValue as { value: ScChoice }).value;
    const p = (predictedValue as { value: ScChoice }).value;
    return compareSecretChoice(a, p);
  }

  if (mode === "prediction") {
    const a = (answerValue as { option_id: string }).option_id;
    const p = (predictedValue as { option_id: string }).option_id;
    return comparePrediction(a, p);
  }

  // orderline
  const a = (answerValue as { order: string[] }).order;
  const p = (predictedValue as { order: string[] }).order;
  return compareOrderline(a, p);
}

// ---------------------------------------------------------------------------
// Okuma Skoru
// ---------------------------------------------------------------------------

/**
 * Tahmin sonuçlarından okuma skorunu hesaplar.
 * correct ve near doğru sayılır, miss yanlış sayılır.
 * Güven çarpanı skora dahil değildir.
 */
export function calculateReadingScore(results: PredictionResult[]): number {
  if (results.length === 0) return 0;
  const correct = results.filter((r) => r === "correct" || r === "near").length;
  return Math.round((correct / results.length) * 100);
}
