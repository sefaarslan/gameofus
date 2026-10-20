// Veritabanı → AI yorum girdisi. Yalnızca YAPILANDIRILMIŞ oyun verisi okunur (soru + seçenek metni, cevap, tahmin, güven);
// kimlik/token/e-posta/doğum tarihi modele gitmez (doğum tarihi yalnızca yaş aralığına çevrilir, bkz. digest.ts).

import { createAdminClient } from "@/lib/supabase/server";
import { ageBandFor } from "./digest.ts";
import { zodiacSignFor } from "./zodiac.ts";
import type { Confidence, Locale, Mode, RawProfile, RawQuestion, RawRoom, RawValue, RelationshipType } from "./digest.ts";

type QuestionRow = {
  id: string;
  mode: string;
  question_text: string;
  insight_tag: string;
  question_options: Array<{ id: string; option_text: string; sort_order: number }>;
};

type DetailEntry = {
  questionId: string;
  mode: string;
  roundOrder: number;
  answers: Array<{ participantId: string; answerValue: unknown }>;
  predictions: Array<{ predictorId: string; targetId: string; predictedValue: unknown; confidenceLevel: string }>;
};

const LOCALES: Locale[] = ["tr", "en", "es"];
const RELS: RelationshipType[] = ["friend", "dating", "partner"];
const MODES: Mode[] = ["secret_choice", "prediction", "orderline"];

export async function loadRawRoom(roomId: string, locale: string, relationshipType: string | null): Promise<RawRoom | null> {
  const supabase = createAdminClient();
  const [{ data: parts }, { data: result }, { data: rqs }] = await Promise.all([
    supabase.from("participants").select("id, role, display_name, gender, birth_date").eq("room_id", roomId),
    supabase.from("results").select("details_json").eq("room_id", roomId).maybeSingle(),
    supabase
      .from("room_questions")
      .select("question_id, questions(id, mode, question_text, insight_tag, question_options(id, option_text, sort_order))")
      .eq("room_id", roomId),
  ]);

  const owner = parts?.find((p) => p.role === "owner");
  const guest = parts?.find((p) => p.role === "guest");
  if (!owner || !guest || !result) return null;

  const questionMap = new Map<string, QuestionRow>(
    (rqs ?? []).filter((rq) => rq.questions).map((rq) => [rq.question_id, rq.questions as unknown as QuestionRow]),
  );
  const profile = (p: { gender: string | null; birth_date: string | null }): RawProfile => ({
    gender: p.gender === "female" || p.gender === "male" ? p.gender : null,
    ageBand: ageBandFor(p.birth_date),
    sign: zodiacSignFor(p.birth_date),
  });

  const details = (result.details_json as DetailEntry[] | null) ?? [];
  const questions: RawQuestion[] = [];
  for (const d of details.slice().sort((a, b) => a.roundOrder - b.roundOrder)) {
    const q = questionMap.get(d.questionId);
    if (!q || !MODES.includes(q.mode as Mode)) continue;
    const ans = (pid: string) => d.answers.find((a) => a.participantId === pid)?.answerValue as RawValue | undefined;
    const pred = (by: string, about: string) => d.predictions.find((p) => p.predictorId === by && p.targetId === about);
    const answerA = ans(owner.id);
    const answerB = ans(guest.id);
    const gAB = pred(owner.id, guest.id);
    const gBA = pred(guest.id, owner.id);
    if (!answerA || !answerB || !gAB || !gBA) continue; // eksik veri: bu soruyu atla
    const conf = (c: string): Confidence => (c === "sure" || c === "think" ? c : "guess");
    questions.push({
      mode: q.mode as Mode,
      tag: q.insight_tag,
      text: q.question_text,
      options: q.question_options?.length
        ? q.question_options.slice().sort((a, b) => a.sort_order - b.sort_order).map((o) => ({ id: o.id, text: o.option_text }))
        : null,
      answerA,
      answerB,
      guessAboutB: { value: gAB.predictedValue as RawValue, confidence: conf(gAB.confidenceLevel) },
      guessAboutA: { value: gBA.predictedValue as RawValue, confidence: conf(gBA.confidenceLevel) },
    });
  }
  if (questions.length === 0) return null;

  return {
    locale: (LOCALES as string[]).includes(locale) ? (locale as Locale) : "tr",
    // İlişki türü bilinmiyorsa (eski odalar) romantik çağrışım riskini önlemek için en güvenli dil olan "friend" kullanılır.
    relationshipType: (RELS as string[]).includes(relationshipType ?? "") ? (relationshipType as RelationshipType) : "friend",
    nameA: owner.display_name ?? "A",
    nameB: guest.display_name ?? "B",
    profileA: profile(owner),
    profileB: profile(guest),
    questions,
  };
}
