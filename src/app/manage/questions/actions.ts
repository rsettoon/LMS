"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";

export type QuestionFormState = { error: string } | undefined;

type OptionDraft = { label: string; is_correct: boolean };
type Payload = {
  type: "multiple_choice" | "true_false";
  prompt: string;
  options: OptionDraft[];
};

function parsePayload(formData: FormData): Payload | null {
  try {
    return JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return null;
  }
}

function validate(payload: Payload | null): string | null {
  if (!payload) return "Could not read the question data.";
  if (!payload.prompt?.trim()) return "The question prompt is required.";
  const opts = payload.options ?? [];
  if (opts.length < 2) return "Add at least two answer options.";
  if (opts.some((o) => !o.label?.trim())) return "An answer option is empty.";
  if (opts.filter((o) => o.is_correct).length !== 1)
    return "Mark exactly one option as correct.";
  return null;
}

function parseLabels(formData: FormData) {
  return {
    categoryId: String(formData.get("category_id") ?? "").trim() || null,
    skillIds: formData.getAll("skill_ids").map(String).filter(Boolean),
  };
}

async function replaceSkillLinks(
  supabase: Awaited<ReturnType<typeof requireCoordinator>>["supabase"],
  questionId: string,
  skillIds: string[],
) {
  await supabase.from("question_skills").delete().eq("question_id", questionId);
  if (skillIds.length > 0) {
    const rows = skillIds.map((skill_id) => ({
      question_id: questionId,
      skill_id,
    }));
    const { error } = await supabase.from("question_skills").insert(rows);
    if (error) return error.message;
  }
  return null;
}

export async function createQuestion(
  _prev: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  const { supabase } = await requireCoordinator();

  const payload = parsePayload(formData);
  const problem = validate(payload);
  if (problem) return { error: problem };
  const { categoryId, skillIds } = parseLabels(formData);

  const { data: inserted, error } = await supabase
    .from("questions")
    .insert({
      type: payload!.type,
      prompt: payload!.prompt.trim(),
      category_id: categoryId,
    })
    .select("id")
    .single();
  if (error || !inserted)
    return { error: error?.message ?? "Could not create the question." };

  const optionRows = payload!.options.map((o, i) => ({
    question_id: inserted.id,
    label: o.label.trim(),
    is_correct: !!o.is_correct,
    position: i + 1,
  }));
  const { error: optError } = await supabase
    .from("question_options")
    .insert(optionRows);
  if (optError) return { error: optError.message };

  const linkError = await replaceSkillLinks(supabase, inserted.id, skillIds);
  if (linkError) return { error: linkError };

  revalidatePath("/manage/questions");
  redirect("/manage/questions");
}

export async function updateQuestion(
  _prev: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  const { supabase } = await requireCoordinator();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing question id." };

  const payload = parsePayload(formData);
  const problem = validate(payload);
  if (problem) return { error: problem };
  const { categoryId, skillIds } = parseLabels(formData);

  const { error } = await supabase
    .from("questions")
    .update({
      type: payload!.type,
      prompt: payload!.prompt.trim(),
      category_id: categoryId,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  const linkError = await replaceSkillLinks(supabase, id, skillIds);
  if (linkError) return { error: linkError };

  // Replace options (edits propagate to every quiz using this question).
  await supabase.from("question_options").delete().eq("question_id", id);
  const optionRows = payload!.options.map((o, i) => ({
    question_id: id,
    label: o.label.trim(),
    is_correct: !!o.is_correct,
    position: i + 1,
  }));
  const { error: optError } = await supabase
    .from("question_options")
    .insert(optionRows);
  if (optError) return { error: optError.message };

  revalidatePath("/manage/questions");
  redirect("/manage/questions");
}

export async function deleteQuestion(formData: FormData) {
  const { supabase } = await requireCoordinator();
  const id = String(formData.get("id") ?? "");
  if (id) {
    // question_options and quiz_questions links cascade away.
    await supabase.from("questions").delete().eq("id", id);
    revalidatePath("/manage/questions");
  }
  redirect("/manage/questions");
}
