"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

type RevealResult = "correct" | "near" | "miss";

interface QuestionResult {
  questionId: string;
  roundOrder: number;
  mode: string;
  questionText: string;
  options: Array<{ id: string; optionText: string }> | null;
  myAnswer: unknown;
  partnerAnswer: unknown;
  myPrediction: {
    predictedValue: unknown;
    confidenceLevel: string;
    result: RevealResult | null;
  } | null;
  partnerPredictionOfMe: {
    predictedValue: unknown;
    confidenceLevel: string;
    result: RevealResult | null;
  } | null;
}

interface ResultsData {
  readingScore: number;
  scoreLabel: string;
  myScore: number;
  room: { roomCode: string; gameMode: string; questionCount: number };
  me: { id: string; role: string; displayName: string };
  partner: { role: string; displayName: string } | null;
  questions: QuestionResult[];
}

const RESULT_COLORS: Record<RevealResult, { edge: string; dot: string; badge: string }> = {
  correct: { edge: "bg-tertiary", dot: "bg-tertiary", badge: "text-tertiary" },
  near: { edge: "bg-tertiary-fixed-dim", dot: "bg-tertiary-fixed-dim", badge: "text-tertiary" },
  miss: { edge: "bg-outline", dot: "bg-outline", badge: "text-outline" },
};

function formatAnswer(
  mode: string,
  value: unknown,
  options: Array<{ id: string; optionText: string }> | null,
  scLabel: (v: string) => string,
): string {
  if (value === null || value === undefined) return "—";
  if (mode === "secret_choice") {
    const v = (value as { value: string }).value;
    return scLabel(v);
  }
  if (mode === "prediction") {
    const id = (value as { option_id: string }).option_id;
    return options?.find((o) => o.id === id)?.optionText ?? id;
  }
  if (mode === "orderline") {
    const order = (value as { order: string[] }).order;
    return order
      .map((id, i) => {
        const label = options?.find((o) => o.id === id)?.optionText ?? id;
        return `${i + 1}. ${label}`;
      })
      .join(" → ");
  }
  return JSON.stringify(value);
}

