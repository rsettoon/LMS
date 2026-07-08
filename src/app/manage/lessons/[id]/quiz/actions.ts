"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";

export type QuizFormState = { error: string } | undefined;

type OptionDraft = { label: string; is_correct: boolean };
type QuestionDraft = {
  type: "multiple_choice" | "true_false";
  prompt: string;
  options: OptionDraft[];
};
type Payload = { passing_score: number; questions: QuestionDraft[] };

export async function saveQuiz(
  _prev: QuizFormState,
  formData: FormData,
): Promise<QuizFormState> {
  const { supabase } = await requireCoordinator();

  const lessonId = String(formData.get("lesson_id") ?? "");
  if (!lessonId) return { error: "Missing lesson id." };

  let payload: Payload;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { error: "Could not read the quiz data." };
  }

  const passingScore = Number(payload.passing_score);
  if (
    !Number.isFinite(passingScore) ||
    passingScore < 1 ||
    passingScore > 100
  ) {
    return { error: "Passing score must be between 1 and 100." };
  }

  const questions = payload.questions ?? [];
  if (questions.length === 0) return { error: "Add at least one question." };

  for (const [i, q] of questions.entries()) {
    if (!q.prompt?.trim()) return { error: `Question ${i + 1} needs a prompt.` };
    const opts = q.options ?? [];
    if (opts.length < 2)
      return { error: `Question ${i + 1} needs at least two options.` };
    if (opts.some((o) => !o.label?.trim()))
      return { error: `Question ${i + 1} has an empty answer option.` };
    if (opts.filter((o) => o.is_correct).length !== 1)
      return {
        error: `Question ${i + 1} must have exactly one correct answer.`,
      };
  }

  // One quiz per lesson: update if it exists, otherwise create.
  const { data: existing } = await supabase
    .from("quizzes")
    .select("id")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  let quizId: string;
  if (existing) {
    quizId = existing.id;
    const { error } = await supabase
      .from("quizzes")
      .update({ passing_score: passingScore })
      .eq("id", quizId);
    if (error) return { error: error.message };
    // Replace all questions (options cascade-delete with them).
    await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
  } else {
    const { data: inserted, error } = await supabase
      .from("quizzes")
      .insert({ lesson_id: lessonId, passing_score: passingScore })
      .select("id")
      .single();
    if (error || !inserted)
      return { error: error?.message ?? "Could not create the quiz." };
    quizId = inserted.id;
  }

  for (const [qi, q] of questions.entries()) {
    const { data: insertedQ, error: qErr } = await supabase
      .from("quiz_questions")
      .insert({
        quiz_id: quizId,
        type: q.type,
        prompt: q.prompt.trim(),
        position: qi + 1,
      })
      .select("id")
      .single();
    if (qErr || !insertedQ)
      return { error: qErr?.message ?? "Could not save a question." };

    const optionRows = q.options.map((o, oi) => ({
      question_id: insertedQ.id,
      label: o.label.trim(),
      is_correct: !!o.is_correct,
      position: oi + 1,
    }));
    const { error: oErr } = await supabase
      .from("quiz_options")
      .insert(optionRows);
    if (oErr) return { error: oErr.message };
  }

  revalidatePath("/manage/lessons");
  revalidatePath(`/lessons/${lessonId}`);
  redirect("/manage/lessons");
}
