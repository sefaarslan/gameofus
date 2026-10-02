import { useTranslations } from "next-intl";
import { GameOfUsLogo } from "./GameOfUsLogo";
import { InstagramIcon } from "./InstagramIcon";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/social";

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-8 border-t border-outline-variant/30">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-8 md:py-6 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-5 text-center">
        <GameOfUsLogo size="sm" />

        {/* Mobilde alt alta (açıklama + hesap), masaüstünde yan yana */}
        <div className="flex flex-col md:flex-row items-center gap-2.5 md:gap-3">
          <span className="text-label-md text-on-surface-variant">{t("follow")}</span>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t("follow")} — @${INSTAGRAM_HANDLE}`}
            className="inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-full border border-outline-variant/40 whitespace-nowrap text-label-md font-semibold text-on-surface hover:text-primary hover:border-primary/40 hover:bg-primary-container/10 transition-colors"
          >
            <InstagramIcon />
            @{INSTAGRAM_HANDLE}
          </a>
        </div>

        <p className="text-xs text-on-surface-variant/70">© {new Date().getFullYear()} Game of Us</p>
      </div>
    </footer>
  );
}
