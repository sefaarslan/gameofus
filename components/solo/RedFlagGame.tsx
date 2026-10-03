"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  FLAGS,
  FLAG_HEX,
  RED_FLAG_CARD_COUNT,
  computeProfile,
  decodeGrid,
  gridToEmojiText,
  type Flag,
} from "@/lib/solo";
import { FlagGlyph } from "./FlagGlyph";
import { FeedbackCard } from "@/components/FeedbackCard";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { SoloLogo } from "./SoloLogo";

const STORAGE_KEY = "gou_solo_redflag";

interface Scenario {
  id: string;
  text: string;
}
interface Session {
  id: string;
  token: string;
  scenarios: Scenario[];
}
interface Result {
  counts: Record<Flag, number>;
  tolerance: number;
  grid: string;
}
interface SavedGame {
  result: Result;
  /** Kart sırasıyla senaryo metni + seçilen bayrak (karnedeki "Detayları gör" için) */
  details?: { id?: string; text: string; flag: Flag }[];
  sessionId?: string;
  token?: string;
}
type Phase = "intro" | "loading" | "playing" | "submitting" | "result" | "startError" | "submitError";

function readSaved(): SavedGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGame;
    return parsed.result && decodeGrid(parsed.result.grid) ? parsed : null;
  } catch {
    return null;
  }
}

