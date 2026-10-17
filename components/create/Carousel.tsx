"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Yatay kayan kart şeridi (mobildeki gibi): dokunmatikte parmakla, masaüstünde yan oklarla ve fare tekerleği/kaydırma çubuğuyla.
 * Kartlar sabit genişlikte olmalı (`shrink-0`); kaydırma ucunda hizalanır (scroll-snap).
 */
export function Carousel({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update, children]);

  function scrollByPage(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.8), behavior: reduce ? "auto" : "smooth" });
  }

  const arrow =
    "hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-surface-container-lowest border border-outline-variant shadow-soft-card text-on-surface hover:bg-surface-container active:scale-95 transition-all";

  return (
    <div className="relative">
      <div
        ref={ref}
        role="group"
        aria-label={label}
        className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory scroll-pl-6 md:scroll-pl-0 pb-2 pt-1.5 -mx-6 px-6 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {canPrev && (
        <button type="button" onClick={() => scrollByPage(-1)} aria-label="←" className={`${arrow} -left-4`}>
          <span className="material-symbols-outlined text-xl">chevron_left</span>
        </button>
      )}
      {canNext && (
        <button type="button" onClick={() => scrollByPage(1)} aria-label="→" className={`${arrow} -right-4`}>
          <span className="material-symbols-outlined text-xl">chevron_right</span>
        </button>
      )}
    </div>
  );
}
