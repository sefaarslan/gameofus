"use client";

import Link from "next/link";
import { Link as LocaleLink } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { GameOfUsLogo } from "./GameOfUsLogo";

interface AppHeaderProps {
  locale: string;
}

const LOCALES = [
  { code: "tr", label: "TR" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
] as const;

export function AppHeader({ locale }: AppHeaderProps) {
  const tNav = useTranslations("nav");
  const pathname = usePathname();

  // Hide locale switcher on game pages — locale is locked to the room's language
  const isGamePage = pathname.includes("/game/");

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 shadow-soft-sm transition-all duration-300">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link href={`/${locale}`} className="flex-shrink-0">
          <GameOfUsLogo size="md" />
        </Link>

        {/* Desktop nav — hidden on game pages */}
        {!isGamePage && (
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href={`/${locale}#nasil-calisir`}
              className="text-label-md text-on-surface-variant hover:text-primary transition-colors"
            >
              {tNav("howItWorks")}
            </Link>
            <Link
              href={`/${locale}#oyun-modlari`}
              className="text-label-md text-on-surface-variant hover:text-primary transition-colors"
            >
              {tNav("modes")}
            </Link>
            <Link
              href={`/${locale}#premium`}
              className="text-label-md text-on-surface-variant hover:text-primary transition-colors"
            >
              {tNav("premium")}
            </Link>
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Locale switcher — hidden on game pages */}
          {!isGamePage && (
            <div className="flex items-center rounded-full border border-outline-variant/30 overflow-hidden">
              {LOCALES.map(({ code, label }) => (
                <LocaleLink
                  key={code}
                  href={pathname}
                  locale={code}
                  className={[
                    "px-2.5 py-1 text-label-sm transition-colors",
                    code === locale
                      ? "bg-primary text-on-primary font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container",
                  ].join(" ")}
                >
                  {label}
                </LocaleLink>
              ))}
            </div>
          )}

          {/* Desktop CTA — hidden on game pages */}
          {!isGamePage && (
            <Link
              href={`/${locale}/create`}
              className="hidden md:inline-flex items-center gap-2 bg-primary text-on-primary text-label-md font-semibold px-5 py-2.5 rounded-full hover:bg-surface-tint active:scale-95 transition-all shadow-primary-glow"
            >
              {tNav("start")}
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          )}

          {/* Mobile menu icon — hidden on game pages */}
          {!isGamePage && (
            <button
              className="md:hidden p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
              aria-label={tNav("menu")}
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
