"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatRoomCode } from "@/lib/room-code-utils";

/**
 * Oda kodunu büyük ve gruplu gösterir (6 karakter: K7M-2PQ; eski 8 karakter: K7M2-PQ34) + kopyala düğmesi.
 * Linkteki kodla AYNI değerdir; karşı taraf linke dokunabilir ya da gameofus.app'te "Kodla katıl"dan kodu girebilir (webden kurulan oda yalnızca web'de açılır).
 * Kopyalanan değer gruplanmamış kanonik koddur (yapıştırınca da çalışır; sunucu zaten tire/boşluk/harf boyutunu yok sayar).
 */
export function RoomCodeBox({ roomCode, rel, compact = false }: { roomCode: string; rel: string; compact?: boolean }) {
  const t = useTranslations("share.code");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // sessizce geç
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Netflix TV girişi gibi: önce adres ve kod, altında "veya" + davet linki */}
      <span className={compact ? "text-label-md text-on-surface" : "text-label-md text-on-surface-variant"}>
        {t.rich("instruction", { rel, b: (chunks) => <strong className="text-on-surface font-bold">{chunks}</strong> })}
      </span>
      <div className="flex items-center bg-surface-container rounded-[16px] p-1 pl-4">
        <span
          className="flex-1 font-mono font-bold tracking-[0.14em] md:tracking-[0.18em] text-on-background text-xl md:text-3xl select-all py-2 min-w-0 whitespace-nowrap"
          aria-label={`${t("label")}: ${roomCode.split("").join(" ")}`}
        >
          {formatRoomCode(roomCode)}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={t("copy")}
          className="flex-shrink-0 h-12 w-12 md:w-auto md:px-4 flex items-center justify-center gap-2 rounded-[12px] bg-secondary-container hover:bg-outline-variant/30 text-on-secondary-container text-label-md transition-colors ml-2 active:scale-95"
        >
          <span className={`material-symbols-outlined text-xl ${copied ? "text-[#34D399]" : ""}`}>{copied ? "check" : "content_copy"}</span>
          <span className="hidden md:inline">{copied ? t("copied") : t("copy")}</span>
        </button>
      </div>
      <p className="text-xs text-on-surface-variant/80">{t("hint")}</p>
    </div>
  );
}
