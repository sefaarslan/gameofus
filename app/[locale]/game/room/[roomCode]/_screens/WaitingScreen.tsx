"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface WaitingScreenProps {
  roomCode: string;
  roomLocale: string;
}

const WhatsAppIcon = () => (
  <svg aria-hidden="true" className="w-5 h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

export function WaitingScreen({ roomCode, roomLocale }: WaitingScreenProps) {
  const t = useTranslations("waiting");
  const tShare = useTranslations("share");
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
      // ignore
    }
  }

  function handleWhatsApp() {
    const text = encodeURIComponent(`${t("whatsappText")} ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-1/4 -left-16 w-64 h-64 bg-primary-container/20 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 -right-16 w-80 h-80 bg-surface-variant/40 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* ── Mobile + Desktop card ────────────────────────────────── */}
      <div className="w-full max-w-[480px] md:max-w-[720px] bg-surface-container-lowest rounded-[24px] p-8 md:p-14 shadow-soft-active border border-outline-variant/10 flex flex-col items-center text-center relative overflow-hidden">
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-container to-tertiary-container rounded-t-[24px]" />

        {/* Corner glow decorators */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-surface-container-highest rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-primary-container/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon illustration */}
        <div className="relative w-32 h-32 md:w-48 md:h-48 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-surface-container rounded-full animate-pulse" />
          <div className="relative z-10 w-20 h-20 md:w-28 md:h-28 bg-surface-container-high rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary animate-pulse" style={{ fontSize: "48px" }}>hourglass_empty</span>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-surface-container-lowest rounded-full p-2.5 shadow-soft-card z-20">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: "28px" }}>schedule</span>
          </div>
        </div>

        {/* Text */}
        <h1 className="text-headline-lg-mobile md:text-headline-xl text-on-background mb-4">{t("title")}</h1>
        <p className="text-body-md md:text-body-lg text-on-surface-variant mb-8 max-w-md">
          {t("partner")}
        </p>

        {/* Actions */}
        <div className="w-full max-w-sm flex flex-col gap-4">
          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="w-full min-h-[56px] bg-[#25D366] hover:bg-[#20bd5c] text-white rounded-full text-label-md font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm"
          >
            <WhatsAppIcon />
            {t("resend")}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px bg-outline-variant flex-1" />
            <span className="text-label-md text-outline">{t("or")}</span>
            <div className="h-px bg-outline-variant flex-1" />
          </div>

          {/* Copy link row */}
          <div className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between border border-outline-variant/30">
            <span className="text-on-surface-variant truncate mr-2 select-all font-mono text-sm flex-1 min-w-0">{shareUrl}</span>
            <button
              onClick={handleCopy}
              title={t("copyTitle")}
              className="p-2 text-primary hover:bg-surface-container rounded-lg transition-colors flex-shrink-0 active:scale-95"
            >
              <span className="material-symbols-outlined text-xl">{copied ? "check" : "content_copy"}</span>
            </button>
          </div>
        </div>

        {/* Bouncing dots */}
        <div className="mt-10 flex items-center gap-2 text-on-surface-variant">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-label-md ml-2">{t("waitingDots")}</span>
        </div>
      </div>
    </div>
  );
}