export function RedFlagGame() {
  const t = useTranslations("solo");
  const locale = useLocale();

  const [phase, setPhase] = useState<Phase>("intro");
  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<(Flag | null)[]>(Array(RED_FLAG_CARD_COUNT).fill(null));
  const [openCard, setOpenCard] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState<SavedGame | null>(null);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [justAnswered, setJustAnswered] = useState<number | null>(null);
  const firstFlagBtn = useRef<HTMLButtonElement>(null);

  // Web: yalnızca 1 oyun. Daha önce oynandıysa doğrudan kayıtlı karneyi göster.
  useEffect(() => {
    const savedGame = readSaved();
    if (savedGame) {
      setSaved(savedGame);
      setResult(savedGame.result);
      setAlreadyPlayed(true);
      setPhase("result");
    }
  }, []);

  const answeredCount = answers.filter(Boolean).length;

  const start = useCallback(async () => {
    setPhase("loading");
    try {
      const res = await fetch("/api/solo/red-flag/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      if (!res.ok) throw new Error("start failed");
      const data = await res.json();
      setSession({ id: data.sessionId, token: data.token, scenarios: data.scenarios });
      setAnswers(Array(RED_FLAG_CARD_COUNT).fill(null));
      setPhase("playing");
    } catch {
      setPhase("startError");
    }
  }, [locale]);

  const submit = useCallback(
    async (finalAnswers: (Flag | null)[], s: Session) => {
      setPhase("submitting");
      try {
        const body = { answers: Object.fromEntries(s.scenarios.map((sc, i) => [sc.id, finalAnswers[i]])) };
        const res = await fetch(`/api/solo/${s.id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.token}` },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("complete failed");
        const data = (await res.json()) as Result;
        setResult(data);
        const savedGame: SavedGame = {
          result: data,
          details: s.scenarios.map((sc, i) => ({ id: sc.id, text: sc.text, flag: finalAnswers[i] as Flag })),
          sessionId: s.id,
          token: s.token,
        };
        setSaved(savedGame);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...savedGame, playedAt: new Date().toISOString() }));
        } catch {
          /* localStorage kapalı olabilir */
        }
        setPhase("result");
        window.scrollTo({ top: 0 });
      } catch {
        setPhase("submitError");
      }
    },
    [],
  );

  function choose(flag: Flag) {
    if (openCard === null || !session) return;
    const i = openCard;
    const next = answers.map((a, idx) => (idx === i ? flag : a));
    setAnswers(next);
    setJustAnswered(i);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(12);
    window.setTimeout(() => {
      setOpenCard(null);
      if (next.every(Boolean)) window.setTimeout(() => submit(next, session), 500);
    }, 220);
  }

  // Açık kart: Escape ile kapanır, arka plan kaydırması kilitlenir, odak ilk butona gider
  useEffect(() => {
    if (openCard === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstFlagBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenCard(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [openCard]);

  // ── Giriş ───────────────────────────────────────────────────────────────
  if (phase === "intro" || phase === "loading" || phase === "startError") {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-background flex items-center justify-center px-6 py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-tertiary-container/20 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-container/20 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-label-md">
            {t("badge")}
          </span>
          <h1 className="flex items-center justify-center gap-3 text-headline-lg-mobile md:text-headline-lg text-on-background leading-tight justify-center">
            <SoloLogo className="w-14 h-14 shrink-0 drop-shadow-md" />
            <span className="text-balance text-center max-w-[7.6em]">{t("gameName")}</span>
          </h1>
          <p className="text-body-lg text-on-surface-variant">{t("tagline")}</p>

          <div className="grid grid-cols-3 gap-2.5 w-40" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-primary-container/60 to-primary-container/20 shadow-soft-sm" />
            ))}
          </div>

          <p className="text-body-md text-on-surface-variant">{t("intro")}</p>
          <span className="text-label-md text-on-surface-variant/70">{t("duration")}</span>

          {phase === "startError" && (
            <p className="text-label-md text-error" role="alert">
              {t("error.start")}
            </p>
          )}

          <button
            onClick={start}
            disabled={phase === "loading"}
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-body-lg font-semibold py-4 rounded-full hover:bg-surface-tint disabled:opacity-60 active:scale-95 transition-all shadow-primary-glow"
          >
            {phase === "loading" ? t("starting") : phase === "startError" ? t("error.retry") : t("start")}
          </button>
          <p className="text-xs text-on-surface-variant/70">{t("private")}</p>
        </div>
      </div>
    );
  }

  // ── Karne ───────────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const flags = decodeGrid(result.grid)!;
    const profile = computeProfile(flags);
    // Karnedeki sabit cümle yalnızca Red sayısına (0-9) göre seçilir
    const verdictKey = String(Math.min(profile.counts.red, RED_FLAG_CARD_COUNT));
    const verdictTitle = t(`verdicts.${verdictKey}.title`);
    const verdictLine = t(`verdicts.${verdictKey}.line`);
    // Story kartı: her bayraktan (kart sırasına göre ilk) bir senaryo; eski kayıtlarda id yoksa yalnızca özet
    const picks = (["green", "yellow", "red"] as Flag[]).flatMap((f) => {
      const d = saved?.details?.find((x) => x.flag === f && x.id);
      return d ? [`${f.charAt(0).toUpperCase()}${d.id}`] : [];
    });
    const cardUrl = `/api/solo/red-flag/card?g=${result.grid}&l=${locale}${picks.length ? `&q=${picks.join(",")}` : ""}`;

    const shareLink = () => `${window.location.origin}/${locale}/solo/red-flag?s=${result.grid}`;

    async function handleStory() {
      setShareBusy(true);
      try {
        const blob = await (await fetch(cardUrl)).blob();
        const file = new File([blob], "red-flag-minefield.png", { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], text: `${t("share.text", { title: verdictTitle })} ${shareLink()}` });
        } else {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "red-flag-minefield.png";
          a.click();
          URL.revokeObjectURL(a.href);
        }
      } catch {
        /* kullanıcı paylaşımı iptal etmiş olabilir */
      } finally {
        setShareBusy(false);
      }
    }

    function handleWhatsApp() {
      const text = `${t("share.text", { title: verdictTitle })}\n\n${gridToEmojiText(flags)}\n\n${shareLink()}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    }

    return (
      <div className="min-h-[calc(100vh-73px)] bg-background px-6 py-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-tertiary-container/20 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="w-full max-w-md mx-auto flex flex-col gap-6">
          {alreadyPlayed && (
            <div className="bg-surface-container text-on-surface-variant text-label-md rounded-xl px-4 py-3 text-center">{t("played")}</div>
          )}

          <div className="text-center">
            <span className="inline-flex items-center gap-2 text-label-md text-primary uppercase tracking-wider">
              <SoloLogo className="w-8 h-8 shrink-0" />
              {t("gameName")}
            </span>
            <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-background mt-2 leading-tight text-balance">{verdictTitle}</h1>
            <p className="text-body-md text-on-surface-variant mt-3">{verdictLine}</p>
          </div>

          <div className="bg-surface-container-lowest rounded-[28px] p-6 shadow-soft-card border border-outline-variant/20 flex flex-col items-center gap-5">
            <div className="grid grid-cols-3 gap-2.5 w-48" role="img" aria-label={t("result.gridLabel")}>
              {flags.map((f, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl flex items-center justify-center text-white shadow-soft-sm"
                  style={{ background: FLAG_HEX[f] }}
                >
                  <FlagGlyph flag={f} className="w-7 h-7" />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6">
              {FLAGS.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ background: FLAG_HEX[f] }} aria-hidden="true" />
                  <span className="text-headline-md font-bold text-on-background">{profile.counts[f]}</span>
                  <span className="sr-only">{t(`flags.${f}.label`)}</span>
                </div>
              ))}
            </div>

            <div className="w-full">
              <div className="flex justify-between text-label-md text-on-surface-variant mb-2">
                <span>{t("result.tolerance")}</span>
                <span className="font-bold text-on-background">%{profile.tolerance}</span>
              </div>
              <div className="h-3 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(profile.tolerance, 3)}%`,
                    background: `linear-gradient(90deg, ${FLAG_HEX.red}, ${FLAG_HEX.yellow}, ${FLAG_HEX.green})`,
                  }}
                />
              </div>
              <p className="text-xs text-on-surface-variant/70 mt-3 text-center">{t("result.toleranceNote")}</p>
            </div>
          </div>

          {/* Paylaş */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleStory}
              disabled={shareBusy}
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-label-md font-bold py-4 rounded-full hover:bg-surface-tint disabled:opacity-60 active:scale-95 transition-all shadow-primary-glow"
            >
              <span className="material-symbols-outlined text-xl">share</span>
              {shareBusy ? t("share.storyBusy") : t("share.story")}
            </button>
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white text-label-md font-bold py-3.5 rounded-full active:scale-95 transition-all shadow-soft-sm"
            >
              <WhatsAppIcon />
              {t("share.whatsapp")}
            </button>
          </div>

          {/* Cevaplarına göz at: iki kişilik sonuç ekranındaki "Detayları gör" ile aynı dil */}
          {saved?.details && saved.details.length === RED_FLAG_CARD_COUNT && (
            <>
              <section className="bg-surface-container-high rounded-[24px] p-6 text-center shadow-soft-card relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 pointer-events-none" />
                <span className="material-symbols-outlined text-primary icon-fill mb-3" style={{ fontSize: "40px" }}>fact_check</span>
                <h3 className="text-headline-md text-on-surface mb-2">{t("details.title")}</h3>
                <p className="text-body-md text-on-surface-variant mb-4">{t("details.desc")}</p>
                <button
                  onClick={() => setShowDetails((v) => !v)}
                  aria-expanded={showDetails}
                  className="px-6 py-2 bg-surface text-primary rounded-full text-label-md font-bold shadow-sm hover:bg-surface-container-lowest active:scale-95 transition-all"
                >
                  {showDetails ? t("details.hide") : t("details.show")}
                </button>
              </section>

              {showDetails && (
                <section className="flex flex-col gap-4" aria-label={t("details.title")}>
                  {saved.details.map((d, i) => (
                    <article key={i} className="bg-surface-container-lowest rounded-xl shadow-soft-card relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1" style={{ background: FLAG_HEX[d.flag] }} />
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <span className="inline-flex items-center gap-1.5 bg-surface-container-high px-3 py-1 rounded-full">
                            <span className="w-2 h-2 rounded-full" style={{ background: FLAG_HEX[d.flag] }} />
                            <span className="text-label-md text-on-surface-variant">{t(`flags.${d.flag}.label`)}</span>
                          </span>
                          <span className="text-label-md text-on-surface-variant">{t("cardTitle", { n: i + 1 })}</span>
                        </div>
                        <h4 className="text-body-lg text-on-background leading-snug mb-4">{d.text}</h4>
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: FLAG_HEX[d.flag] }}>
                            <FlagGlyph flag={d.flag} className="w-5 h-5" />
                          </span>
                          <div className="leading-tight">
                            <p className="text-xs text-on-surface-variant">{t("details.yourPick")}</p>
                            <p className="text-label-md font-bold text-on-background">
                              {t(`flags.${d.flag}.label`)} <span className="font-normal text-on-surface-variant">· {t(`flags.${d.flag}.hint`)}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              )}
            </>
          )}

          {/* AI analizi: webde pasif */}
          <button
            disabled
            aria-disabled="true"
            className="w-full flex items-center justify-between gap-3 bg-surface-container text-on-surface-variant/60 rounded-2xl px-5 py-4 cursor-not-allowed"
          >
            <span className="flex items-center gap-2 text-label-md font-semibold text-left">
              <span className="material-symbols-outlined text-xl">auto_awesome</span>
              {t("ai.button")}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold shrink-0">
              <span className="material-symbols-outlined text-base icon-fill">lock</span>
              {t("ai.locked")}
            </span>
          </button>

          {/* Geri bildirim */}
          {saved?.sessionId && saved.token && <FeedbackCard soloSessionId={saved.sessionId} participantToken={saved.token} />}

          {/* Mobil CTA */}
          <div className="bg-gradient-to-br from-tertiary-container/40 to-primary-container/20 rounded-[24px] p-6 text-center border border-outline-variant/20">
            <span className="material-symbols-outlined text-primary icon-fill mb-2" style={{ fontSize: "36px" }}>smartphone</span>
            <h2 className="text-headline-md text-on-background mb-1">{t("mobile.title")}</h2>
            <p className="text-body-md text-on-surface-variant mb-3">{t("mobile.desc")}</p>
            <span className="inline-block px-3 py-1 bg-surface text-label-md text-on-surface-variant rounded-full">{t("mobile.soon")}</span>
          </div>

          {/* Sayfanın en sonu */}
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-surface-container-high text-primary text-label-md font-bold py-4 rounded-full hover:bg-surface-container-highest active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-xl">home</span>
            {t("backHome")}
          </Link>

        </div>
      </div>
    );
  }

  // ── Oyun ────────────────────────────────────────────────────────────────
  const scenarios = session?.scenarios ?? [];
  const open = openCard !== null ? scenarios[openCard] : null;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background px-6 py-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-tertiary-container/20 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="w-full max-w-md mx-auto flex flex-col gap-6">
        {/* İlerleme */}
        <div className="flex flex-col gap-3" aria-live="polite">
          <div className="flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-label-md text-primary uppercase tracking-wider">
              <SoloLogo className="w-7 h-7 shrink-0" />
              {t("gameName")}
            </h1>
            <span className="text-label-md text-on-surface-variant" aria-label={t("progressLabel", { done: answeredCount, total: RED_FLAG_CARD_COUNT })}>
              {t("progress", { done: answeredCount, total: RED_FLAG_CARD_COUNT })}
            </span>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {answers.map((a, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full bg-surface-container-high overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: a ? "100%" : "0%", background: a ? FLAG_HEX[a] : undefined }} />
              </div>
            ))}
          </div>
        </div>

        {/* 3x3 grid */}
        <div className="grid grid-cols-3 gap-3">
          {scenarios.map((sc, i) => {
            const flag = answers[i];
            return flag ? (
              <div
                key={sc.id}
                className={`aspect-square rounded-2xl flex items-center justify-center text-white shadow-soft-card ${justAnswered === i ? "animate-solo-pop" : ""}`}
                style={{ background: FLAG_HEX[flag] }}
                role="img"
                aria-label={t("cardDone", { n: i + 1, flag: t(`flags.${flag}.label`) })}
              >
                <FlagGlyph flag={flag} className="w-10 h-10" />
              </div>
            ) : (
              <button
                key={sc.id}
                onClick={() => setOpenCard(i)}
                aria-label={t("cardClosed", { n: i + 1 })}
                className="aspect-square rounded-2xl relative overflow-hidden bg-gradient-to-br from-primary-container/70 via-primary-container/40 to-secondary-container/60 shadow-soft-card border border-white/60 active:scale-[0.96] hover:-translate-y-0.5 transition-all flex flex-col items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-primary/25" style={{ fontSize: "44px" }} aria-hidden="true">chat_bubble</span>
                <span className="absolute bottom-2 text-headline-md font-bold text-primary/80">{i + 1}</span>
              </button>
            );
          })}
        </div>

        {phase === "submitting" && (
          <p className="text-center text-label-md text-on-surface-variant animate-pulse" role="status">{t("starting")}</p>
        )}
        {phase === "submitError" && (
          <div className="text-center flex flex-col items-center gap-3" role="alert">
            <p className="text-label-md text-error">{t("error.complete")}</p>
            <button
              onClick={() => session && submit(answers, session)}
              className="px-6 py-3 bg-primary text-on-primary rounded-full text-label-md font-bold active:scale-95 transition-all"
            >
              {t("error.retry")}
            </button>
          </div>
        )}
      </div>

      {/* Açık kart */}
      {open && openCard !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-scrim/50 backdrop-blur-sm" onClick={() => setOpenCard(null)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("cardTitle", { n: openCard + 1 })}
            className="relative w-full max-w-sm bg-surface-container-lowest rounded-[28px] p-6 shadow-soft-active animate-solo-flip"
          >
            <button
              onClick={() => setOpenCard(null)}
              aria-label={t("close")}
              className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <p className="text-label-md text-primary text-center uppercase tracking-wider mb-4">{t("cardTitle", { n: openCard + 1 })}</p>
            <p className="text-headline-md text-on-background text-center leading-snug mb-6">{open.text}</p>
            <p className="text-label-md text-on-surface-variant text-center mb-3">{t("pickPrompt")}</p>
            <div className="flex flex-col gap-3">
              {FLAGS.map((f, idx) => (
                <button
                  key={f}
                  ref={idx === 0 ? firstFlagBtn : undefined}
                  onClick={() => choose(f)}
                  className="w-full min-h-14 rounded-2xl px-4 py-3 flex items-center gap-3 text-white text-left active:scale-[0.97] transition-transform shadow-soft-sm"
                  style={{ background: FLAG_HEX[f] }}
                >
                  <span className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                    <FlagGlyph flag={f} className="w-6 h-6" />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-body-md font-bold">{t(`flags.${f}.label`)}</span>
                    <span className="text-xs opacity-90">{t(`flags.${f}.hint`)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
