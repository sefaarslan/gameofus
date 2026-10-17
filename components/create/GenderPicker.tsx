"use client";

import { useTranslations } from "next-intl";
import type { Gender } from "@/lib/gender";

const OPTIONS: Array<{ value: Gender | null; key: "female" | "male" | "unspecified" }> = [
  { value: "female", key: "female" },
  { value: "male", key: "male" },
  { value: null, key: "unspecified" },
];

/** Opsiyonel cinsiyet seçimi (karakter çizimi ve AI dili için): mobildeki gibi segmentli kontrol. Varsayılan "Diğer" (null). */
export function GenderPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Gender | null;
  onChange: (value: Gender | null) => void;
}) {
  const t = useTranslations("create.gender");

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-on-surface-variant flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">wc</span>
        {label}
      </span>
      <div className="flex bg-surface-container rounded-xl p-1 min-h-[44px]" role="radiogroup" aria-label={label}>
        {OPTIONS.map(({ value: optionValue, key }) => {
          const selected = value === optionValue;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(optionValue)}
              className={`flex-1 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                selected ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {t(key)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
