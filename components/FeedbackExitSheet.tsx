"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FEEDBACK_FACES, feedbackKeys, sendFeedback, writeFlag } from "@/lib/feedback-client";

interface FeedbackExitSheetProps {
  open: boolean;
  roomCode: string;
  participantToken: string;
  /** Puan kaydedildiğinde çağrılır */
  onRated: () => void;
  /** Kullanıcı gitmek istediği yere devam etsin (teşekkür sonrası, "Şimdi değil", arka plan veya Escape) */
  onFinish: () => void;
}

const THANKS_DELAY_MS = 900;

/**
 * Çıkış istemi: puan vermeden "Tekrar oyna" / "Ana Sayfa"ya basan kullanıcıya bir kez gösterilir.
 * Mobilde alttan açılan sheet, masaüstünde ortalı kart. Hiçbir şekilde zorlamaz — her çıkış yolu devam ettirir.
 */
export function FeedbackExitSheet({ open, roomCode, participantToken, onRated, onFinish }: FeedbackExitSheetProps) {
  const t = useTranslations("feedback");
  const [shown, setShown] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  };

  // Açılış animasyonu + arka plan kaydırmasını kilitle + Escape
  useEffect(() => {
    if (!open) {
      setShown(false);
      setPicked(null);
      finishedRef.current = false;
      return;
    }
    const raf = requestAnimationFrame(() => setShown(true));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handlePick(value: number) {
    if (picked !== null) return;
    setPicked(value);
    try {
      await sendFeedback({ roomCode, participantToken, rating: value });
      writeFlag(feedbackKeys(roomCode).done, "done");
      onRated();
    } catch {
      /* Kayıt başarısız olsa da kullanıcıyı bekletmeyiz */
    }
    window.setTimeout(finish, THANKS_DELAY_MS);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      {/* Arka plan */}
      <div
        className={`absolute inset-0 bg-scrim/50 backdrop-blur-sm transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`}
        onClick={finish}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-exit-title"
        tabIndex={-1}
        className={`relative w-full md:max-w-sm bg-surface-container-lowest rounded-t-[28px] md:rounded-[28px] shadow-soft-active px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pb-8 md:pt-8 outline-none transition-all duration-300 ease-out ${
          shown ? "translate-y-0 opacity-100" : "translate-y-full md:translate-y-4 opacity-0 md:opacity-0"
        }`}
      >
        {/* Tutma çubuğu (yalnızca mobil sheet) */}
        <div className="w-10 h-1 rounded-full bg-outline-variant/60 mx-auto mb-5 md:hidden" aria-hidden="true" />

        {picked === null ? (
          <div className="flex flex-col items-center text-center gap-5">
            <div>
              <h2 id="feedback-exit-title" className="text-headline-md text-on-surface mb-1 text-balance">
                {t("exitTitle")}
              </h2>
              <p className="text-body-md text-on-surface-variant">{t("title")}</p>
            </div>

            <div className="grid grid-cols-5 gap-2 w-full" role="group" aria-label={t("title")}>
              {FEEDBACK_FACES.map((face, i) => (
                <button
                  key={face}
                  type="button"
                  onClick={() => handlePick(i + 1)}
                  aria-label={t(`ratings.${i + 1}`)}
                  className="h-14 rounded-2xl bg-surface-container text-3xl flex items-center justify-center active:scale-90 hover:bg-primary-container/20 transition-all"
                >
                  <span aria-hidden="true">{face}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={finish}
              className="w-full h-12 rounded-full text-label-md text-on-surface-variant hover:bg-surface-container active:scale-[0.98] transition-all"
            >
              {t("notNow")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-3 py-6" aria-live="polite" id="feedback-exit-title">
            <span className="text-5xl" aria-hidden="true">
              {FEEDBACK_FACES[picked - 1]}
            </span>
            <p className="text-body-lg text-on-surface">{t("thanks")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
