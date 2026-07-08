"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";

export type AssignmentFormState = { error: string } | undefined;

export async function createAssignment(
  _prev: AssignmentFormState,
  formData: FormData,
): Promise<AssignmentFormState> {
  const { supabase, user } = await requireCoordinator();

  const lessonId = String(formData.get("lesson_id") ?? "");
  if (!lessonId) return { error: "Please choose a lesson." };

  const target = String(formData.get("target") ?? "individuals");
  const dueRaw = String(formData.get("due_date") ?? "").trim();
  const dueDate = dueRaw || null;

  // Resolve the target firefighters (snapshot at assign time).
  let firefighterIds: string[] = [];
  if (target === "everyone") {
    const { data: firefighters } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "firefighter");
    firefighterIds = (firefighters ?? []).map((f) => f.id as string);
  } else {
    firefighterIds = formData.getAll("firefighter_ids").map(String).filter(Boolean);
  }

  if (firefighterIds.length === 0) {
    return { error: "Select at least one firefighter (or choose Everyone)." };
  }

  const rows = firefighterIds.map((firefighter_id) => ({
    lesson_id: lessonId,
    firefighter_id,
    assigned_by: user.id,
    due_date: dueDate,
  }));

  // Upsert so re-assigning updates the due date instead of erroring.
  const { error } = await supabase
    .from("assignments")
    .upsert(rows, { onConflict: "lesson_id,firefighter_id" });
  if (error) return { error: error.message };

  revalidatePath("/manage/assignments");
  redirect("/manage/assignments");
}

export async function updateAssignmentDueDate(formData: FormData) {
  const { supabase } = await requireCoordinator();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const dueRaw = String(formData.get("due_date") ?? "").trim();
  await supabase
    .from("assignments")
    .update({ due_date: dueRaw || null })
    .eq("id", id);
  revalidatePath("/manage/assignments");
}

export async function deleteAssignment(formData: FormData) {
  const { supabase } = await requireCoordinator();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase.from("assignments").delete().eq("id", id);
    revalidatePath("/manage/assignments");
  }
}
