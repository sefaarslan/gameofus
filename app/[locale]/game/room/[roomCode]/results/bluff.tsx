"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { BluffCall, BluffTitle, Choice } from "@/lib/bluff";
import { CHOICE_STYLES } from "../_screens/bluff";

// Blöf modunun sonuç ekranı parçaları: blöf avı → cümle cümle açılış → karne ve döküm. Puan ve unvanlar sunucudan gelir.

export interface BluffCallItem {
  questionId: string;
  questionText: string;
  shownAnswer: { value: Choice | null };
  myPrediction: unknown;
}

export interface BluffQuestion {
  myShownAnswer: { value: Choice | null } | null;
  myLie: boolean;
  partnerCall: BluffCall | null;
  partnerShownAnswer: { value: Choice | null } | null;
  partnerLie: boolean;
  myCall: BluffCall | null;
}

interface PlayerSummary {
  callsDone: boolean;
  caught: number | null;
  total: number | null;
  falseAlarms: number | null;
  lies: number;
  fooled: number | null;
  titles: BluffTitle[];
}

export interface BluffSummaryData {
  phase: "reveal";
  me: PlayerSummary;
  partner: PlayerSummary;
}

export interface BluffRow {
  questionId: string;
  questionText: string;
  /** Karşı oyuncunun gerçek cevabı */
  partnerAnswer: unknown;
  bluff: BluffQuestion;
}

const TITLE_ICONS: Record<BluffTitle, string> = {
  lie_detector: "search",
  poker_face: "sentiment_neutral",
  too_skeptical: "visibility",
  pure_heart: "favorite",
};

const choiceOf = (v: unknown): Choice | null => (v as { value?: Choice } | null)?.value ?? null;

function AnswerChip({ value }: { value: Choice | null }) {
  const t = useTranslations("option");
  if (!value) return <span>—</span>;
  const style = CHOICE_STYLES[value];
  return <span className={`inline-flex items-center rounded-full border-2 px-3 py-0.5 text-label-md font-bold ${style.border} ${style.pred} ${style.text}`}>{t(value)}</span>;
}

