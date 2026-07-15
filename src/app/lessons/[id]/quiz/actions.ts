"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyProgress } from "@/lib/progress";

export type QuizResult = {
  question_id: string;
  selected_option_id: string | null;
  correct_option_id: string | null;
};

export type QuizResultState =
  | {
      graded: true;
      score: number;
      passed: boolean;
      passingScore: number;
      results: QuizResult[];
    }
  | { error: string }
  | undefined;

type OptionRow = { id: string; is_correct: boolean };
type QuestionRow = { id: string; question_options: OptionRow[] | null };
type LinkRow = { questions: QuestionRow | null };

export async function submitQuiz(
  _prev: QuizResultState,
  formData: FormData,
): Promise<QuizResultState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const quizId = String(formData.get("quiz_id") ?? "");
  if (!quizId) return { error: "Missing quiz." };

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("lesson_id, passing_score")
    .eq("id", quizId)
    .single();
  if (!quiz) return { error: "Quiz not found." };

  // Grade on the server — correct answers come from the DB, not client input.
  const { data: links } = await supabase
    .from("quiz_questions")
    .select("questions ( id, question_options ( id, is_correct ) )")
    .eq("quiz_id", quizId);

  const correctByQuestion = new Map<string, string>();
  for (const l of (links as LinkRow[] | null) ?? []) {
    const q = l.questions;
    if (!q) continue;
    const correct = (q.question_options ?? []).find((o) => o.is_correct);
    if (correct) correctByQuestion.set(q.id, correct.id);
  }

  const total = correctByQuestion.size;
  if (total === 0) return { error: "This quiz has no questions yet." };

  let correctCount = 0;
  const results: QuizResult[] = [];
  for (const [questionId, correctId] of correctByQuestion) {
    const raw = formData.get(`q_${questionId}`);
    const selectedId = raw ? String(raw) : null;
    if (selectedId && selectedId === correctId) correctCount++;
    results.push({
      question_id: questionId,
      selected_option_id: selectedId,
      correct_option_id: correctId,
    });
  }

  const score = Math.round((correctCount / total) * 100);
  const passed = score >= quiz.passing_score;

  await supabase.from("quiz_attempts").insert({
    quiz_id: quizId,
    firefighter_id: user.id,
    score,
    passed,
  });

  if (passed) {
    await applyProgress(supabase, quiz.lesson_id, user.id, {
      quiz_passed: true,
    });
  }

  return { graded: true, score, passed, passingScore: quiz.passing_score, results };
}
