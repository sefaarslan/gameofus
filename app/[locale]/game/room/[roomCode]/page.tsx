"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { JoinScreen } from "./_screens/JoinScreen";
import { ShareScreen } from "./_screens/ShareScreen";
import { GameScreen } from "./_screens/GameScreen";
import { WaitingScreen } from "./_screens/WaitingScreen";

type QuestionMode = "secret_choice" | "prediction" | "orderline";

interface Question {
  roundOrder: number;
  questionId: string;
  mode: QuestionMode;
  questionText: string;
  options: Array<{ id: string; optionText: string; sortOrder: number }> | null;
}

interface ParticipantInfo {
  id: string;
  role: "owner" | "guest";
  displayName: string;
  status: "joined" | "playing" | "completed";
}

interface RoomStateData {
  room: {
    roomCode: string;
    status: string;
    gameMode: string;
    questionCount: number;
    expiresAt: string;
    locale: string;
  };
  participant: ParticipantInfo | null;
  participants: Array<{ role: string; displayName: string; status: string }>;
  questions: Question[];
  progress: { answeredCount: number; totalCount: number };
}

type Screen = "loading" | "error" | "join" | "share" | "game" | "waiting" | "results";

function pickScreen(data: RoomStateData, token: string | null): Screen {
  if (data.room.status === "expired") return "error";

  // Oyun bittiyse token olmasa da sonuçlara yönlendir
  if (data.room.status === "result_ready" || data.room.status === "completed") return "results";

  if (!token || !data.participant) {
    if (data.participants.length >= 2) return "error";
    return "join";
  }

  const { participant, progress, participants } = data;

  if (participant.status === "completed") return "waiting";

  // Owner with no partner and no progress → share screen first
  const hasPartner = participants.some((p) => p.role === "guest");
  if (participant.role === "owner" && !hasPartner && progress.answeredCount === 0) {
    return "share";
  }

  return "game";
}

export default function RoomPage() {
  const params = useParams<{ roomCode: string; locale: string }>();
  const roomCode = params.roomCode;
  const urlLocale = params.locale;
  const tErr = useTranslations("error");
  const router = useRouter();

  const [screen, setScreen] = useState<Screen>("loading");
  const [stateData, setStateData] = useState<RoomStateData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(
    async (currentToken: string | null) => {
      try {
        const url = currentToken
          ? `/api/rooms/${roomCode}/state?participantToken=${encodeURIComponent(currentToken)}`
          : `/api/rooms/${roomCode}/state`;

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          const code = data.error?.code;
          if (code === "ROOM_EXPIRED") setErrorMsg(tErr("roomExpired"));
          else if (code === "ROOM_NOT_FOUND") setErrorMsg(tErr("invalidLink"));
          else setErrorMsg(tErr("generic"));
          setScreen("error");
          return null;
        }

        setStateData(data);
        return data as RoomStateData;
      } catch {
        setErrorMsg(tErr("generic"));
        setScreen("error");
        return null;
      }
    },
    [roomCode, tErr],
  );

  // Initial load + locale redirect
  useEffect(() => {
    const storedToken = localStorage.getItem(`gou_token_${roomCode}`);
    setToken(storedToken);

    fetchState(storedToken).then((data) => {
      if (!data) return;

      // Redirect to room's locale if URL locale doesn't match
      const roomLocale = data.room.locale;
      if (roomLocale && roomLocale !== urlLocale) {
        window.location.replace(`/${roomLocale}/game/room/${roomCode}`);
        return;
      }

      const nextScreen = pickScreen(data, storedToken);
      setScreen(nextScreen);
    });
  }, [roomCode, fetchState, urlLocale]);

  // Polling for share and waiting screens
  useEffect(() => {
    if (screen !== "share" && screen !== "waiting") {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(async () => {
      const data = await fetchState(token);
      if (!data) return;
      const nextScreen = pickScreen(data, token);

      if (nextScreen === "results") {
        if (pollRef.current) clearInterval(pollRef.current);
        setScreen("results");
      } else if (screen === "share" && nextScreen === "game") {
        setStateData(data);
      } else if (nextScreen === "waiting") {
        setStateData(data);
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [screen, token, fetchState]);

  // Navigate to results page when result_ready
  useEffect(() => {
    if (screen === "results") {
      router.push(`/game/room/${roomCode}/results`);
    }
  }, [screen, roomCode, router]);

  function handleJoined(newToken: string) {
    setToken(newToken);
    fetchState(newToken).then((data) => {
      if (data) setScreen(pickScreen(data, newToken));
    });
  }

  function handleStartPlaying() {
    setScreen("game");
  }

  function handleGameComplete() {
    setScreen("waiting");
  }

  const partnerJoined =
    stateData?.participants.some((p) => p.role === "guest" && p.status !== "invited") ?? false;

  const roomLocale = stateData?.room.locale ?? urlLocale;

  if (screen === "loading") {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-background flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-primary/40 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (screen === "error") {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-background flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center">
          <span className="material-symbols-outlined text-error icon-fill" style={{ fontSize: "40px" }}>
            link_off
          </span>
        </div>
        <p className="text-body-lg text-on-surface-variant max-w-sm">{errorMsg ?? tErr("generic")}</p>
        <button
          onClick={() => router.push("/")}
          className="px-8 py-3 bg-primary text-on-primary rounded-full text-label-md font-semibold shadow-primary-glow hover:bg-surface-tint transition-all active:scale-95"
        >
          {tErr("goHome")}
        </button>
      </div>
    );
  }

  if (screen === "join") {
    return <JoinScreen roomCode={roomCode} onJoined={handleJoined} />;
  }

  if (screen === "share") {
    const myName = stateData?.participant?.displayName;
    const partner = stateData?.participants.find((p) => p.role === "guest");
    return (
      <ShareScreen
        roomCode={roomCode}
        roomLocale={roomLocale}
        partnerJoined={partnerJoined}
        myName={myName}
        partnerName={partner?.displayName}
        onStartPlaying={handleStartPlaying}
      />
    );
  }

  if (screen === "game" && stateData && token) {
    return (
      <GameScreen
        roomCode={roomCode}
        participantToken={token}
        questions={stateData.questions}
        initialIndex={stateData.progress.answeredCount}
        onComplete={handleGameComplete}
      />
    );
  }

  if (screen === "waiting") {
    return <WaitingScreen roomCode={roomCode} roomLocale={roomLocale} />;
  }

  // results: handled by useEffect redirect
  return null;
}