// ── Blöf avı ─────────────────────────────────────────────────────
export function BluffCallScreen({
  roomCode,
  participantToken,
  items,
  rights,
  partnerName,
  onDone,
}: {
  roomCode: string;
  participantToken: string;
  items: BluffCallItem[];
  /** "Blöf!" hakkı: en az 1, en çok bu kadar cevap işaretlenir */
  rights: number;
  partnerName: string;
  onDone: () => Promise<void>;
}) {
  const t = useTranslations("results.bluff");
  const tOpt = useTranslations("option");
  const tErr = useTranslations("error");
  const [suspects, setSuspects] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const left = Math.max(0, rights - suspects.length);
  const toggle = (id: string) =>
    setSuspects((list) => (list.includes(id) ? list.filter((x) => x !== id) : list.length < rights ? [...list, id] : list));

  async function submit() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/bluff-calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantToken, suspects }),
      });
      const data = await res.json().catch(() => null);
      // Başka sekmede zaten gönderilmişse de açılışa geçilir
      if (!res.ok && data?.error?.code !== "ALREADY_SUBMITTED") {
        setError(data?.error?.message ?? tErr("generic"));
        return;
      }
      await onDone();
    } catch {
      setError(tErr("connection"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background">
      <main className="max-w-[720px] mx-auto w-full px-5 py-6 pb-36 flex flex-col gap-3">
        <header className="text-center mb-2">
          <span className="material-symbols-outlined icon-fill text-primary" style={{ fontSize: "40px" }}>theater_comedy</span>
          <h1 className="text-headline-md text-on-surface">{t("callTitle")}</h1>
          <p className="text-body-md text-on-surface-variant mt-1">{t("callSubtitle", { name: partnerName, count: rights })}</p>
        </header>

        {items.map((item) => {
          const guess = choiceOf(item.myPrediction);
          const selected = suspects.includes(item.questionId);
          const locked = !selected && left === 0;
          return (
            <article
              key={item.questionId}
              className={`rounded-[24px] bg-surface-container-lowest p-4 shadow-soft-card border-2 transition-colors ${selected ? "border-primary" : "border-transparent"}`}
            >
              <h2 className="text-body-lg font-semibold text-on-surface leading-snug mb-3">{item.questionText}</h2>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-label-md text-on-surface-variant">{t("says", { name: partnerName })}</span>
                <AnswerChip value={item.shownAnswer.value} />
              </div>
              {guess && <p className="text-xs text-on-surface-variant mb-3">{t("yourGuess", { value: tOpt(guess) })}</p>}
              <button
                // Anahtar değişince düğme "çevrilir"
                key={selected ? "on" : "off"}
                type="button"
                aria-pressed={selected}
                aria-label={`${t("accuse")}: ${item.questionText}`}
                disabled={locked}
                onClick={() => toggle(item.questionId)}
                className={`w-full min-h-[48px] rounded-2xl border-2 text-body-md font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                  selected ? "bluff-flip border-primary bg-primary text-on-primary" : "border-dashed border-primary/60 bg-surface-container-lowest text-primary"
                }`}
              >
                <span className="material-symbols-outlined icon-fill text-lg">theater_comedy</span>
                {selected ? t("accused") : t("accuse")}
              </button>
            </article>
          );
        })}

        {error && (
          <div role="alert" className="flex items-center gap-3 bg-error-container text-error rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-xl">error</span>
            <span className="text-body-md">{error}</span>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-surface via-surface/95 to-transparent pt-8 pb-5 px-5 z-40 flex justify-center">
        <div className="w-full max-w-[720px]">
          <button
            type="button"
            onClick={submit}
            disabled={suspects.length === 0 || sending}
            className="w-full h-14 rounded-full bg-primary text-on-primary text-body-lg font-semibold shadow-primary-glow flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending && <span className="material-symbols-outlined animate-spin text-xl">refresh</span>}
            {sending ? t("sending") : t("submit")}
          </button>
          <p className="mt-2 text-center text-xs font-semibold text-on-surface-variant" aria-live="polite">
            {suspects.length === 0 ? t("pickOne", { count: rights }) : t("rightsLeft", { count: left })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Tek cevabın açılışı ──────────────────────────────────────────
export function BluffRevealCard({
  row,
  partnerName,
  revealed = true,
  animate = false,
}: {
  row: BluffRow;
  partnerName: string;
  /** false: karar damgası henüz açılmadı (soru soru açılışta kısa bekleyiş) */
  revealed?: boolean;
  animate?: boolean;
}) {
  const t = useTranslations("results.bluff");
  const tOpt = useTranslations("option");
  const b = row.bluff;
  const caughtIt = b.partnerLie === (b.myCall === "bluff");
  const verdict = b.partnerLie ? (b.myCall === "bluff" ? "caughtLie" : "fooledByLie") : b.myCall === "bluff" ? "truthDoubted" : "truthBelieved";
  const truth = choiceOf(row.partnerAnswer);

  return (
    <article className="rounded-[24px] bg-surface-container-lowest shadow-soft-card overflow-hidden">
      <div className="p-4">
        <h3 className="text-body-lg font-semibold text-on-surface leading-snug mb-3">{row.questionText}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-label-md text-on-surface-variant">{t("says", { name: partnerName })}</span>
          <AnswerChip value={b.partnerShownAnswer?.value ?? null} />
          {b.myCall && <span className="text-label-md text-on-surface-variant">· {t(b.myCall === "bluff" ? "youDoubted" : "youBelieved")}</span>}
        </div>
      </div>
      {b.myCall && !revealed && (
        <div className="flex items-center justify-center gap-2 px-4 py-4 bg-surface-container" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      )}
      {b.myCall && revealed && (
        <div
          className={`flex items-start gap-2.5 px-4 py-3 ${caughtIt ? "bg-[#43a047]/15 text-[#1b5e20]" : "bg-primary-container/40 text-[#8c1f24]"} ${
            animate ? (caughtIt ? "bluff-stamp" : "bluff-shake") : ""
          }`}
        >
          <span className="material-symbols-outlined icon-fill text-xl">{caughtIt ? "check_circle" : "theater_comedy"}</span>
          <p className="text-body-md font-bold">
            {t(verdict)}
            {b.partnerLie && truth && <span className="block text-xs font-semibold opacity-80">{t("truthWas", { value: tOpt(truth) })}</span>}
          </p>
        </div>
      )}
      <div className={`flex flex-col gap-0.5 border-t border-outline-variant/30 px-4 py-3 text-xs text-on-surface-variant ${revealed ? "" : "invisible"}`}>
        <span>
          {b.myShownAnswer?.value ? t(b.myLie ? "yourLie" : "yourTruth", { value: tOpt(b.myShownAnswer.value) }) : "—"}
        </span>
        <span>
          {b.partnerCall
            ? t(b.partnerCall === "bluff" ? "partnerDoubted" : "partnerBelieved", { name: partnerName })
            : t("partnerPending", { name: partnerName })}
        </span>
      </div>
    </article>
  );
}

// ── Soru soru açılış + final (kararlar gönderilir gönderilmez) ───
const SUSPENSE_MS = 1100;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** İz rengi: yeşil = yalanı yakaladın, kırmızı = yanıldın (kaçan yalan ya da boşa "Blöf!"), koyu = doğruya inandın. */
const trailColor = (row: BluffRow) => {
  const accused = row.bluff.myCall === "bluff";
  if (row.bluff.partnerLie !== accused) return "bg-primary";
  return accused ? "bg-[#43a047]" : "bg-on-surface-variant";
};

/**
 * Önce her soru tek tek açılır (cevap + kendi kararın, kısa bekleyiş, sonuç damgası). Toplam puan ve unvanlar bu sırada gizlidir;
 * hepsi sondaki finalde tek anda patlar.
 */
export function BluffStepReveal({
  rows,
  summary,
  partnerName,
  onFinish,
}: {
  rows: BluffRow[];
  summary: BluffSummaryData;
  partnerName: string;
  onFinish: () => void;
}) {
  const t = useTranslations("results.bluff");
  const [index, setIndex] = useState(0);
  const [openedIndex, setOpenedIndex] = useState(-1);
  const finale = index >= rows.length;
  const opened = openedIndex === index;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [finale]);

  useEffect(() => {
    if (finale) return;
    const timer = setTimeout(() => setOpenedIndex(index), reducedMotion() ? 0 : SUSPENSE_MS);
    return () => clearTimeout(timer);
  }, [index, finale]);

  if (finale) return <BluffFinale summary={summary} partnerName={partnerName} onDone={onFinish} />;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background flex flex-col">
      <main className="flex-1 max-w-[720px] mx-auto w-full px-5 py-8 pb-36 flex flex-col justify-center gap-4">
        <p className="text-center text-label-md uppercase tracking-wider text-on-surface-variant">
          {t("revealStep", { current: index + 1, total: rows.length })}
        </p>
        {/* Açılan soruların izi */}
        <div className="flex justify-center gap-1.5" aria-hidden="true">
          {rows.map((row, i) => (
            <span
              key={row.questionId}
              className={`h-2 rounded-full transition-all duration-500 ${i === index ? "w-6" : "w-2"} ${
                i < index || (i === index && opened) ? trailColor(row) : "bg-outline-variant"
              }`}
            />
          ))}
        </div>
        <div key={index} className="animate-slide-in" aria-live="polite">
          <BluffRevealCard row={rows[index]} partnerName={partnerName} revealed={opened} animate />
        </div>
      </main>
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-surface via-surface/95 to-transparent pt-8 pb-4 px-5 z-40 flex justify-center">
        <div className="w-full max-w-[720px] flex flex-col gap-1">
          <button
            type="button"
            disabled={!opened}
            onClick={() => setIndex((i) => i + 1)}
            className="w-full h-14 rounded-full bg-primary text-on-primary text-body-lg font-semibold shadow-primary-glow active:scale-95 transition-opacity disabled:opacity-40"
          >
            {index === rows.length - 1 ? t("toFinale") : t("next")}
          </button>
          <button type="button" onClick={() => setIndex(rows.length)} className="py-2 text-label-md text-on-surface-variant">
            {t("skip")}
          </button>
        </div>
      </div>
    </div>
  );
}

const CONFETTI_COLORS = ["#ae2f34", "#caa800", "#43a047", "#fb8c00", "#ff8a8f"];

/** Konfeti parçaları: konumlar sıraya göre sabit (rastgelelik yok), yalnızca CSS animasyonu. */
function Confetti() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/3" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => {
        const angle = (i / 28) * Math.PI * 2;
        const distance = 110 + (i % 4) * 38;
        return (
          <span
            key={i}
            className="bluff-confetti absolute block w-2 h-3 rounded-[2px]"
            style={
              {
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDelay: `${(i % 5) * 30}ms`,
                "--x": `${Math.round(Math.cos(angle) * distance)}px`,
                "--y": `${Math.round(Math.sin(angle) * distance)}px`,
                "--r": `${(i * 67) % 360}deg`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

/** Sondaki tek büyük an: yakalanan yalanlar, kandırma puanı ve unvanlar art arda patlar. */
function BluffFinale({ summary, partnerName, onDone }: { summary: BluffSummaryData; partnerName: string; onDone: () => void }) {
  const t = useTranslations("results.bluff");
  const { me } = summary;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background relative overflow-hidden flex flex-col">
      <Confetti />
      <main className="relative flex-1 max-w-[420px] mx-auto w-full px-5 py-8 pb-32 flex flex-col items-center justify-center gap-4 text-center">
        <h1 className="bluff-pop text-headline-md text-on-surface">{t("finaleTitle")}</h1>
        <div className="bluff-burst w-44 h-44 rounded-full bg-primary text-on-primary shadow-primary-glow flex flex-col items-center justify-center">
          <span className="text-headline-xl leading-none">
            {me.caught}/{me.total}
          </span>
          <span className="text-label-md mt-1 px-3">{t("caughtDesc")}</span>
        </div>
        <p className="bluff-pop text-body-lg font-bold text-on-surface" style={{ animationDelay: "500ms" }}>
          {me.fooled === null
            ? t("partnerPending", { name: partnerName })
            : t("finaleFooled", { name: partnerName, count: me.fooled, lies: me.lies })}
        </p>
        <p className="bluff-pop text-body-md text-on-surface-variant" style={{ animationDelay: "650ms" }}>
          {t("falseAlarms", { count: me.falseAlarms ?? 0 })}
        </p>
        {me.titles.length > 0 && (
          <div className="w-full text-left">
            <Titles titles={me.titles} delayFrom={850} />
          </div>
        )}
      </main>
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-surface via-surface/95 to-transparent pt-8 pb-5 px-5 z-40 flex justify-center">
        <button
          type="button"
          onClick={onDone}
          className="w-full max-w-[720px] h-14 rounded-full bg-on-surface text-surface text-body-lg font-semibold active:scale-95"
        >
          {t("seeResults")}
        </button>
      </div>
    </div>
  );
}

// ── Blöf karnesi ─────────────────────────────────────────────────
function Titles({ titles, delayFrom }: { titles: BluffTitle[]; delayFrom?: number }) {
  const t = useTranslations("results.bluff.titles");
  return (
    <ul className="flex flex-col gap-2">
      {titles.map((title) => (
        <li
          key={title}
          className={`flex items-center gap-3 rounded-2xl bg-tertiary-container/30 px-3 py-2.5 ${delayFrom === undefined ? "" : "bluff-pop"}`}
          style={delayFrom === undefined ? undefined : { animationDelay: `${delayFrom + titles.indexOf(title) * 250}ms` }}
        >
          <span className="material-symbols-outlined icon-fill text-[#6b5900]">{TITLE_ICONS[title]}</span>
          <span>
            <span className="block text-body-md font-bold text-on-surface">{t(`${title}.name`)}</span>
            <span className="block text-xs text-on-surface-variant">{t(`${title}.desc`)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function BluffSummary({ summary, myName, partnerName }: { summary: BluffSummaryData; myName: string; partnerName: string }) {
  const t = useTranslations("results.bluff");
  const { me, partner } = summary;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-headline-md text-on-background text-center">{t("summaryTitle")}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest rounded-[24px] p-5 shadow-soft-card">
          <p className="text-label-md text-on-surface-variant">{t("caughtLabel")}</p>
          <p className="text-headline-lg-mobile text-primary my-1">
            {me.caught}/{me.total}
          </p>
          <p className="text-xs text-on-surface-variant">{t("caughtDesc")}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-[24px] p-5 shadow-soft-card">
          <p className="text-label-md text-on-surface-variant">{t("fooledLabel")}</p>
          <p className="text-headline-lg-mobile text-primary my-1">{me.fooled === null ? "…" : `${me.fooled}/${me.lies}`}</p>
          <p className="text-xs text-on-surface-variant">
            {me.fooled === null ? t("partnerPending", { name: partnerName }) : t("fooledDesc", { name: partnerName })}
          </p>
        </div>
      </div>

      {partner.callsDone && (
        <p className="text-center text-body-md text-on-surface-variant">
          {t("partnerRow", { name: partnerName, caught: partner.caught ?? 0, total: partner.total ?? 0, count: partner.fooled ?? 0 })}
        </p>
      )}

      {me.titles.length > 0 && (
        <div>
          <h3 className="text-label-md text-on-surface-variant mb-2">{myName}</h3>
          <Titles titles={me.titles} />
        </div>
      )}
      {partner.titles.length > 0 && (
        <div>
          <h3 className="text-label-md text-on-surface-variant mb-2">{partnerName}</h3>
          <Titles titles={partner.titles} />
        </div>
      )}
    </section>
  );
}
