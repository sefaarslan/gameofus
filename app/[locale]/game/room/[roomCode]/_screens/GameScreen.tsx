"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { relKey } from "@/lib/relationship";

type QuestionMode = "secret_choice" | "prediction" | "orderline";
type ConfidenceLevel = "guess" | "think" | "sure";
type ScChoice = "yes" | "unsure" | "no";

interface Question {
  roundOrder: number;
  questionId: string;
  mode: QuestionMode;
  questionText: string;
  options: Array<{ id: string; optionText: string; sortOrder: number }> | null;
}

interface GameScreenProps {
  roomCode: string;
  participantToken: string;
  questions: Question[];
  initialIndex: number;
  relationshipType?: string | null;
  onComplete: () => void;
}

function useModeLabels(): Record<QuestionMode, string> {
  const t = useTranslations("game");
  return {
    secret_choice: t("modeSecret"),
    prediction: t("modePrediction"),
    orderline: t("modeOrderline"),
  };
}

const MODE_ICONS: Record<QuestionMode, string> = {
  secret_choice: "visibility_off",
  prediction: "timeline",
  orderline: "format_list_numbered",
};

// ── Secret Choice buttons ────────────────────────────────────────
function SecretChoiceButtons({
  selected,
  onSelect,
  variant = "answer",
}: {
  selected: ScChoice | null;
  onSelect: (v: ScChoice) => void;
  variant?: "answer" | "prediction";
}) {
  const t = useTranslations("option");
  const options: ScChoice[] = ["yes", "unsure", "no"];

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((v) => {
        const isSelected = selected === v;
        const answerSelected = variant === "answer" && isSelected;
        const predSelected = variant === "prediction" && isSelected;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onSelect(v)}
            aria-pressed={isSelected}
            className={`w-full text-center px-2 py-3.5 rounded-2xl border-2 text-body-md font-semibold transition-all flex justify-center items-center ${
              answerSelected
                ? "border-primary bg-primary-fixed text-on-primary-fixed"
                : predSelected
                ? "border-tertiary-container bg-tertiary-fixed text-on-tertiary-fixed"
                : "border-transparent bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
          >
            <span>{t(v)}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Prediction buttons ────────────────────────────────────────────
function PredictionButtons({
  options,
  selected,
  onSelect,
  variant = "answer",
}: {
  options: Array<{ id: string; optionText: string }>;
  selected: string | null;
  onSelect: (id: string) => void;
  variant?: "answer" | "prediction";
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => {
        const isSelected = selected === o.id;
        const answerSelected = variant === "answer" && isSelected;
        const predSelected = variant === "prediction" && isSelected;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onSelect(o.id)}
            className={`w-full text-left px-4 py-3 rounded-2xl border-2 text-body-md font-semibold transition-all flex justify-between items-center gap-3 ${
              answerSelected
                ? "border-primary bg-primary-fixed text-on-primary-fixed"
                : predSelected
                ? "border-tertiary-container bg-tertiary-fixed text-on-tertiary-fixed"
                : "border-transparent bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
          >
            <span>{o.optionText}</span>
            {isSelected && (
              <span
                className={`material-symbols-outlined icon-fill text-lg flex-shrink-0 ${answerSelected ? "text-primary" : "text-tertiary-container"}`}
              >
                check_circle
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Orderline ranker (tap-to-rank) ───────────────────────────────
function OrderlineRanker({
  options,
  order,
  onChange,
  guide,
  variant = "answer",
}: {
  options: Array<{ id: string; optionText: string }>;
  order: string[];
  onChange: (order: string[]) => void;
  guide: string;
  variant?: "answer" | "prediction";
}) {
  const t = useTranslations("game");

  function handleTap(id: string) {
    if (order.includes(id)) {
      onChange(order.filter((x) => x !== id));
    } else {
      onChange([...order, id]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-label-md text-on-surface-variant flex items-center gap-1.5 mb-1">
        <span className="material-symbols-outlined text-base">touch_app</span>
        {guide}
      </p>
      {options.map((o) => {
        const rank = order.indexOf(o.id);
        const isSelected = rank !== -1;
        const bg = variant === "answer"
          ? isSelected ? "bg-primary-fixed border-primary" : "bg-surface-container-low border-transparent hover:bg-surface-container"
          : isSelected ? "bg-tertiary-fixed border-tertiary-container" : "bg-surface-container-low border-transparent hover:bg-surface-container";

        return (
          <button
            key={o.id}
            type="button"
            onClick={() => handleTap(o.id)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-2xl border-2 text-body-md font-semibold transition-all ${bg}`}
          >
            <div
              className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-label-md font-bold ${
                isSelected
                  ? variant === "answer" ? "bg-primary text-on-primary" : "bg-tertiary-container text-on-tertiary"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {isSelected ? rank + 1 : ""}
            </div>
            <span className="flex-1 text-left text-on-surface">{o.optionText}</span>
            {isSelected && (
              <span className="material-symbols-outlined text-on-surface-variant/50 text-xl">drag_handle</span>
            )}
          </button>
        );
      })}
      {order.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-label-md text-on-surface-variant hover:text-on-surface self-end mt-1 flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-base">restart_alt</span>
          {t("orderReset")}
        </button>
      )}
    </div>
  );
}

// ── Main GameScreen ───────────────────────────────────────────────
export function GameScreen({
  roomCode,
  participantToken,
  questions,
  initialIndex,
  relationshipType,
  onComplete,
}: GameScreenProps) {
  const t = useTranslations("game");
  const rel = relKey(relationshipType);
  const tConf = useTranslations("confidence");
  const modeLabels = useModeLabels();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [myAnswer, setMyAnswer] = useState<ScChoice | string | string[] | null>(null);
  const [myPrediction, setMyPrediction] = useState<ScChoice | string | string[] | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceLevel>("guess");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const sortedOptions = question?.options
    ? [...question.options].sort((a, b) => a.sortOrder - b.sortOrder)
    : null;

  const myAnswerOrder = Array.isArray(myAnswer) ? (myAnswer as string[]) : [];
  const myPredictionOrder = Array.isArray(myPrediction) ? (myPrediction as string[]) : [];

  const myAnswerComplete =
    question?.mode === "orderline"
      ? myAnswerOrder.length === (sortedOptions?.length ?? 0)
      : myAnswer !== null;

  const myPredictionComplete =
    question?.mode === "orderline"
      ? myPredictionOrder.length === (sortedOptions?.length ?? 0)
      : myPrediction !== null;

  const canSubmit = myAnswerComplete && myPredictionComplete && !submitting;

  function buildValue(mode: QuestionMode, val: ScChoice | string | string[]) {
    if (mode === "secret_choice") return { value: val as ScChoice };
    if (mode === "prediction") return { option_id: val as string };
    return { order: val as string[] };
  }

  // Sonraki soruya (ya da son soruysa sonuca) geç: ara ekran yok, kilitlenen tur sessizce kaydedilir
  async function advance() {
    if (isLast) {
      try {
        await fetch(`/api/rooms/${roomCode}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantToken }),
        });
      } catch {
        // proceed anyway
      }
      onComplete();
      return;
    }
    setCurrentIndex((i) => i + 1);
    setMyAnswer(null);
    setMyPrediction(null);
    setConfidence("guess");
    setError(null);
  }

  async function handleSubmit() {
    if (!canSubmit || !question) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/rooms/${roomCode}/submit-turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantToken,
          questionId: question.questionId,
          answerValue: buildValue(question.mode, myAnswer!),
          predictedValue: buildValue(question.mode, myPrediction!),
          confidenceLevel: confidence,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? t("errorGeneric"));
        return;
      }
      await advance();
    } catch {
      setError(t("errorConnection"));
    } finally {
      setSubmitting(false);
    }
  }

  // Soru değişince sayfa en üstten başlasın (mobilde önceki kaydırma konumu kalıp soruyu kesiyordu)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentIndex]);

  if (!question) return null;

  const confidenceLevels: Array<{ level: ConfidenceLevel; icon: string }> = [
    { level: "guess", icon: "psychology" },
    { level: "think", icon: "lightbulb" },
    { level: "sure", icon: "verified" },
  ];

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background flex flex-col">
      {/* Progress bar */}
      <div className="sticky top-0 md:top-[73px] z-30 bg-surface/90 backdrop-blur-sm px-6 py-3 border-b border-outline-variant/20">
        <div className="max-w-[720px] mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">{MODE_ICONS[question.mode]}</span>
              <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-secondary-container text-on-secondary-container rounded-full text-label-md">
                {modeLabels[question.mode]}
              </span>
            </div>
            <span className="text-label-md text-on-surface-variant uppercase tracking-wider">
              {t("progress", { current: currentIndex + 1, total: questions.length })}
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full progress-gradient rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-[720px] mx-auto w-full px-5 py-5 pb-28 gap-0">
        {/* Question */}
        <div className="text-center px-2 mb-5">
          <h1 className="text-headline-sm md:text-headline-md text-on-surface leading-snug">
            {question.questionText}
          </h1>
        </div>

        {/* My answer section */}
        <div className="glass-card rounded-[24px] p-4 shadow-soft-card relative mb-0">
          <div className="flex items-center gap-2 mb-3 text-primary">
            <span className="material-symbols-outlined text-lg icon-fill">lock</span>
            <h2 className="text-label-md uppercase tracking-wide">{t("yourAnswer")} — {t("yourAnswerNote", { rel })}</h2>
          </div>

          {question.mode === "secret_choice" && (
            <SecretChoiceButtons
              selected={myAnswer as ScChoice | null}
              onSelect={(v) => setMyAnswer(v)}
              variant="answer"
            />
          )}
          {question.mode === "prediction" && sortedOptions && (
            <PredictionButtons
              options={sortedOptions}
              selected={myAnswer as string | null}
              onSelect={(id) => setMyAnswer(id)}
              variant="answer"
            />
          )}
          {question.mode === "orderline" && sortedOptions && (
            <OrderlineRanker
              options={sortedOptions}
              order={myAnswerOrder}
              onChange={(o) => setMyAnswer(o)}
              guide={t("orderGuide")}
              variant="answer"
            />
          )}
        </div>

        {/* Connector */}
        <div className="flex justify-center my-0 relative z-10 py-0.5">
          <div className="h-5 border-l-2 border-dashed border-outline-variant" />
        </div>

        {/* Partner prediction section */}
        <div className="glass-card rounded-[24px] p-4 shadow-soft-card">
          <div className="flex items-center gap-2 mb-3 text-tertiary-container">
            <span className="material-symbols-outlined text-lg icon-fill">psychology</span>
            <h2 className="text-label-md uppercase tracking-wide">{t("partnerGuess", { rel })}</h2>
          </div>

          {question.mode === "secret_choice" && (
            <SecretChoiceButtons
              selected={myPrediction as ScChoice | null}
              onSelect={(v) => setMyPrediction(v)}
              variant="prediction"
            />
          )}
          {question.mode === "prediction" && sortedOptions && (
            <PredictionButtons
              options={sortedOptions}
              selected={myPrediction as string | null}
              onSelect={(id) => setMyPrediction(id)}
              variant="prediction"
            />
          )}
          {question.mode === "orderline" && sortedOptions && (
            <OrderlineRanker
              options={sortedOptions}
              order={myPredictionOrder}
              onChange={(o) => setMyPrediction(o)}
              guide={t("partnerOrderGuide", { rel })}
              variant="prediction"
            />
          )}

          {/* Confidence pills */}
          <div className="mt-4 space-y-2">
            <p className="text-label-md text-on-surface-variant text-center">{t("confidence")}</p>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:justify-center">
              {confidenceLevels.map(({ level, icon }) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setConfidence(level)}
                  className={`flex items-center justify-center gap-1.5 min-w-0 px-2 sm:px-5 py-1.5 rounded-full text-label-md whitespace-nowrap transition-all ${
                    confidence === level
                      ? "border border-transparent bg-tertiary-container text-on-tertiary shadow-md"
                      : "border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{icon}</span>
                  {tConf(level)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-error-container text-error rounded-xl px-4 py-3 mt-4">
            <span className="material-symbols-outlined text-xl">error</span>
            <span className="text-body-md">{error}</span>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-surface via-surface/95 to-transparent pt-8 pb-5 px-5 z-40 flex justify-center">
        <div className="w-full max-w-[720px]">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-primary text-on-primary h-14 rounded-full flex items-center justify-center gap-2 shadow-primary-glow hover:bg-surface-tint disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 text-body-lg font-semibold"
          >
            {submitting ? (
              <span className="material-symbols-outlined animate-spin text-xl">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-lg">lock_clock</span>
            )}
            {submitting ? t("locking") : t("lock")}
          </button>
          <p className="mt-2 text-center text-xs text-on-surface-variant/80">{t("answersAtEnd")}</p>
        </div>
      </div>
    </div>
  );
}
