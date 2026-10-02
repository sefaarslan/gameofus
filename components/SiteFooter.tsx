import { useTranslations } from "next-intl";
import { GameOfUsLogo } from "./GameOfUsLogo";
import { InstagramIcon } from "./InstagramIcon";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/social";

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-8 border-t border-outline-variant/30">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-5">
        <GameOfUsLogo size="sm" />

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t("follow")} — @${INSTAGRAM_HANDLE}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-outline-variant/40 text-label-md text-on-surface-variant hover:text-primary hover:border-primary/40 hover:bg-primary-container/10 transition-colors"
        >
          <InstagramIcon />
          <span>{t("follow")}</span>
          <span className="font-semibold text-on-surface">@{INSTAGRAM_HANDLE}</span>
        </a>

        <p className="text-xs text-on-surface-variant/70">© {new Date().getFullYear()} Game of Us</p>
      </div>
    </footer>
  );
}
