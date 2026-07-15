"use server";

import { revalidatePath } from "next/cache";
import { requireCoordinator } from "@/lib/auth";
import { parseCsvWithHeaders } from "@/lib/csv";

export type QuizImportState =
  | {
      lessons: number;
      questions: number;
      warnings: string[];
      errors: string[];
    }
  | { error: string }
  | undefined;

type Draft = {
  type: "multiple_choice" | "true_false";
  prompt: string;
  options: string[];
  correctIndex: number;
};

export async function importQuizzes(
  _prev: QuizImportState,
  formData: FormData,
): Promise<QuizImportState> {
  const { supabase } = await requireCoordinator();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a CSV file." };
  }

  const rows = parseCsvWithHeaders(await file.text());
  if (rows.length === 0) {
    return { error: "No data rows found. Is the header row present?" };
  }

  const { data: lessons } = await supabase.from("lessons").select("id, title");
  const lessonByTitle = new Map(
    (lessons ?? []).map((l) => [
      String(l.title).trim().toLowerCase(),
      l.id as string,
    ]),
  );

  // Group question rows by lesson.
  const groups = new Map<string, Record<string, string>[]>();
  for (const r of rows) {
    const title = (r.lesson_title ?? "").trim();
    if (!title) continue;
    const key = title.toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  let lessonCount = 0;
  let questionCount = 0;

  for (const [key, qrows] of groups) {
    const displayTitle = (qrows[0].lesson_title ?? "").trim();
    const lessonId = lessonByTitle.get(key);
    if (!lessonId) {
      errors.push(
        `No lesson titled "${displayTitle}" — skipped ${qrows.length} question(s).`,
      );
      continue;
    }

    const passingRaw = qrows.find((r) => r.passing_score)?.passing_score ?? "";
    let passingScore = Number(passingRaw);
    if (!Number.isFinite(passingScore) || passingScore < 1 || passingScore > 100) {
      if (passingRaw) {
        warnings.push(
          `Invalid passing_score "${passingRaw}" for "${displayTitle}" — used 80.`,
        );
      }
      passingScore = 80;
    }

    const drafts: Draft[] = [];
    qrows.forEach((r, idx) => {
      const prompt = (r.prompt ?? "").trim();
      if (!prompt) {
        errors.push(`"${displayTitle}" row ${idx + 1}: missing prompt.`);
        return;
      }

      const rawType = (r.question_type ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s\-/]/g, "_");
      const type: Draft["type"] =
        rawType === "true_false" || rawType === "tf" || rawType === "truefalse"
          ? "true_false"
          : "multiple_choice";

      let options: string[];
      if (type === "true_false") {
        const a = (r.option_a ?? "").trim();
        const b = (r.option_b ?? "").trim();
        options = a && b ? [a, b] : ["True", "False"];
      } else {
        options = [r.option_a, r.option_b, r.option_c, r.option_d, r.option_e]
          .map((v) => (v ?? "").trim())
          .filter(Boolean);
      }

      if (options.length < 2) {
        errors.push(
          `"${displayTitle}": needs at least 2 options — "${prompt.slice(0, 40)}"`,
        );
        return;
      }

      // "correct" may be a letter (A/B/C/D) or the exact option text.
      const correctRaw = (r.correct ?? "").trim();
      let correctIndex = -1;
      if (/^[a-zA-Z]$/.test(correctRaw)) {
        correctIndex = correctRaw.toUpperCase().charCodeAt(0) - 65;
      }
      if (correctIndex < 0 || correctIndex >= options.length) {
        correctIndex = options.findIndex(
          (o) => o.toLowerCase() === correctRaw.toLowerCase(),
        );
      }
      if (correctIndex < 0 || correctIndex >= options.length) {
        errors.push(
          `"${displayTitle}": can't tell which answer is correct ("${correctRaw}") — "${prompt.slice(0, 40)}"`,
        );
        return;
      }

      drafts.push({ type, prompt, options, correctIndex });
    });

    if (drafts.length === 0) {
      errors.push(`No valid questions for "${displayTitle}".`);
      continue;
    }

    // One quiz per lesson: create it, or replace the existing questions.
    const { data: existingQuiz } = await supabase
      .from("quizzes")
      .select("id")
      .eq("lesson_id", lessonId)
      .maybeSingle();

    let quizId: string;
    if (existingQuiz) {
      quizId = existingQuiz.id;
      await supabase
        .from("quizzes")
        .update({ passing_score: passingScore })
        .eq("id", quizId);
      await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
    } else {
      const { data: inserted, error } = await supabase
        .from("quizzes")
        .insert({ lesson_id: lessonId, passing_score: passingScore })
        .select("id")
        .single();
      if (error || !inserted) {
        errors.push(`${displayTitle}: ${error?.message ?? "could not create quiz"}`);
        continue;
      }
      quizId = inserted.id;
    }

    for (const [qi, q] of drafts.entries()) {
      const { data: insertedQ, error: qError } = await supabase
        .from("quiz_questions")
        .insert({
          quiz_id: quizId,
          type: q.type,
          prompt: q.prompt,
          position: qi + 1,
        })
        .select("id")
        .single();
      if (qError || !insertedQ) {
        errors.push(`${displayTitle}: ${qError?.message ?? "question failed"}`);
        continue;
      }

      const optionRows = q.options.map((label, oi) => ({
        question_id: insertedQ.id,
        label,
        is_correct: oi === q.correctIndex,
        position: oi + 1,
      }));
      const { error: oError } = await supabase
        .from("quiz_options")
        .insert(optionRows);
      if (oError) errors.push(`${displayTitle}: ${oError.message}`);
      else questionCount++;
    }

    lessonCount++;
    revalidatePath(`/lessons/${lessonId}`);
  }

  revalidatePath("/manage/lessons");
  return { lessons: lessonCount, questions: questionCount, warnings, errors };
}
