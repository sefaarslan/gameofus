"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GenderPicker } from "@/components/create/GenderPicker";
import { ageFromIso, maskBirthDateInput, parseBirthDateInput } from "@/lib/date-input";
import type { Gender } from "@/lib/gender";

interface JoinScreenProps {
  roomCode: string;
  /** Oda mobilden kurulduysa (kurucu hesaplı) yapay zekâ yorumu açılabilir: isteğe bağlı rıza kutusu gösterilir. */
  mobileRoom?: boolean;
  onJoined: (token: string) => void;
}

/**
 * Davetle katılma: her oyuncu kendi bilgisini kendisi girer. Web odalarında (AI yok) yalnızca ad istenir. Mobilden kurulmuş odada
 * AI rıza kutusunun yanında cinsiyet ve doğum tarihi alanları HER ZAMAN açıktır: kutu işaretliyse doğum tarihi (ve bir cinsiyet
 * seçimi, "belirtmek istemiyorum" dahil) zorunlu, değilse isteğe bağlıdır; yaş aralığı/burç/İspanyolca dil bilgisi yoruma yalnızca
 * rıza varsa girer (sunucuda zorlanır). Kutu boşsa katılmadan önce "bu oyun için yapay zekâ yorumu açılamaz" uyarısı gösterilir.
 * Web'de sahne modu ve 18+ yaş denetimi yoktur (yalnızca mobil).
 */
export function JoinScreen({ roomCode, mobileRoom = false, onJoined }: JoinScreenProps) {
  const t = useTranslations("join");
  const tc = useTranslations("create");
  const tErr = useTranslations("error");

  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<Gender | null | undefined>(undefined);
  const [birthDate, setBirthDate] = useState("");
  // İsteğe bağlı, varsayılan KAPALI (önceden işaretli gelmez): katılmak rızaya bağlı değildir
  const [aiConsent, setAiConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mobil odada alanlar her zaman açıktır; zorunlu olmaları yapay zekâ rızasına bağlıdır
  const profileRequired = mobileRoom && aiConsent;

  function birthDateError(): string | null {
    if (!birthDate.trim()) return profileRequired ? t("birthDateRequired") : null;
    const iso = parseBirthDateInput(birthDate);
    if (!iso) return tc("errors.birthDateInvalid");
    if (ageFromIso(iso) < 13) return tc("errors.birthDateTooYoung");
    return null;
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      setError(tc("errors.nameRequired"));
      return;
    }
    if (profileRequired && gender === undefined) {
      setError(t("genderRequired"));
      return;
    }
    const bdErr = mobileRoom ? birthDateError() : null;
    if (bdErr) {
      setError(bdErr);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/rooms/${roomCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          // Yalnızca ekranda gösterilen (mobil oda) alanlar gider; boş bırakılan alan null gider
          ...(mobileRoom ? { gender: gender ?? null, birthDate: parseBirthDateInput(birthDate) } : {}),
          ...(mobileRoom ? { aiConsent } : {}),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const code = data.error?.code;
        if (code === "ROOM_FULL") setError(t("roomFull"));
        else if (code === "ROOM_EXPIRED") setError(t("expired"));
        else if (code === "AGE_VERIFICATION_REQUIRED") setError(t("ageMobileOnly"));
        else if (code === "AGE_RESTRICTED") setError(tc("errors.birthDateTooYoung"));
        else setError(tErr("generic"));
        return;
      }

      const token: string = data.participant.token;
      localStorage.setItem(`gou_token_${roomCode}`, token);
      onJoined(token);
    } catch {
      setError(tErr("generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-background flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary-container/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-tertiary-container/15 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-sm">
        {/* Illustration area */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary icon-fill" style={{ fontSize: "40px" }}>celebration</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-[28px] p-6 shadow-soft-active border border-outline-variant/20">
          <h1 className="text-headline-sm text-on-background mb-1 text-center">{t("title")}</h1>
          <p className="text-body-md text-on-surface-variant text-center mb-1">{t("subtitle")}</p>
          <p className="text-xs text-on-surface-variant/70 text-center mb-6">{t("hint")}</p>

          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="join-name" className="text-xs text-on-surface-variant">{t("name.label")}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">badge</span>
                <input
                  id="join-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("name.placeholder")}
                  maxLength={30}
                  autoFocus
                  className="w-full pl-11 pr-4 py-3.5 bg-surface-container-lowest border border-outline-variant rounded-2xl text-body-md text-on-surface placeholder-on-surface-variant/50 shadow-soft-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {mobileRoom && (
              <div className="flex flex-col gap-2 bg-surface-container rounded-2xl px-4 py-3">
                <label htmlFor="join-ai-consent" className="flex items-start gap-3 cursor-pointer">
                  <input
                    id="join-ai-consent"
                    type="checkbox"
                    checked={aiConsent}
                    onChange={(e) => setAiConsent(e.target.checked)}
                    aria-describedby="join-ai-consent-detail"
                    className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
                  />
                  <span className="text-body-md text-on-surface">{t("aiConsent.label")}</span>
                </label>
                <p id="join-ai-consent-detail" className="text-xs text-on-surface-variant/80 pl-8">
                  {t("aiConsent.detail")}
                </p>
                {!aiConsent && (
                  <p role="status" className="text-xs font-medium text-on-surface-variant pl-8">
                    {t("aiConsent.declinedNotice")}
                  </p>
                )}
              </div>
            )}

            {mobileRoom && (
              <div className="flex flex-col gap-1.5">
                <GenderPicker label={tc("gender.label")} value={gender} onChange={setGender} />
                <p className="text-xs text-on-surface-variant/70">{tc("gender.hint")}</p>
              </div>
            )}

            {mobileRoom && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="join-birth" className="text-xs text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                  <span className="truncate">
                    {tc("birthDate.label")}
                    {!profileRequired && <span className="text-on-surface-variant/60"> ({tc("birthDate.optional")})</span>}
                  </span>
                </label>
                <div className="flex items-center bg-surface-container rounded-xl px-3 min-h-[44px] focus-within:ring-2 focus-within:ring-primary/40">
                  <input
                    id="join-birth"
                    type="text"
                    inputMode="numeric"
                    autoComplete="bday"
                    aria-required={profileRequired}
                    value={birthDate}
                    onChange={(e) => setBirthDate(maskBirthDateInput(e.target.value))}
                    placeholder={tc("birthDate.placeholder")}
                    maxLength={10}
                    className="w-full bg-transparent text-label-md text-on-surface placeholder-on-surface-variant/60 py-2.5 focus:outline-none"
                  />
                </div>
                {profileRequired && <p className="text-xs text-on-surface-variant/70">{t("birthDateAiHint")}</p>}
              </div>
            )}

            {error && (
              <div role="alert" className="flex items-center gap-3 bg-error-container text-error rounded-2xl px-4 py-3">
                <span className="material-symbols-outlined text-xl">error</span>
                <span className="text-body-md">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-body-lg font-semibold py-4 rounded-full hover:bg-surface-tint disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-primary-glow mt-1"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-xl">refresh</span>
              ) : (
                <span className="material-symbols-outlined icon-fill text-xl">play_arrow</span>
              )}
              {loading ? t("joining") : t("submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
