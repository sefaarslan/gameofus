"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { oppositeChoice, readChoice, type Choice } from "@/lib/bluff";

// Blöf modunun oyun ekranı parçaları (tanıtım, Yalan Kartı) + (tüm modlar için) bitirme adımı.

/** `state` yanıtındaki kendi blöf cevapların. */
export interface MyBluffAnswer {
  questionId: string;
  value: unknown;
  shownValue: unknown;
}

// Renk dili mobil uygulamayla aynı: Evet yeşil, Kararsız turuncu, Hayır kırmızı. Seçili = renkli çerçeve + dolgu + yazı + tik
// (yalnızca renge bağlı kalmaz). Kendi cevabın biraz daha dolgun, partner tahmini daha açık.
export const CHOICE_STYLES: Record<"yes" | "unsure" | "no", { border: string; answer: string; pred: string; text: string }> = {
  yes: { border: "border-[#43a047]", answer: "bg-[#43a047]/25", pred: "bg-[#43a047]/10", text: "text-[#1b5e20]" },
  unsure: { border: "border-[#fb8c00]", answer: "bg-[#fb8c00]/25", pred: "bg-[#fb8c00]/10", text: "text-[#8a4b00]" },
  no: { border: "border-[#ae2f34]", answer: "bg-[#ae2f34]/20", pred: "bg-[#ae2f34]/10", text: "text-[#8c1f24]" },
};

// ── İlk oyun tanıtımı ────────────────────────────────────────────
const INTRO_KEY = "gou_bluff_intro_seen";

/** Bu cihazda blöf tanıtımı daha önce görülmediyse true (depolama okunamazsa tanıtım gösterilir). */
export function shouldShowBluffIntro(): boolean {
  try {
    return localStorage.getItem(INTRO_KEY) === null;
  } catch {
    return true;
  }
}

/** İlk blöf oyununda sorulardan önce gösterilen 3 adımlık tanıtım. */
export function BluffIntro({ name, lieCards, onStart }: { name: string; lieCards: number; onStart: () => void }) {
  const t = useTranslations("game.bluff.intro");
  const steps = [
    { icon: "touch_app", title: t("step1"), desc: t("step1Desc", { name }) },
    { icon: "theater_comedy", title: t("step2"), desc: t("step2Desc", { count: lieCards }) },
    { icon: "search", title: t("step3"), desc: t("step3Desc", { name, count: lieCards }) },
  ];

  function start() {
    try {
      localStorage.setItem(INTRO_KEY, "1");
    } catch {
      // depolama kapalıysa tanıtım bir sonraki oyunda yine gösterilir
    }
    onStart();
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-[420px] flex flex-col gap-6">
        <h1 className="text-headline-md text-on-surface text-center">{t("title")}</h1>
        <ol className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <li
              key={step.icon}
              className="bluff-pop flex items-center gap-4 rounded-[24px] bg-surface-container-lowest p-4 shadow-soft-card"
              style={{ animationDelay: `${120 + i * 220}ms` }}
            >
              <span className="relative w-12 h-12 shrink-0 rounded-2xl bg-primary-container/50 flex items-center justify-center">
                <span className="material-symbols-outlined icon-fill text-2xl text-primary">{step.icon}</span>
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </span>
              <span>
                <span className="block text-body-lg font-bold text-on-surface leading-snug">{step.title}</span>
                <span className="block text-xs text-on-surface-variant mt-0.5 leading-relaxed">{step.desc}</span>
              </span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={start}
          className="w-full h-14 rounded-full bg-primary text-on-primary text-body-lg font-semibold shadow-primary-glow active:scale-95"
        >
          {t("start")}
        </button>
      </div>
    </div>
  );
}

// ── Yalan Kartı ──────────────────────────────────────────────────
/** Kalan hakları gösteren küçük kart sırası (dolu = elde, soluk = kullanılmış). */
function CardPips({ total, used }: { total: number; used: number }) {
  return (
    <span className="flex gap-1" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`w-3.5 h-5 rounded-[4px] border-2 transition-all duration-300 ${
            i < total - used ? "border-current bg-current" : "border-current opacity-30"
          }`}
        />
      ))}
    </span>
  );
}

