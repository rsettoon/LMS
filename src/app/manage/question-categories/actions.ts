"use server";

import { revalidatePath } from "next/cache";
import { requireCoordinator } from "@/lib/auth";

export async function createQuestionCategory(formData: FormData) {
  const { supabase } = await requireCoordinator();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await supabase.from("question_categories").insert({ name });
  revalidatePath("/manage/question-categories");
  revalidatePath("/manage/questions");
}

export async function deleteQuestionCategory(formData: FormData) {
  const { supabase } = await requireCoordinator();
  const id = String(formData.get("id") ?? "");
  if (id) {
    // Questions referencing it are set to null via ON DELETE SET NULL.
    await supabase.from("question_categories").delete().eq("id", id);
    revalidatePath("/manage/question-categories");
    revalidatePath("/manage/questions");
  }
}
