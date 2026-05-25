"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";

type QuestionMode = "secret_choice" | "prediction" | "orderline";
type ConfidenceLevel = "guess" | "think" | "sure";
type ScChoice = "yes" | "unsure" | "no";
type RevealResult = "correct" | "near" | "miss";

interface Question {
  roundOrder: number;
  questionId: string;
  mode: QuestionMode;
  questionText: string;
  options: Array<{ id: string; optionText: string; sortOrder: number }> | null;
}

interface MicroReveal {
  available: boolean;
  result?: RevealResult;
  label?: string;
  points?: number;
  message?: string;
}

interface GameScreenProps {
  roomCode: string;
  participantToken: string;
  questions: Question[];
  initialIndex: number;
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
    <div className="flex flex-col gap-3">
      {options.map((v) => {
        const isSelected = selected === v;
        const answerSelected = variant === "answer" && isSelected;
        const predSelected = variant === "prediction" && isSelected;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onSelect(v)}
            className={`w-full text-left px-6 py-4 rounded-xl border-2 text-headline-md transition-all flex justify-between items-center ${
              answerSelected
                ? "border-primary bg-primary-fixed text-on-primary-fixed"
                : predSelected
                ? "border-tertiary-container bg-tertiary-fixed text-on-tertiary-fixed"
                : "border-transparent bg-surface-container-low text-on-surface hover:bg-surface-container"
            }`}
          >
            <span>{t(v)}</span>
            {isSelected && (
              <span
                className={`material-symbols-outlined icon-fill text-xl ${answerSelected ? "text-primary" : "text-tertiary-container"}`}
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
    <div className="flex flex-col gap-3">
      {options.map((o) => {
        const isSelected = selected === o.id;
        const answerSelected = variant === "answer" && isSelected;
        const predSelected = variant === "prediction" && isSelected;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onSelect(o.id)}
            className={`w-full text-left px-6 py-4 rounded-xl border-2 text-body-lg transition-all flex justify-between items-center ${
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
                className={`material-symbols-outlined icon-fill text-xl flex-shrink-0 ${answerSelected ? "text-primary" : "text-tertiary-container"}`}
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
        <span className="material-symbols-outlined text-lg">touch_app</span>
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
            className={`flex items-center gap-4 w-full p-4 rounded-[24px] border-2 text-body-lg transition-all shadow-soft-card ${bg}`}
          >
            <div
              className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full text-headline-md font-bold ${
                isSelected
                  ? variant === "answer" ? "bg-primary text-on-primary" : "bg-tertiary-container text-on-tertiary"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {isSelected ? rank + 1 : ""}
            </div>
            <span className="flex-1 text-left text-on-surface">{o.optionText}</span>
            {isSelected && (
              <span className="material-symbols-outlined text-on-surface-variant/50 text-2xl">drag_handle</span>
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

// ── Micro-reveal card ────────────────────────────────────────────
function MicroRevealCard({
  reveal,
  isLast,
  onNext,
}: {
  reveal: MicroReveal;
  isLast: boolean;
  onNext: () => void;
}) {
  const tReveal = useTranslations("reveal");

  if (!reveal.available) {
    return (
      <div className="w-full max-w-[400px] mx-auto bg-surface-container-lowest rounded-xl p-8 flex flex-col items-center text-center shadow-soft-active animate-pop-in">
        <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-primary icon-fill" style={{ fontSize: "40px" }}>bookmark_added</span>
        </div>
        <h2 className="text-headline-lg-mobile text-on-background mb-2">{tReveal("saved")}</h2>
        <p className="text-body-md text-on-surface-variant mb-8">{tReveal("savedSubtitle")}</p>
        <button
          onClick={onNext}
          className="w-full bg-primary text-on-primary h-16 rounded-full flex items-center justify-center gap-3 shadow-primary-glow hover:bg-surface-tint transition-all active:scale-95 group text-body-lg font-semibold"
        >
          {isLast ? tReveal("finish") : tReveal("next")}
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>
    );
  }

  const resultConfig = {
    correct: {
      iconBg: "bg-tertiary-fixed",
      icon: "workspace_premium",
      iconColor: "text-on-tertiary-fixed",
      title: tReveal("correctTitle"),
      titleColor: "text-primary",
    },
    near: {
      iconBg: "bg-secondary-container",
      icon: "adjust",
      iconColor: "text-on-secondary-container",
      title: tReveal("nearTitle"),
      titleColor: "text-secondary-container",
    },
    miss: {
      iconBg: "bg-error-container",
      icon: "close",
      iconColor: "text-error",
      title: tReveal("missTitle"),
      titleColor: "text-error",
    },
  };

  const cfg = resultConfig[reveal.result ?? "miss"];

  return (
    <div className="w-full max-w-[400px] mx-auto bg-surface-container-lowest rounded-xl p-8 flex flex-col items-center text-center shadow-soft-active animate-pop-in relative overflow-hidden">
      {/* Corner blobs */}
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary-container/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-tertiary-fixed/20 rounded-full blur-3xl" />

      <div className={`relative w-24 h-24 rounded-full ${cfg.iconBg} flex items-center justify-center mb-6 shadow-soft-card z-10`}>
        <span className={`material-symbols-outlined icon-fill ${cfg.iconColor}`} style={{ fontSize: "48px" }}>{cfg.icon}</span>
        {reveal.result === "correct" && (
          <>
            <span className="material-symbols-outlined absolute -top-2 -right-2 text-tertiary text-xl animate-pulse">colors_spark</span>
            <span className="material-symbols-outlined absolute bottom-2 -left-3 text-tertiary text-base animate-pulse">star</span>
          </>
        )}
      </div>

      <h2 className={`text-headline-lg-mobile mb-2 relative z-10 animate-float-up ${cfg.titleColor}`}>{cfg.title}</h2>
      <p className="text-body-md text-on-surface-variant mb-6 relative z-10 animate-float-up">{reveal.message}</p>

      {reveal.points !== undefined && reveal.points > 0 && (
        <div className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg p-5 flex flex-col items-center relative z-10 mb-6 animate-float-up">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-headline-xl text-tertiary drop-shadow-sm">{tReveal("points", { points: reveal.points })}</span>
            {reveal.label && (
              <span className="text-label-md text-on-surface-variant opacity-80">({reveal.label})</span>
            )}
          </div>
          {reveal.result === "correct" && (
            <div className="bg-tertiary-fixed text-on-tertiary-fixed text-label-md px-4 py-2 rounded-full inline-flex items-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-lg icon-fill">bolt</span>
              <span>{tReveal("greatReading")}</span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full bg-primary text-on-primary h-16 rounded-full flex items-center justify-center gap-3 shadow-primary-glow hover:bg-surface-tint transition-all active:scale-95 group text-body-lg font-semibold relative z-10"
      >
        {isLast ? tReveal("finish") : tReveal("next")}
        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
      </button>
    </div>
  );
}

// ── Main GameScreen ───────────────────────────────────────────────
export function GameScreen({
  roomCode,
  participantToken,
  questions,
  initialIndex,
  onComplete,
}: GameScreenProps) {
  const t = useTranslations("game");
  const tConf = useTranslations("confidence");
  const modeLabels = useModeLabels();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [myAnswer, setMyAnswer] = useState<ScChoice | string | string[] | null>(null);
  const [myPrediction, setMyPrediction] = useState<ScChoice | string | string[] | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceLevel>("guess");
  const [submitting, setSubmitting] = useState(false);
  const [reveal, setReveal] = useState<MicroReveal | null>(null);
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

  const canSubmit = myAnswerComplete && myPredictionComplete && !submitting && !reveal;

  function buildValue(mode: QuestionMode, val: ScChoice | string | string[]) {
    if (mode === "secret_choice") return { value: val as ScChoice };
    if (mode === "prediction") return { option_id: val as string };
    return { order: val as string[] };
  }

  const handleSubmit = useCallback(async () => {
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
      setReveal(data.microReveal);
    } catch {
      setError(t("errorConnection"));
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, question, roomCode, participantToken, myAnswer, myPrediction, confidence]);

  async function handleNext() {
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
    setReveal(null);
    setError(null);
  }

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
      <div className="sticky top-[73px] z-30 bg-surface/90 backdrop-blur-sm px-6 py-3 border-b border-outline-variant/20">
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

      {/* Micro-reveal state — full overlay */}
      {reveal && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-[300px] h-[300px] bg-primary-container/30 rounded-full blur-[80px] opacity-60 pointer-events-none" />
          <div className="absolute bottom-20 -right-20 w-[250px] h-[250px] bg-tertiary-fixed/40 rounded-full blur-[60px] opacity-40 pointer-events-none" />
          <MicroRevealCard reveal={reveal} isLast={isLast} onNext={handleNext} />
        </div>
      )}

      {!reveal && (
        <div className="flex-1 flex flex-col max-w-[720px] mx-auto w-full px-6 py-8 pb-32 gap-0">
          {/* Question */}
          <div className="text-center px-2 mb-8">
            <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface leading-snug">
              {question.questionText}
            </h1>
          </div>

          {/* My answer section */}
          <div className="glass-card rounded-[2rem] p-6 shadow-soft-card relative mb-0">
            <div className="flex items-center gap-2 mb-5 text-primary">
              <span className="material-symbols-outlined text-xl icon-fill">lock</span>
              <h2 className="text-label-md uppercase tracking-wide">{t("yourAnswer")} — {t("yourAnswerNote")}</h2>
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
          <div className="flex justify-center my-0 relative z-10 py-1">
            <div className="h-10 border-l-2 border-dashed border-outline-variant" />
          </div>

          {/* Partner prediction section */}
          <div className="glass-card rounded-[2rem] p-6 shadow-soft-card">
            <div className="flex items-center gap-2 mb-5 text-tertiary-container">
              <span className="material-symbols-outlined text-xl icon-fill">psychology</span>
              <h2 className="text-label-md uppercase tracking-wide">{t("partnerGuess")}</h2>
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
                guide={t("partnerOrderGuide")}
                variant="prediction"
              />
            )}

            {/* Confidence pills */}
            <div className="mt-6 space-y-3">
              <p className="text-label-md text-on-surface-variant text-center">{t("confidence")}</p>
              <div className="flex justify-center gap-2">
                {confidenceLevels.map(({ level, icon }) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setConfidence(level)}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-label-md transition-all ${
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
      )}

      {/* Sticky CTA */}
      {!reveal && (
        <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-surface via-surface/95 to-transparent pt-12 pb-8 px-6 z-40 flex justify-center">
          <div className="w-full max-w-[720px]">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full bg-primary text-on-primary h-16 rounded-full flex items-center justify-center gap-2 shadow-primary-glow hover:bg-surface-tint disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 text-headline-md"
            >
              {submitting ? (
                <span className="material-symbols-outlined animate-spin text-xl">refresh</span>
              ) : (
                <span className="material-symbols-outlined text-xl">lock_clock</span>
              )}
              {submitting ? t("locking") : t("lock")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
