"use client";

import { useEffect, useRef, useState } from "react";

export interface PackOption {
  key: string;
  /** Ana metin, ör. "Arkadaşlık ilişkilerinde - 101" */
  label: string;
  /** Sağda küçük durum metni (tolerans, "Devam et", "Mobilde açılacak") */
  hint?: string;
  disabled?: boolean;
}

/**
 * Set seçimi için açılır liste: sitedeki dil seçicisiyle (AppHeader) aynı görünüm ve davranış.
 * Başlıksız, düz liste; kapalı olanlar soluk ve seçilemez.
 */
export function PackDropdown({
  options,
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  options: PackOption[];
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.key === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    // Liste ekranın dışına taşmasın: açılınca seçici ekranın üst yarısına kaydırılır
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative w-full text-left">
      <button
        type="button"
        id="solo-pack-button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-soft-card text-on-background hover:bg-surface-container transition-colors disabled:opacity-60"
      >
        <span className="text-base font-semibold truncate">{current?.label}</span>
        <span className="flex items-center gap-2 shrink-0">
          {current?.hint && <span className="text-xs font-semibold text-on-surface-variant">{current.hint}</span>}
          <span className={`material-symbols-outlined text-xl leading-none transition-transform ${open ? "rotate-180" : ""}`}>expand_more</span>
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 top-full mt-1.5 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-soft-active z-50"
          style={{ maxHeight: 360, overflowY: "auto", borderRadius: 16 }}
        >
          {options.map((o) => {
            const selected = o.key === value;
            return (
              <button
                key={o.key}
                type="button"
                role="option"
                aria-selected={selected}
                aria-disabled={o.disabled || undefined}
                disabled={o.disabled}
                onClick={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
                className={[
                  "w-full flex items-center gap-2.5 px-4 py-2.5 text-label-md text-left transition-colors",
                  selected ? "bg-primary/10 text-primary font-semibold" : "text-on-surface-variant hover:bg-surface-container",
                  o.disabled ? "opacity-50 cursor-not-allowed hover:bg-transparent" : "",
                ].join(" ")}
              >
                {o.disabled && <span className="material-symbols-outlined text-base icon-fill shrink-0">lock</span>}
                <span className="flex-1 min-w-0 truncate">{o.label}</span>
                {o.hint && <span className="text-xs font-semibold shrink-0">{o.hint}</span>}
                {selected && <span className="material-symbols-outlined text-sm shrink-0">check</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
