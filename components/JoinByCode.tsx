"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { isPlausibleRoomCode, normalizeRoomCode } from "@/lib/room-code-utils";

/**
 * "Kodla katıl": kullanıcı oda kodunu yazar (K7M-2PQ, k7m 2pq…), kanonik biçime çevrilir ve mevcut oda sayfasına gidilir.
 * Bulunamayan/süresi dolmuş/dolu oda durumlarını oda sayfasındaki mevcut ekranlar gösterir.
 */
export function JoinByCode() {
  const t = useTranslations("landing.joinByCode");
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = normalizeRoomCode(value);
    if (!isPlausibleRoomCode(code)) {
      setError(t("invalid"));
      return;
    }
    setError(null);
    router.push(`/game/room/${code}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm" noValidate>
      <label htmlFor="join-by-code" className="block text-label-md text-on-surface-variant mb-2">
        {t("label")}
      </label>
      <div className="flex gap-2">
        <input
          id="join-by-code"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            if (error) setError(null);
          }}
          placeholder={t("placeholder")}
          maxLength={14}
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "join-by-code-error" : undefined}
          className="flex-1 min-w-0 px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-full font-mono font-bold tracking-widest text-body-md text-on-surface placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
        />
        <button
          type="submit"
          className="shrink-0 px-5 py-3 rounded-full bg-primary text-on-primary text-label-md font-semibold hover:bg-surface-tint active:scale-95 transition-all"
        >
          {t("submit")}
        </button>
      </div>
      {error && (
        <p id="join-by-code-error" role="alert" className="mt-2 text-xs text-error">
          {error}
        </p>
      )}
    </form>
  );
}
