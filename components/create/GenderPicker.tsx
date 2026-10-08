"use client";

import { useTranslations } from "next-intl";
import type { Gender } from "@/lib/gender";

const OPTIONS: Array<{ value: Gender | null; key: "female" | "male" | "unspecified"; icon: string }> = [
  { value: "female", key: "female", icon: "female" },
  { value: "male", key: "male", icon: "male" },
  { value: null, key: "unspecified", icon: "person" },
];

/** Opsiyonel cinsiyet seçimi (karakter çizimi ve AI dili için). Varsayılan "Belirtmek istemiyorum" (null). */
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
      <span className="text-xs text-on-surface-variant">{label}</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {OPTIONS.map(({ value: optionValue, key, icon }) => {
          const selected = value === optionValue;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(optionValue)}
              className={`flex items-center gap-1.5 pl-3 pr-3.5 py-2 rounded-full border-2 text-xs font-medium transition-all ${
                selected
                  ? "border-primary bg-primary-container/10 text-primary"
                  : "border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:border-outline"
              }`}
            >
              <span className="material-symbols-outlined text-base">{icon}</span>
              {t(key)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
