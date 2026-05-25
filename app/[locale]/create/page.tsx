"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";

type GameMode = "secret_choice" | "prediction" | "orderline" | "mixed";

const MODE_ICONS: Record<GameMode, string> = {
  secret_choice: "visibility_off",
  prediction: "timeline",
  orderline: "format_list_numbered",
  mixed: "shuffle",
};

export default function CreatePage() {
  const t = useTranslations("create");
  const tErr = useTranslations("error");
  const router = useRouter();
  const locale = useLocale();
  const params = useParams<{ locale: string }>();

  const [displayName, setDisplayName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [gameMode, setGameMode] = useState<GameMode>("secret_choice");
  const [questionCount, setQuestionCount] = useState<5 | 10>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Room limit: free users can only create one room per browser
  const [existingRoom, setExistingRoom] = useState<string | null>(null);
  const [showLimit, setShowLimit] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("gou_my_room");
    if (stored) {
      setExistingRoom(stored);
      setShowLimit(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;

    // Double-check limit before submitting
    const stored = localStorage.getItem("gou_my_room");
    if (stored) {
      setExistingRoom(stored);
      setShowLimit(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          partnerName: partnerName.trim() || null,
          gameMode,
          questionCount,
          locale,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const code = data.error?.code;
        if (code === "RATE_LIMITED") setError(tErr("rateLimited"));
        else setError(data.error?.message ?? tErr("generic"));
        return;
      }

      const { roomCode, participant } = data;
      localStorage.setItem(`gou_token_${roomCode}`, participant.token);
      // Store the created room to enforce the free tier limit
      localStorage.setItem("gou_my_room", roomCode);
      router.push(`/game/room/${roomCode}`);
    } catch {
      setError(tErr("generic"));
    } finally {
      setLoading(false);
    }
  }

  const modes: Array<{ value: GameMode }> = [
    { value: "secret_choice" },
    { value: "prediction" },
    { value: "orderline" },
    { value: "mixed" },
  ];

  // ── Room limit overlay ─────────────────────────────────────────
  if (showLimit && existingRoom) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-background flex items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-tertiary-container/15 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-container/15 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-tertiary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-tertiary-container icon-fill" style={{ fontSize: "40px" }}>workspace_premium</span>
          </div>

          <div className="bg-surface-container-lowest rounded-[28px] p-8 shadow-soft-active border border-outline-variant/20 flex flex-col items-center gap-5">
            <h1 className="text-headline-md text-on-background">{t("limitTitle")}</h1>
            <p className="text-body-md text-on-surface-variant leading-relaxed">{t("limitDesc")}</p>

            <div className="flex flex-col gap-3 w-full">
              {/* Go back to existing game */}
              <button
                onClick={() => router.push(`/game/room/${existingRoom}`)}
                className="w-full flex items-center justify-center gap-2 bg-surface-container text-on-surface text-body-md font-semibold py-4 rounded-full hover:bg-surface-container-high active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
                {t("limitGoBack")}
              </button>

              {/* Upgrade to premium */}
              <button
                onClick={() => router.push(`/#premium`)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-body-md font-semibold py-4 rounded-full hover:bg-surface-tint active:scale-95 transition-all shadow-primary-glow"
              >
                <span className="material-symbols-outlined icon-fill text-xl">star</span>
                {t("limitUpgrade")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background flex">
      {/* ── Desktop side panel ──────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-[300px] shrink-0 border-r border-outline-variant/30 bg-surface-container-low px-12 py-12">
        <div className="mb-10">
          <h2 className="text-headline-lg text-primary mb-2">{t("sideTitle")}</h2>
          <p className="text-body-md text-on-surface-variant">{t("sideSubtitle")}</p>
        </div>
        <ul className="space-y-3">
          {[
            { label: t("sideStep1"), active: true },
            { label: t("sideStep2"), active: false },
            { label: t("sideStep3"), active: false },
          ].map((step) => (
            <li
              key={step.label}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                step.active
                  ? "bg-primary-container/15 text-primary font-semibold border-l-4 border-primary"
                  : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-sm icon-fill">
                {step.active ? "radio_button_checked" : "radio_button_unchecked"}
              </span>
              <span className="text-body-md">{step.label}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-start px-6 md:px-16 py-10 overflow-y-auto">
        <div className="w-full max-w-lg">
          <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-background mb-2">{t("title")}</h1>
          <p className="text-body-md text-on-surface-variant mb-8">{t("subtitle")}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Name fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-label-md text-on-surface-variant">{t("name.label")}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-xl">person</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t("name.placeholder")}
                    maxLength={30}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-surface-container-lowest border-2 border-outline-variant/40 rounded-xl text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-label-md text-on-surface-variant">
                  {t("partner.label")}
                  <span className="text-on-surface-variant/50 font-normal ml-1">({t("partner.optional")})</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-xl">person_add</span>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder={t("partner.placeholder")}
                    maxLength={30}
                    className="w-full pl-11 pr-4 py-3.5 bg-surface-container-lowest border-2 border-outline-variant/40 rounded-xl text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Game mode */}
            <div className="flex flex-col gap-3">
              <label className="text-label-md text-on-surface-variant">{t("mode.label")}</label>
              <div className="grid grid-cols-2 gap-3">
                {modes.map(({ value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGameMode(value)}
                    className={`relative flex items-center gap-3 p-4 rounded-[20px] border-2 text-left transition-all ${
                      gameMode === value
                        ? "border-primary bg-primary-container/10 shadow-soft-card"
                        : "border-outline-variant/30 bg-surface-container-lowest hover:border-outline"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      gameMode === value ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                    }`}>
                      <span className="material-symbols-outlined text-lg">{MODE_ICONS[value]}</span>
                    </div>
                    <div>
                      <span className="block text-label-md text-on-surface">{t(`mode.options.${value}`)}</span>
                      <span className="block text-xs text-on-surface-variant mt-0.5">{t(`mode.descs.${value}`)}</span>
                    </div>
                    {gameMode === value && (
                      <span className="absolute top-3 right-3 material-symbols-outlined text-primary text-base icon-fill">check_circle</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Question count */}
            <div className="flex flex-col gap-3">
              <label className="text-label-md text-on-surface-variant">{t("questions.label")}</label>
              <div className="flex gap-3">
                {([5, 10] as const).map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 text-label-md transition-all ${
                      questionCount === count
                        ? "border-primary bg-primary-container/10 text-primary"
                        : "border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:border-outline"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {count === 5 ? "bolt" : "format_list_bulleted"}
                    </span>
                    {count === 5 ? t("questions.fast") : t("questions.classic")}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-error-container text-error rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-xl">error</span>
                <span className="text-body-md">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !displayName.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-body-lg font-semibold py-4 rounded-full hover:bg-surface-tint disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-primary-glow mt-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-xl">refresh</span>
                  {t("creating")}
                </>
              ) : (
                <>
                  {t("submit")}
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
