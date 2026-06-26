"use client";

import Link from "next/link";
import { Link as LocaleLink } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { GameOfUsLogo } from "./GameOfUsLogo";
import { useState, useRef, useEffect } from "react";

interface AppHeaderProps {
  locale: string;
}

const LOCALES = [
  { code: "tr", label: "Türkçe", short: "TR" },
  { code: "en", label: "English", short: "EN" },
  { code: "es", label: "Español", short: "ES" },
] as const;

function LocaleDropdown({ locale, pathname }: { locale: string; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-outline-variant/30 text-label-sm text-on-surface-variant hover:bg-surface-container transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined text-sm leading-none">language</span>
        <span className="font-medium">{current.short}</span>
        <span className={`material-symbols-outlined text-sm leading-none transition-transform ${open ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-36 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-soft-active overflow-hidden z-50">
          {LOCALES.map(({ code, label, short }) => (
            <LocaleLink
              key={code}
              href={pathname}
              locale={code}
              onClick={() => setOpen(false)}
              className={[
                "flex items-center gap-2.5 px-3 py-2 text-label-sm transition-colors",
                code === locale
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container",
              ].join(" ")}
            >
              <span className="text-xs font-bold w-5">{short}</span>
              <span>{label}</span>
              {code === locale && (
                <span className="material-symbols-outlined text-xs ml-auto">check</span>
              )}
            </LocaleLink>
          ))}
        </div>
      )}
    </div>
  );
}

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
            <LocaleDropdown locale={locale} pathname={pathname} />
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
