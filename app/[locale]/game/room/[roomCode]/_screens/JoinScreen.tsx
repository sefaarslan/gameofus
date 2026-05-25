"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface JoinScreenProps {
  roomCode: string;
  onJoined: (token: string) => void;
}

export function JoinScreen({ roomCode, onJoined }: JoinScreenProps) {
  const t = useTranslations("join");
  const tErr = useTranslations("error");

  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/rooms/${roomCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        const code = data.error?.code;
        if (code === "ROOM_FULL") setError(t("roomFull"));
        else if (code === "ROOM_EXPIRED") setError(t("expired"));
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
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-primary-container/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary icon-fill" style={{ fontSize: "48px" }}>celebration</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-[28px] p-8 shadow-soft-active border border-outline-variant/20">
          <h1 className="text-headline-md text-on-background mb-1 text-center">{t("title")}</h1>
          <p className="text-body-md text-on-surface-variant text-center mb-8">
            {t("subtitle")}
          </p>

          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-label-md text-on-surface-variant">{t("name.label")}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-xl">person</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("name.placeholder")}
                  maxLength={30}
                  required
                  autoFocus
                  className="w-full pl-11 pr-4 py-3.5 bg-background border-2 border-outline-variant/40 rounded-xl text-body-md text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-error-container text-error rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-xl">error</span>
                <span className="text-body-md">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !displayName.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-body-md font-semibold py-4 rounded-full hover:bg-surface-tint disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-primary-glow mt-2"
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
