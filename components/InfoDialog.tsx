"use client";

import { useEffect, useRef, useState } from "react";

interface InfoDialogProps {
  open: boolean;
  title: string;
  /** Varsayılan tek "kapat" düğmesinin metni (`actions` verilmezse gerekir) */
  closeLabel?: string;
  /** Verilirse varsayılan kapat düğmesinin yerine gösterilir; Escape/arka plan yine `onClose` çağırır */
  actions?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Bilgi penceresi: uzun açıklamaları ekranı doldurmadan göstermek için. Mobilde alttan açılan sheet, masaüstünde ortalı kart.
 * Escape, arka plana dokunma ve kapat düğmesiyle kapanır; açıkken arka plan kaydırması kilitlenir, kapanınca odak tetikleyiciye döner.
 */
export function InfoDialog({ open, title, closeLabel, actions, onClose, children }: InfoDialogProps) {
  const [shown, setShown] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => setShown(true));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      returnFocusRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div
        className={`absolute inset-0 bg-scrim/50 backdrop-blur-sm transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-dialog-title"
        tabIndex={-1}
        className={`relative w-full md:max-w-md max-h-[85vh] overflow-y-auto bg-surface-container-lowest rounded-t-[28px] md:rounded-[28px] shadow-soft-active px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pb-8 md:pt-8 outline-none transition-all duration-300 ease-out ${
          shown ? "translate-y-0 opacity-100" : "translate-y-full md:translate-y-4 opacity-0"
        }`}
      >
        <div className="w-10 h-1 rounded-full bg-outline-variant/60 mx-auto mb-5 md:hidden" aria-hidden="true" />
        <h2 id="info-dialog-title" className="text-headline-sm text-on-surface mb-3 text-balance">
          {title}
        </h2>
        <div className="flex flex-col gap-3 text-body-md text-on-surface-variant">{children}</div>
        {actions ?? (
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full h-12 rounded-full bg-surface-container text-label-md text-on-surface hover:bg-surface-container-high active:scale-[0.98] transition-all"
          >
            {closeLabel}
          </button>
        )}
      </div>
    </div>
  );
}
