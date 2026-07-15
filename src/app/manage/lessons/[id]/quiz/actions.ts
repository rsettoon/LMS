"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";

export type QuizFormState = { error: string } | undefined;

export async function saveQuiz(
  _prev: QuizFormState,
  formData: FormData,
): Promise<QuizFormState> {
  const { supabase } = await requireCoordinator();

  const lessonId = String(formData.get("lesson_id") ?? "");
  if (!lessonId) return { error: "Missing lesson id." };

  const passingScore = Number(formData.get("passing_score"));
  if (
    !Number.isFinite(passingScore) ||
    passingScore < 1 ||
    passingScore > 100
  ) {
    return { error: "Passing score must be between 1 and 100." };
  }

  const questionIds = formData.getAll("question_ids").map(String).filter(Boolean);

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

  // Replace the question links with the current selection.
  await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
  if (questionIds.length > 0) {
    const rows = questionIds.map((question_id, i) => ({
      quiz_id: quizId,
      question_id,
      position: i + 1,
    }));
    const { error } = await supabase.from("quiz_questions").insert(rows);
    if (error) return { error: error.message };
  }

  revalidatePath("/manage/lessons");
  revalidatePath(`/lessons/${lessonId}`);
  redirect("/manage/lessons");
}
