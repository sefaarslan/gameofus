"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const DISMISS_KEY = "gou_solo_promo_dismissed";
const PLAYED_KEY = "gou_solo_redflag";

/**
 * İki kişilik akışlardaki küçük, kapatılabilir tanıtım kartı. Oyun akışını bölmez: sade, tek bir bağlantı;
 * kapatılınca (ya da solo oyun oynanmışsa) bir daha gösterilmez.
 */
export function SoloPromoCard({ variant }: { variant: "waiting" | "results" }) {
  const t = useTranslations("solo.promo");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISS_KEY) && !localStorage.getItem(PLAYED_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* yoksay */
    }
  }

  return (
    <aside className="relative w-full max-w-sm bg-surface-container-lowest border border-outline-variant/30 rounded-[20px] p-4 pr-12 shadow-soft-sm flex items-center gap-3 text-left">
      <div className="grid grid-cols-3 gap-0.5 w-10 shrink-0" aria-hidden="true">
        {["#3f9d6b", "#d9a21b", "#e0524a", "#d9a21b", "#3f9d6b", "#e0524a", "#e0524a", "#3f9d6b", "#d9a21b"].map((c, i) => (
          <div key={i} className="aspect-square rounded-[3px]" style={{ background: c }} />
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-label-md font-bold text-on-background leading-tight">{t(variant === "waiting" ? "waitingTitle" : "resultsTitle")}</p>
        <p className="text-xs text-on-surface-variant leading-snug mt-0.5">{t(variant === "waiting" ? "waitingDesc" : "resultsDesc")}</p>
        <Link href="/solo/red-flag" className="inline-block mt-2 text-label-md font-bold text-primary hover:underline">
          {t("cta")} →
        </Link>
      </div>
      <button
        onClick={dismiss}
        aria-label={t("dismiss")}
        className="absolute top-1.5 right-1.5 w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </aside>
  );
}
