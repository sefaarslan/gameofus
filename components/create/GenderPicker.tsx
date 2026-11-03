"use client";

import { useTranslations } from "next-intl";
import type { Gender } from "@/lib/gender";

const OPTIONS: Array<{ value: Gender | null; key: "female" | "male" | "unspecified" }> = [
  { value: "female", key: "female" },
  { value: "male", key: "male" },
  { value: null, key: "unspecified" },
];

/**
 * Cinsiyet seçimi (karakter çizimi ve AI dili için): mobildeki gibi segmentli kontrol. Üçüncü seçenek "belirtmek istemiyorum" (null); görünen metni çeviri dosyasındadır (`unspecified`).
 * `value === undefined` → henüz hiçbir şey seçilmedi (zorunlu doldurulan akışlar için).
 */
export function GenderPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Gender | null | undefined;
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
          const selected = value !== undefined && value === optionValue;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(optionValue)}
              className={`flex-1 flex items-center justify-center rounded-lg text-xs transition-all ${
                selected
                  ? "bg-primary text-on-primary font-semibold"
                  : optionValue === null
                    ? // "Belirtmek istemiyorum" ikincil seçenek: soluk (opaklık %80 = AA kontrastının alt sınırı, daha soluğu okunmaz) ve daha ince
                      "text-on-surface-variant/80 font-medium hover:bg-surface-container-high"
                    : "text-on-surface-variant font-semibold hover:bg-surface-container-high"
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
