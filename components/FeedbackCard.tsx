"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  FEEDBACK_FACES as FACES,
  feedbackKeys,
  readFlag,
  sendFeedback,
  writeFlag,
  type WantsAi,
} from "@/lib/feedback-client";

const AI_OPTIONS: WantsAi[] = ["yes", "maybe", "no"];

interface FeedbackCardProps {
  /** Oda anketi için oda kodu */
  roomCode?: string;
  /** Solo oyun anketi için oturum kimliği (roomCode yerine) */
  soloSessionId?: string;
  participantToken: string;
  /** İlk puan kaydedilince (veya daha önce verilmişse) çağrılır — çıkış istemini bastırmak için */
  onRated?: () => void;
}

/**
 * Sonuç ekranı mini anketi. Yüze dokunur dokunmaz puan kaydedilir (yanıt kaybolmasın),
 * AI ilgisi ve yorum isteğe bağlı olarak aynı kayda eklenir. Hepsi atlanabilir.
 */
export function FeedbackCard({ roomCode, soloSessionId, participantToken, onRated }: FeedbackCardProps) {
  const t = useTranslations("feedback");
  const keys = feedbackKeys(soloSessionId ? `solo_${soloSessionId}` : (roomCode ?? ""));

  const [rating, setRating] = useState<number | null>(null);
  const [wantsAi, setWantsAi] = useState<WantsAi | null>(null);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  // Aynı cihazda tekrar sorma
  useEffect(() => {
    if (readFlag(keys.done)) {
      setDone(true);
      onRated?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.done]);

  const send = (next: { rating: number; wantsAi?: WantsAi | null; comment?: string }) =>
    sendFeedback({ roomCode, soloSessionId, participantToken, ...next });

  async function handleRate(value: number) {
    setRating(value);
    setError(false);
    try {
      await send({ rating: value });
      onRated?.();
    } catch {
      setError(true);
    }
  }

  async function handleSubmit() {
    if (rating === null) return;
    setSaving(true);
    setError(false);
    try {
      await send({ rating, wantsAi, comment });
      writeFlag(keys.done, "done");
      setDone(true);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <section className="bg-surface-container-low rounded-[24px] p-6 text-center border border-outline-variant/20" aria-live="polite">
        <p className="text-body-md text-on-surface-variant">{t("thanks")}</p>
      </section>
    );
  }

  return (
    <section className="bg-surface-container-low rounded-[24px] p-6 border border-outline-variant/20 flex flex-col gap-5">
      <div className="text-center">
        <h3 className="text-headline-md text-on-surface mb-1">{t("title")}</h3>
        <p className="text-label-md text-on-surface-variant">{t("subtitle")}</p>
      </div>

      <div className="flex justify-center gap-2 sm:gap-3" role="radiogroup" aria-label={t("title")}>
        {FACES.map((face, i) => {
          const value = i + 1;
          const selected = rating === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={t(`ratings.${value}`)}
              onClick={() => handleRate(value)}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full text-2xl sm:text-3xl flex items-center justify-center border-2 transition-all active:scale-90 ${
                selected
                  ? "border-primary bg-primary-container/20 scale-110 shadow-soft-card"
                  : rating !== null
                  ? "border-transparent bg-surface opacity-50 hover:opacity-100"
                  : "border-transparent bg-surface hover:border-outline-variant hover:scale-105"
              }`}
            >
              <span aria-hidden="true">{face}</span>
            </button>
          );
        })}
      </div>

      {rating !== null && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <p className="text-label-md text-on-surface-variant text-center">{t("aiQuestion")}</p>
            <div className="flex justify-center gap-2" role="radiogroup" aria-label={t("aiQuestion")}>
              {AI_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={wantsAi === opt}
                  onClick={() => setWantsAi((prev) => (prev === opt ? null : opt))}
                  className={`px-5 py-2 rounded-full border text-label-md transition-all ${
                    wantsAi === opt
                      ? "border-primary bg-primary-container/20 text-primary"
                      : "border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {t(`ai.${opt}`)}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-label-md text-on-surface-variant text-center">{t("commentLabel")}</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={t("commentPlaceholder")}
              className="w-full px-4 py-3 bg-surface-container-lowest border-2 border-outline-variant/40 rounded-xl text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </label>

          {error && (
            <p className="text-label-md text-error text-center" role="alert">
              {t("error")}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="self-center px-8 py-3 bg-primary text-on-primary rounded-full text-label-md font-bold hover:bg-surface-tint disabled:opacity-50 active:scale-95 transition-all"
          >
            {saving ? t("sending") : t("send")}
          </button>
        </div>
      )}
    </section>
  );
}
