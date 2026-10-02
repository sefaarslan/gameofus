export type WantsAi = "yes" | "maybe" | "no";

export const FEEDBACK_FACES = ["😞", "😕", "😐", "🙂", "😍"] as const;

export const feedbackKeys = (roomCode: string) => ({
  done: `gou_feedback_${roomCode}`,
  prompted: `gou_feedback_prompted_${roomCode}`,
});

export function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

export function writeFlag(key: string, value = "1") {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* localStorage kapalı olabilir */
  }
}

export async function sendFeedback(params: {
  roomCode: string;
  participantToken: string;
  rating: number;
  wantsAi?: WantsAi | null;
  comment?: string;
}) {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roomCode: params.roomCode,
      participantToken: params.participantToken,
      rating: params.rating,
      wantsAi: params.wantsAi ?? undefined,
      comment: params.comment?.trim() ? params.comment.trim() : undefined,
    }),
  });
  if (!res.ok) throw new Error("feedback failed");
}
