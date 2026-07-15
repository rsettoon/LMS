"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";

export type SkillFormState = { error: string } | undefined;

function parseSkill(formData: FormData) {
  const minutes = Number(formData.get("minutes") ?? 0);
  const seconds = Number(formData.get("seconds") ?? 0);
  const totalSeconds =
    (Number.isFinite(minutes) ? minutes : 0) * 60 +
    (Number.isFinite(seconds) ? seconds : 0);

  const skillNumberRaw = formData.get("skill_number");

  return {
    skill_number: skillNumberRaw ? Number(skillNumberRaw) : null,
    subsection: String(formData.get("subsection") ?? "").trim() || null,
    title: String(formData.get("title") ?? "").trim(),
    nfpa_edition: String(formData.get("nfpa_edition") ?? "").trim() || null,
    jpr_code: String(formData.get("jpr_code") ?? "").trim() || null,
    jpr_designation:
      String(formData.get("jpr_designation") ?? "").trim() || null,
    condition: String(formData.get("condition") ?? "").trim() || null,
    time_limit_seconds: totalSeconds || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    authoring_entity_id:
      String(formData.get("authoring_entity_id") ?? "").trim() || null,
  };
}

// Each step bullet is submitted as a separate input named "step".
function parseSteps(formData: FormData) {
  return formData
    .getAll("step")
    .map((s) => String(s).trim())
    .filter(Boolean);
}

export async function createSkill(
  _prev: SkillFormState,
  formData: FormData,
): Promise<SkillFormState> {
  const { supabase } = await requireCoordinator();

  const skill = parseSkill(formData);
  if (!skill.title) return { error: "Title is required." };
  const steps = parseSteps(formData);

  const { data: inserted, error } = await supabase
    .from("skills")
    .insert(skill)
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: error?.message ?? "Could not create the skill." };
  }

  if (steps.length > 0) {
    const rows = steps.map((description, i) => ({
      skill_id: inserted.id,
      step_number: i + 1,
      description,
    }));
    const { error: stepError } = await supabase
      .from("skill_steps")
      .insert(rows);
    if (stepError) return { error: stepError.message };
  }

  revalidatePath("/manage/skills");
  redirect("/manage/skills");
}

export async function updateSkill(
  _prev: SkillFormState,
  formData: FormData,
): Promise<SkillFormState> {
  const { supabase } = await requireCoordinator();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing skill id." };

  const skill = parseSkill(formData);
  if (!skill.title) return { error: "Title is required." };
  const steps = parseSteps(formData);

  const { error } = await supabase.from("skills").update(skill).eq("id", id);
  if (error) return { error: error.message };

  // Replace the step list wholesale — simplest correct approach.
  await supabase.from("skill_steps").delete().eq("skill_id", id);
  if (steps.length > 0) {
    const rows = steps.map((description, i) => ({
      skill_id: id,
      step_number: i + 1,
      description,
    }));
    const { error: stepError } = await supabase
      .from("skill_steps")
      .insert(rows);
    if (stepError) return { error: stepError.message };
  }

  revalidatePath("/manage/skills");
  redirect("/manage/skills");
}

export async function deleteSkill(formData: FormData) {
  const { supabase } = await requireCoordinator();
  const id = String(formData.get("id") ?? "");
  if (id) {
    // skill_steps rows are removed automatically via ON DELETE CASCADE.
    await supabase.from("skills").delete().eq("id", id);
    revalidatePath("/manage/skills");
  }
  redirect("/manage/skills");
}
