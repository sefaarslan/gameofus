"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface ShareScreenProps {
  roomCode: string;
  roomLocale: string;
  partnerJoined: boolean;
  partnerName?: string;
  myName?: string;
  onStartPlaying: () => void;
}

const WhatsAppIcon = () => (
  <svg aria-hidden="true" className="w-5 h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

export function ShareScreen({ roomCode, roomLocale, partnerJoined, partnerName, myName, onStartPlaying }: ShareScreenProps) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${roomLocale}/game/room/${roomCode}`
      : `/${roomLocale}/game/room/${roomCode}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silently
    }
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(`${t("whatsappText")} ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  const myInitial = myName ? myName[0].toUpperCase() : "S";
  const partnerInitial = partnerName ? partnerName[0].toUpperCase() : null;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background relative overflow-x-hidden">
      {/* Ambient blobs */}
      <div className="fixed -top-[20%] -right-[20%] w-[70vw] h-[70vw] rounded-full bg-primary/5 blur-[80px] pointer-events-none -z-10" />
      <div className="fixed -bottom-[20%] -left-[20%] w-[60vw] h-[60vw] rounded-full bg-tertiary-fixed/20 blur-[80px] pointer-events-none -z-10" />

      {/* ── Mobile layout ───────────────────────────────────────────── */}
      <div className="md:hidden flex flex-col items-center px-6 pt-12 pb-40 max-w-[480px] mx-auto">
        {/* Header */}
        <div className="w-full text-center mb-8 flex flex-col items-center">
          <div className="relative w-20 h-20 mb-4 flex items-center justify-center bg-inverse-on-surface rounded-full shadow-soft-card">
            <span className="material-symbols-outlined text-primary icon-fill" style={{ fontSize: "40px" }}>celebration</span>
            {/* Confetti dots */}
            <span className="absolute -top-2.5 left-2.5 w-2 h-2 rounded-full bg-primary-container animate-float-up" style={{ animationDelay: "0s" }} />
            <span className="absolute top-5 -right-4 w-3 h-3 rounded-full bg-tertiary-fixed animate-float-up" style={{ animationDelay: "0.5s" }} />
            <span className="absolute -bottom-1 -left-2.5 w-2 h-2 rounded-full bg-[#34D399] animate-float-up" style={{ animationDelay: "1.2s" }} />
          </div>
          <h1 className="text-headline-lg-mobile text-on-background mb-2">{t("title")}</h1>
          <p className="text-body-md text-on-surface-variant max-w-[280px]">{t("subtitle")}</p>
        </div>

        {/* Card */}
        <div className="w-full bg-surface-container-lowest rounded-[24px] p-8 shadow-soft-card border border-outline-variant/20 flex flex-col gap-6 mb-6">
          {/* Status badge */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${partnerJoined ? "bg-[#34D399]" : "bg-primary-container animate-soft-pulse"}`} />
              <span className="text-label-md text-on-surface-variant">
                {partnerJoined ? t("joined") : t("waiting")}
              </span>
            </div>
          </div>

          <hr className="border-outline-variant/30" />

          {/* Link section */}
          <div className="flex flex-col gap-3">
            <label className="text-label-md text-on-surface">{t("link")}</label>
            <div className="flex items-center bg-surface-container rounded-[16px] p-1 pl-4">
              <span className="flex-1 text-body-md text-on-surface truncate min-w-0 font-mono text-sm">{shareUrl}</span>
              <button
                onClick={handleCopy}
                aria-label={t("copy")}
                className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-[12px] bg-secondary-container hover:bg-outline-variant/30 text-on-secondary-container transition-colors ml-2 active:scale-95"
              >
                <span className={`material-symbols-outlined ${copied ? "text-[#34D399]" : ""}`}>
                  {copied ? "check" : "content_copy"}
                </span>
              </button>
            </div>
          </div>

          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="w-full min-h-[56px] bg-[#25D366] hover:bg-[#20bd5c] text-white rounded-[16px] text-label-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm"
          >
            <WhatsAppIcon />
            {t("whatsapp")}
          </button>
        </div>

        {/* Info box */}
        <div className="w-full bg-surface-container-low rounded-[16px] p-5 border border-outline-variant/10 text-center flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">info</span>
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            {t("info")}
          </p>
        </div>
      </div>

      {/* Mobile fixed bottom CTA */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-gradient-to-t from-surface via-surface/95 to-transparent pt-12 pb-8 px-6 z-40 flex justify-center">
        <div className="w-full max-w-[480px]">
          <button
            onClick={partnerJoined ? onStartPlaying : undefined}
            disabled={!partnerJoined}
            className="w-full min-h-[64px] bg-primary text-on-primary rounded-full text-body-lg font-semibold shadow-primary-glow hover:bg-surface-tint transition-all active:scale-95 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {partnerJoined ? (
              <>
                {t("start")}
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                {t("startWaiting")}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Desktop layout ──────────────────────────────────────────── */}
      <div className="hidden md:flex max-w-[1200px] mx-auto px-12 py-10 gap-6 items-start justify-center min-h-[calc(100vh-73px)]">
        {/* Left: Share card */}
        <div className="flex-1 max-w-[600px] bg-surface-container-lowest rounded-[24px] shadow-soft-card p-12 relative overflow-hidden">
          {/* Confetti accents */}
          <span className="absolute top-4 left-1/4 w-2.5 h-2.5 rounded-full bg-tertiary-fixed animate-float-up" style={{ animationDelay: "0s" }} />
          <span className="absolute top-8 right-1/3 w-2.5 h-2.5 rounded-full bg-primary animate-float-up" style={{ animationDelay: "0.5s" }} />
          <span className="absolute top-12 left-1/2 w-2 h-2 rounded-full bg-primary-container animate-float-up" style={{ animationDelay: "1s" }} />
          <span className="absolute top-6 right-1/4 w-3 h-3 rounded-full bg-tertiary animate-float-up" style={{ animationDelay: "1.5s" }} />

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <span className="material-symbols-outlined text-primary icon-fill mb-4" style={{ fontSize: "64px" }}>celebration</span>
            <h1 className="text-headline-xl text-on-background mb-2">{t("title")}</h1>
            <p className="text-body-lg text-on-surface-variant">{t("subtitle")}</p>
          </div>

          <div className="flex flex-col gap-6">
            {/* Link */}
            <div>
              <label className="text-label-md text-on-surface-variant mb-2 block">{t("link")}</label>
              <div className="flex bg-surface-container rounded-2xl overflow-hidden border border-transparent focus-within:border-primary transition-colors">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent border-none text-body-lg text-on-background py-4 px-4 focus:ring-0 cursor-text min-w-0"
                />
                <button
                  onClick={handleCopy}
                  className="bg-primary/10 hover:bg-primary/20 text-primary px-6 text-label-md transition-colors flex items-center justify-center gap-2 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-xl">{copied ? "check" : "content_copy"}</span>
                  <span>{copied ? t("copied") : t("copy")}</span>
                </button>
              </div>
            </div>

            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="w-full h-[56px] rounded-full bg-[#25D366] hover:bg-[#20bd5c] text-white text-body-lg font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              <WhatsAppIcon />
              {t("whatsapp")}
            </button>

            {/* Start */}
            <button
              onClick={partnerJoined ? onStartPlaying : undefined}
              disabled={!partnerJoined}
              className="w-full h-[56px] rounded-full bg-primary text-on-primary text-body-lg font-bold flex items-center justify-center gap-2 shadow-primary-glow hover:bg-surface-tint transition-all active:scale-[0.98] group disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {partnerJoined ? (
                <>
                  {t("start")}
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                  {t("startWaiting")}
                </>
              )}
            </button>

            <p className="text-body-md text-on-surface-variant text-center">
              {t("info")}
            </p>
          </div>
        </div>

        {/* Right: Status panel */}
        <div className="w-[340px] shrink-0 bg-surface-container-lowest rounded-[24px] shadow-soft-card p-6 flex flex-col gap-6">
          <h2 className="text-headline-md text-on-background">{t("roomStatus")}</h2>

          {/* You */}
          <div className="flex items-center gap-4 bg-surface-container p-4 rounded-xl">
            <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center text-headline-md font-bold flex-shrink-0">
              {myInitial}
            </div>
            <div className="flex-1">
              <div className="text-label-md text-on-background">{myName ?? t("you")}</div>
              <div className="text-sm text-primary flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                {t("inRoom")}
              </div>
            </div>
          </div>

          {/* Partner */}
          <div className={`flex items-center gap-4 p-4 rounded-xl border-2 border-dashed transition-colors ${partnerJoined ? "bg-surface-container border-[#34D399]/50" : "bg-surface-container-low border-outline-variant"}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed flex-shrink-0 ${partnerJoined ? "bg-[#34D399]/20 border-[#34D399] text-[#34D399]" : "bg-surface-variant border-outline-variant text-on-surface-variant"}`}>
              {partnerJoined && partnerInitial ? (
                <span className="text-headline-md font-bold">{partnerInitial}</span>
              ) : (
                <span className="material-symbols-outlined text-2xl">person_add</span>
              )}
            </div>
            <div className="flex-1">
              <div className={`text-label-md ${partnerJoined ? "text-on-background" : "text-on-surface-variant"}`}>
                {partnerName ?? "Partner"}
              </div>
              <div className={`text-sm flex items-center gap-1 ${partnerJoined ? "text-[#34D399]" : "text-on-surface-variant"}`}>
                <span className={`w-2 h-2 rounded-full inline-block ${partnerJoined ? "bg-[#34D399]" : "bg-tertiary-fixed animate-soft-pulse"}`} />
                {partnerJoined ? t("partnerJoinedStatus") : t("partnerWaiting")}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-outline-variant/30 text-center">
            <span className="material-symbols-outlined text-outline opacity-50" style={{ fontSize: "48px" }}>chair</span>
            <p className="text-body-md text-on-surface-variant mt-2">{t("relaxMessage")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