export default function ResultsPage() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;
  const t = useTranslations("results");
  const tOpt = useTranslations("option");
  const tErr = useTranslations("error");
  const router = useRouter();

  const [data, setData] = useState<ResultsData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const resultLabels: Record<RevealResult, string> = {
    correct: t("labelCorrect"),
    near: t("labelNear"),
    miss: t("labelMiss"),
  };

  useEffect(() => {
    const token = localStorage.getItem(`gou_token_${roomCode}`);
    if (!token) {
      setErrorMsg(tErr("generic"));
      return;
    }

    fetch(`/api/rooms/${roomCode}/results?participantToken=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setErrorMsg(json.error.message ?? tErr("generic"));
        } else {
          setData(json);
        }
      })
      .catch(() => setErrorMsg(tErr("generic")));
  }, [roomCode, tErr]);

  if (errorMsg) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-background flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center">
          <span className="material-symbols-outlined text-error icon-fill" style={{ fontSize: "40px" }}>error</span>
        </div>
        <p className="text-body-lg text-on-surface-variant">{errorMsg}</p>
        <button
          onClick={() => router.push("/")}
          className="px-8 py-3 bg-primary text-on-primary rounded-full text-label-md font-semibold shadow-primary-glow hover:bg-surface-tint transition-all active:scale-95"
        >
          {tErr("goHome")}
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-background flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-primary/40 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const correctCount = data.questions.filter((q) => q.myPrediction?.result === "correct").length;
  const nearCount = data.questions.filter((q) => q.myPrediction?.result === "near").length;
  const missCount = data.questions.filter((q) => q.myPrediction?.result === "miss").length;
  const myInitial = data.me.displayName[0]?.toUpperCase() ?? "?";
  const partnerInitial = data.partner?.displayName[0]?.toUpperCase() ?? "P";

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background relative overflow-x-hidden">
      {/* Ambient blobs */}
      <div className="fixed -top-[20%] -right-[20%] w-[70vw] h-[70vw] rounded-full bg-primary/5 blur-[80px] pointer-events-none -z-10" />
      <div className="fixed -bottom-[20%] -left-[20%] w-[60vw] h-[60vw] rounded-full bg-tertiary-fixed/15 blur-[80px] pointer-events-none -z-10" />

      <main className="max-w-[720px] mx-auto px-6 py-10 pb-20 flex flex-col gap-10">
        {/* ── Hero Score ───────────────────────────────────────── */}
        <section className="flex flex-col items-center text-center gap-4">
          {/* Score ring */}
          <div className="relative w-48 h-48 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-soft-active border-4 border-tertiary-container/20 animate-soft-pulse">
            <div className="absolute inset-2 rounded-full border border-tertiary-container/30 border-dashed" />
            {/* SVG progress ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface-container"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="currentColor" strokeDasharray="100,100" strokeWidth="2"
              />
              <path
                className="text-tertiary-container"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="currentColor"
                strokeDasharray={`${data.readingScore},100`}
                strokeLinecap="round" strokeWidth="2"
              />
            </svg>
            <div className="flex flex-col items-center z-10">
              <span className="text-label-md text-on-surface-variant uppercase tracking-widest mb-1">{t("score")}</span>
              <span className="text-headline-xl text-primary leading-none">%{data.readingScore}</span>
            </div>
          </div>

          <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface">{data.scoreLabel}</h1>
          {data.partner && (
            <p className="text-body-md text-on-surface-variant">
              {data.me.displayName} &amp; {data.partner.displayName}
            </p>
          )}
        </section>

        {/* ── Bento insight grid ───────────────────────────────── */}
        <section className="grid grid-cols-2 gap-4">
          {/* Correct */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-soft-card flex flex-col items-start h-36 relative overflow-hidden hover:scale-[1.02] transition-transform">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/10 rounded-full blur-xl" />
            <span className="material-symbols-outlined text-tertiary icon-fill mb-auto">check_circle</span>
            <div className="mt-auto z-10">
              <h3 className="text-label-md text-on-surface-variant">{t("correctCount")}</h3>
              <p className="text-headline-md text-on-surface mt-1">{correctCount}</p>
            </div>
          </div>

          {/* Near */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-soft-card flex flex-col items-start h-36 relative overflow-hidden hover:scale-[1.02] transition-transform">
            <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-tertiary-container/10 rounded-full blur-xl" />
            <span className="material-symbols-outlined text-tertiary-container mb-auto">adjust</span>
            <div className="mt-auto z-10">
              <h3 className="text-label-md text-on-surface-variant">{t("nearCount")}</h3>
              <p className="text-headline-md text-on-surface mt-1">{nearCount}</p>
            </div>
          </div>

          {/* Compat bar — full width */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-soft-card flex flex-col items-start h-36 relative overflow-hidden col-span-2 hover:scale-[1.02] transition-transform">
            <div className="absolute right-0 top-0 w-32 h-32 bg-secondary-container/30 rounded-bl-full" />
            <div className="flex items-center gap-3 mb-2 z-10">
              <span className="material-symbols-outlined text-primary">handshake</span>
              <h3 className="text-label-md text-on-surface-variant">{t("compatRate")}</h3>
            </div>
            <p className="text-headline-md text-on-surface z-10 mb-2">
              {data.readingScore >= 70 ? t("matchGreat") : data.readingScore >= 40 ? t("matchGrowing") : t("matchDiscovering")}
            </p>
            <div className="w-full h-2 bg-surface-variant rounded-full z-10 overflow-hidden mt-auto">
              <div
                className="h-full progress-gradient rounded-full transition-all duration-700"
                style={{ width: `${data.readingScore}%` }}
              />
            </div>
          </div>

          {/* Miss */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 shadow-soft-card flex flex-col items-start h-36 relative overflow-hidden col-span-2 hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-3 mb-2 z-10">
              <span className="material-symbols-outlined text-outline">compare_arrows</span>
              <h3 className="text-label-md text-on-surface-variant">{t("diffOpinion")}</h3>
            </div>
            <p className="text-headline-md text-on-surface z-10">{t("missCountText", { count: missCount })}</p>
            <div className="w-full h-2 bg-surface-variant rounded-full mt-auto z-10 overflow-hidden">
              <div
                className="h-full bg-outline rounded-full"
                style={{ width: `${data.questions.length > 0 ? (missCount / data.questions.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </section>

        {/* ── Premium teaser ───────────────────────────────────── */}
        <section className="bg-surface-container-high rounded-[24px] p-6 text-center shadow-soft-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 pointer-events-none" />
          <span className="material-symbols-outlined text-primary icon-fill mb-3" style={{ fontSize: "40px" }}>volunteer_activism</span>
          <h3 className="text-headline-md text-on-surface mb-2">{t("continueConvo")}</h3>
          <p className="text-body-md text-on-surface-variant mb-4">{t("continueConvoDesc")}</p>
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="px-6 py-2 bg-surface text-primary rounded-full text-label-md font-bold shadow-sm hover:bg-surface-container-lowest active:scale-95 transition-all"
          >
            {showDetails ? t("backToSummary") : t("seeDetails")}
          </button>
        </section>

        {/* ── Question details ─────────────────────────────────── */}
        {showDetails && (
          <section className="flex flex-col gap-6">
            <h2 className="text-headline-md text-on-background text-center">{t("details")}</h2>
            {data.questions.map((q, i) => {
              const myResult = q.myPrediction?.result ?? null;
              const partnerResult = q.partnerPredictionOfMe?.result ?? null;
              const topResult = myResult ?? partnerResult;
              const colors = topResult ? RESULT_COLORS[topResult] : null;

              return (
                <article
                  key={q.questionId}
                  className="bg-surface-container-lowest rounded-xl shadow-soft-card relative overflow-hidden"
                >
                  {/* Top color edge */}
                  {colors && (
                    <div className={`absolute top-0 left-0 w-full h-1 ${colors.edge}`} />
                  )}

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      {topResult && (
                        <span className="inline-flex items-center gap-1.5 bg-surface-container-high px-3 py-1 rounded-full">
                          <span className={`w-2 h-2 rounded-full ${colors?.dot}`} />
                          <span className="text-label-md text-on-surface-variant">{resultLabels[topResult]}</span>
                        </span>
                      )}
                      <span className="text-label-md text-on-surface-variant ml-auto">Q{i + 1}</span>
                    </div>

                    <h3 className="text-headline-md text-on-background mb-6">{q.questionText}</h3>

                    {/* Answer bubbles */}
                    <div className="space-y-4 relative">
                      <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-secondary-container" />

                      {/* My answer */}
                      <div className="flex gap-4 relative z-10">
                        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0 border-4 border-surface-container-lowest text-label-md text-on-primary-container font-bold">
                          {myInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-label-md text-on-surface-variant mb-1">{data.me.displayName} — {t("answerOf")}</p>
                          <p className="text-body-md text-on-background bg-surface-container-low p-3 rounded-lg rounded-tl-none">
                            {formatAnswer(q.mode, q.myAnswer, q.options, tOpt)}
                          </p>
                        </div>
                      </div>

                      {/* Partner's prediction of me */}
                      {q.partnerPredictionOfMe && (
                        <div className="flex gap-4 relative z-10">
                          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0 border-4 border-surface-container-lowest text-label-md text-on-secondary-container font-bold">
                            {partnerInitial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-label-md text-on-surface-variant mb-1">{data.partner?.displayName ?? "Partner"} — {t("guessOf")}</p>
                            <p className="text-body-md text-on-background bg-surface p-3 rounded-lg rounded-tl-none border border-surface-container">
                              {formatAnswer(q.mode, q.partnerPredictionOfMe.predictedValue, q.options, tOpt)}
                            </p>
                          </div>
                          {partnerResult && (
                            <span className={`material-symbols-outlined flex-shrink-0 mt-3 ${RESULT_COLORS[partnerResult].badge}`}>
                              {partnerResult === "correct" ? "check_circle" : partnerResult === "near" ? "adjust" : "cancel"}
                            </span>
                          )}
                        </div>
                      )}

                      {/* My prediction of partner */}
                      {q.myPrediction && (
                        <div className="flex gap-4 relative z-10">
                          <div className="w-8 h-8 rounded-full bg-primary-container/50 flex items-center justify-center flex-shrink-0 border-4 border-surface-container-lowest text-label-md text-on-primary-container font-bold">
                            {myInitial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-label-md text-on-surface-variant mb-1">{data.me.displayName} — {t("guessAboutPartner")}</p>
                            <p className="text-body-md text-on-background bg-surface-container-low p-3 rounded-lg rounded-tl-none">
                              {formatAnswer(q.mode, q.myPrediction.predictedValue, q.options, tOpt)}
                            </p>
                          </div>
                          {myResult && (
                            <span className={`material-symbols-outlined flex-shrink-0 mt-3 ${RESULT_COLORS[myResult].badge}`}>
                              {myResult === "correct" ? "check_circle" : myResult === "near" ? "adjust" : "cancel"}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Partner actual answer */}
                      {q.partnerAnswer !== null && q.partnerAnswer !== undefined && (
                        <div className="flex gap-4 relative z-10">
                          <div className="w-8 h-8 rounded-full bg-secondary-container/50 flex items-center justify-center flex-shrink-0 border-4 border-surface-container-lowest text-label-md text-on-secondary-container font-bold">
                            {partnerInitial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-label-md text-on-surface-variant mb-1">{data.partner?.displayName ?? "Partner"} — {t("partnerRealAnswer")}</p>
                            <p className="text-body-md text-on-background bg-surface p-3 rounded-lg rounded-tl-none border border-surface-container">
                              {formatAnswer(q.mode, q.partnerAnswer, q.options, tOpt)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* ── Action buttons ───────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <button
            onClick={() => router.push("/create")}
            className="w-full h-14 bg-primary text-on-primary rounded-full text-label-md font-bold shadow-primary-glow hover:bg-surface-tint active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-xl">refresh</span>
            {t("playAgain")}
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full h-14 bg-secondary-container text-primary rounded-full text-label-md font-bold hover:bg-secondary-container/80 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-xl">home</span>
            {t("goHome")}
          </button>
        </section>
      </main>
    </div>
  );
}