/** Soru ekranında Yalan Kartı: dokununca bu sorunun cevabı karşı tarafa ters gösterilir. */
export function LieCard({
  truth,
  active,
  name,
  used,
  total,
  isLast,
  onToggle,
}: {
  /** Kendi cevabın; seçilmeden kart oynanamaz */
  truth: Choice | null;
  active: boolean;
  name: string;
  /** Önceki sorularda oynanan kart sayısı */
  used: number;
  total: number;
  isLast: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("game.bluff");
  const tOpt = useTranslations("option");
  const left = Math.max(0, total - used);
  const empty = left === 0 && !active;
  const disabled = empty || truth === null;
  const mustPlay = isLast && used === 0 && !active;

  const title = active ? t("cardActive") : empty ? t("cardsEmpty") : t("cardTitle");
  const detail = active && truth
    ? t("cardPreview", { name, value: tOpt(oppositeChoice(truth)) })
    : empty
      ? t("cardsEmptyDesc")
      : truth === null
        ? t("cardPickFirst")
        : mustPlay
          ? t("cardLast")
          : t("cardUse");

  return (
    <button
      // Anahtar değişince kart "çevrilir"
      key={active ? "on" : "off"}
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={active}
      className={`bluff-flip mt-3 w-full min-h-[64px] rounded-2xl border-2 px-4 py-3 text-left flex items-center gap-3 transition-colors active:scale-[0.98] disabled:cursor-not-allowed ${
        active
          ? "border-primary bg-primary text-on-primary shadow-primary-glow"
          : empty
            ? "border-outline-variant/40 bg-surface-container text-on-surface-variant"
            : "border-dashed border-primary/60 bg-surface-container-lowest text-primary"
      } ${truth === null && !empty ? "opacity-60" : ""}`}
    >
      <span className="material-symbols-outlined icon-fill text-3xl shrink-0">theater_comedy</span>
      <span className="flex-1 min-w-0">
        <span className="block text-body-md font-bold leading-tight">{title}</span>
        <span role="status" className={`block text-xs mt-0.5 leading-snug ${active ? "text-on-primary/90" : mustPlay ? "font-bold text-primary" : "text-on-surface-variant"}`}>
          {detail}
        </span>
      </span>
      <span className="flex flex-col items-end gap-1 shrink-0">
        <CardPips total={total} used={used + (active ? 1 : 0)} />
        <span className="text-[11px] font-bold">{active ? t("cardUndo") : t("cardsLeft", { count: left })}</span>
      </span>
    </button>
  );
}

export interface PlayedAnswer {
  questionId: string;
  questionText: string;
  value: unknown;
  shownValue: unknown;
}

/**
 * Tüm sorular cevaplandıktan sonraki adım (bütün modlar): `complete` isteği gönderilir; başarısızsa tekrar denenebilir.
 * Blöf modunda hiç yalan söylenmediyse önce bir soru seçtirilir (sunucu da en az bir yalanı zorunlu tutar).
 * Sayfa son sorudan sonra yenilenirse de bu adım açılır.
 */
export function FinishStep({
  roomCode,
  participantToken,
  isBluff,
  answers,
  name,
  onComplete,
}: {
  roomCode: string;
  participantToken: string;
  isBluff: boolean;
  answers: PlayedAnswer[];
  name: string;
  onComplete: () => void;
}) {
  const t = useTranslations("game");
  const tb = useTranslations("game.bluff");
  const tOpt = useTranslations("option");
  const [needsLie, setNeedsLie] = useState(() => isBluff && !answers.some((a) => a.shownValue != null));
  const [picked, setPicked] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const send = useCallback(
    async (lieQuestionId?: string) => {
      setSending(true);
      setError(null);
      try {
        const res = await fetch(`/api/rooms/${roomCode}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantToken, ...(lieQuestionId ? { lieQuestionId } : {}) }),
        });
        if (res.ok) {
          onComplete();
          return;
        }
        const data = await res.json().catch(() => null);
        if (data?.error?.code === "LIE_REQUIRED") setNeedsLie(true);
        else setError(data?.error?.message ?? t("errorGeneric"));
      } catch {
        setError(t("errorConnection"));
      } finally {
        setSending(false);
      }
    },
    [roomCode, participantToken, onComplete, t],
  );

  useEffect(() => {
    if (needsLie || started.current) return;
    started.current = true;
    void send();
  }, [needsLie, send]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const errorBox = error && (
    <div role="alert" className="flex items-center gap-3 bg-error-container text-error rounded-xl px-4 py-3">
      <span className="material-symbols-outlined text-xl">error</span>
      <span className="text-body-md">{error}</span>
    </div>
  );

  if (!needsLie) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        {error ? (
          <>
            {errorBox}
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending}
              className="px-8 py-3 bg-primary text-on-primary rounded-full text-label-md font-bold shadow-primary-glow active:scale-95 disabled:opacity-40"
            >
              {tb("retry")}
            </button>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined animate-spin text-3xl text-primary">refresh</span>
            <p className="text-body-md text-on-surface-variant">{tb("finishing")}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background">
      <main className="max-w-[720px] mx-auto w-full px-5 py-6 pb-32 flex flex-col gap-3 animate-slide-in">
        <div className="text-center mb-2">
          <span className="material-symbols-outlined icon-fill text-primary" style={{ fontSize: "40px" }}>theater_comedy</span>
          <h1 className="text-headline-sm md:text-headline-md text-on-surface">{tb("finishTitle")}</h1>
          <p className="text-body-md text-on-surface-variant mt-1">{tb("finishDesc")}</p>
        </div>

        {answers.map((a) => {
          const truth = readChoice(a.value);
          if (!truth) return null;
          const selected = picked === a.questionId;
          return (
            <button
              key={a.questionId}
              type="button"
              onClick={() => setPicked(selected ? null : a.questionId)}
              aria-pressed={selected}
              className={`w-full text-left p-4 rounded-[20px] border-2 flex items-center gap-3 transition-colors ${
                selected ? "border-primary bg-primary-container/30" : "border-transparent bg-surface-container-lowest shadow-soft-card"
              }`}
            >
              <span className="flex-1">
                <span className="block text-body-md font-semibold text-on-surface leading-snug">{a.questionText}</span>
                <span className="block text-xs text-on-surface-variant mt-1">{tb("truthLabel", { value: tOpt(truth) })}</span>
                {selected && <span className="block text-xs font-bold text-primary mt-1">{tb("cardPreview", { name, value: tOpt(oppositeChoice(truth)) })}</span>}
              </span>
              <span className={`material-symbols-outlined icon-fill text-2xl ${selected ? "text-primary" : "text-outline-variant"}`}>theater_comedy</span>
            </button>
          );
        })}
        {errorBox}
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-surface via-surface/95 to-transparent pt-8 pb-5 px-5 z-40 flex justify-center">
        <button
          type="button"
          disabled={!picked || sending}
          onClick={() => picked && void send(picked)}
          className="w-full max-w-[720px] h-14 rounded-full bg-primary text-on-primary text-body-lg font-semibold shadow-primary-glow flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className={`material-symbols-outlined text-lg ${sending ? "animate-spin" : ""}`}>{sending ? "refresh" : "theater_comedy"}</span>
          {tb("finishButton")}
        </button>
      </div>
    </div>
  );
}
