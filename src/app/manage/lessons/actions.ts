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
  redirect("/manage/lessons");
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
}
