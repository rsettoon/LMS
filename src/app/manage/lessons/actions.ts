"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";

export type LessonFormState = { error: string } | undefined;

function parseLesson(formData: FormData) {
  const creditRaw = formData.get("credit_hours");
  const hasCredit = creditRaw !== null && String(creditRaw).trim() !== "";
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    video_url: String(formData.get("video_url") ?? "").trim() || null,
    credit_hours: hasCredit ? Number(creditRaw) : null,
    authoring_entity_id:
      String(formData.get("authoring_entity_id") ?? "").trim() || null,
  };
}

function parseSkillIds(formData: FormData) {
  return formData.getAll("skill_ids").map(String).filter(Boolean);
}

export async function createLesson(
  _prev: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  const { supabase } = await requireCoordinator();

  const lesson = parseLesson(formData);
  if (!lesson.title) return { error: "Title is required." };
  const skillIds = parseSkillIds(formData);

  const { data: inserted, error } = await supabase
    .from("lessons")
    .insert(lesson)
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: error?.message ?? "Could not create the lesson." };
  }

  if (skillIds.length > 0) {
    const rows = skillIds.map((skill_id) => ({
      lesson_id: inserted.id,
      skill_id,
    }));
    const { error: linkError } = await supabase
      .from("lesson_skills")
      .insert(rows);
    if (linkError) return { error: linkError.message };
  }

  revalidatePath("/manage/lessons");
  revalidatePath("/lessons");
  // Land on the new lesson's Edit page so the Quiz step is right there.
  redirect(`/manage/lessons/${inserted.id}/edit`);
}

export async function updateLesson(
  _prev: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  const { supabase } = await requireCoordinator();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing lesson id." };

  const lesson = parseLesson(formData);
  if (!lesson.title) return { error: "Title is required." };
  const skillIds = parseSkillIds(formData);

  const { error } = await supabase.from("lessons").update(lesson).eq("id", id);
  if (error) return { error: error.message };

  // Replace the skill mapping wholesale.
  await supabase.from("lesson_skills").delete().eq("lesson_id", id);
  if (skillIds.length > 0) {
    const rows = skillIds.map((skill_id) => ({ lesson_id: id, skill_id }));
    const { error: linkError } = await supabase
      .from("lesson_skills")
      .insert(rows);
    if (linkError) return { error: linkError.message };
  }

  revalidatePath("/manage/lessons");
  revalidatePath("/lessons");
  redirect("/manage/lessons");
}

export async function deleteLesson(formData: FormData) {
  const { supabase } = await requireCoordinator();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase.from("lessons").delete().eq("id", id);
    revalidatePath("/manage/lessons");
    revalidatePath("/lessons");
  }
  redirect("/manage/lessons");
}

// --- Quick view: read-only snapshot of everything in a lesson ---

export type QuickViewSkill = {
  id: string;
  skill_number: number | null;
  subsection: string | null;
  title: string;
  jpr_code: string | null;
  jpr_designation: string | null;
  condition: string | null;
  time_limit_seconds: number | null;
  steps: { step_number: number; description: string }[];
};

export type QuickViewQuestion = {
  id: string;
  type: "multiple_choice" | "true_false";
  prompt: string;
  options: { id: string; label: string; is_correct: boolean }[];
};

export type LessonContent = {
  title: string;
  description: string | null;
  video_url: string | null;
  credit_hours: number | null;
  authoringEntity: string | null;
  skills: QuickViewSkill[];
  quiz: { passing_score: number; questions: QuickViewQuestion[] } | null;
};

export async function fetchLessonContent(
  lessonId: string,
): Promise<LessonContent | null> {
  const { supabase } = await requireCoordinator();

  const { data: lesson } = await supabase
    .from("lessons")
    .select(
      "title, description, video_url, credit_hours, authoring_entities ( name )",
    )
    .eq("id", lessonId)
    .single();
  if (!lesson) return null;

  // Skills (with their ordered steps)
  const { data: links } = await supabase
    .from("lesson_skills")
    .select("skill_id")
    .eq("lesson_id", lessonId);
  const skillIds = (links ?? []).map((l) => l.skill_id as string);

  let skills: QuickViewSkill[] = [];
  if (skillIds.length > 0) {
    type SkillRow = Omit<QuickViewSkill, "steps"> & {
      skill_steps: { step_number: number; description: string }[] | null;
    };
    const { data } = await supabase
      .from("skills")
      .select(
        "id, skill_number, subsection, title, jpr_code, jpr_designation, condition, time_limit_seconds, skill_steps ( step_number, description )",
      )
      .in("id", skillIds)
      .order("skill_number", { ascending: true, nullsFirst: false })
      .order("subsection", { ascending: true, nullsFirst: true });

    skills = ((data as SkillRow[] | null) ?? []).map((s) => ({
      id: s.id,
      skill_number: s.skill_number,
      subsection: s.subsection,
      title: s.title,
      jpr_code: s.jpr_code,
      jpr_designation: s.jpr_designation,
      condition: s.condition,
      time_limit_seconds: s.time_limit_seconds,
      steps: (s.skill_steps ?? [])
        .slice()
        .sort((a, b) => a.step_number - b.step_number),
    }));
  }

  // Quiz (questions in order, with their options)
  const { data: quizRow } = await supabase
    .from("quizzes")
    .select("id, passing_score")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  let quiz: LessonContent["quiz"] = null;
  if (quizRow) {
    type OptionRow = {
      id: string;
      label: string;
      is_correct: boolean;
      position: number;
    };
    type QRow = {
      position: number;
      questions: {
        id: string;
        type: "multiple_choice" | "true_false";
        prompt: string;
        question_options: OptionRow[] | null;
      } | null;
    };
    const { data: qLinks } = await supabase
      .from("quiz_questions")
      .select(
        "position, questions ( id, type, prompt, question_options ( id, label, is_correct, position ) )",
      )
      .eq("quiz_id", quizRow.id)
      .order("position", { ascending: true });

    const questions = ((qLinks as QRow[] | null) ?? [])
      .map((l) => l.questions)
      .filter((q): q is NonNullable<QRow["questions"]> => Boolean(q))
      .map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        options: (q.question_options ?? [])
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((o) => ({
            id: o.id,
            label: o.label,
            is_correct: o.is_correct,
          })),
      }));

    quiz = { passing_score: quizRow.passing_score, questions };
  }

  return {
    title: lesson.title,
    description: lesson.description,
    video_url: lesson.video_url,
    credit_hours: lesson.credit_hours,
    authoringEntity:
      (lesson.authoring_entities as unknown as { name: string } | null)?.name ??
      null,
    skills,
    quiz,
  };
}
