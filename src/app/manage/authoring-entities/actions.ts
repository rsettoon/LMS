"use server";

import { revalidatePath } from "next/cache";
import { requireCoordinator } from "@/lib/auth";

export async function createAuthoringEntity(formData: FormData) {
  const { supabase } = await requireCoordinator();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const { error } = await supabase
    .from("authoring_entities")
    .insert({ name });

  // Ignore duplicate-name errors quietly; surface nothing for this simple form.
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    // Non-duplicate errors are unexpected; still revalidate so the UI is fresh.
  }

  revalidatePath("/manage/authoring-entities");
}

export async function deleteAuthoringEntity(formData: FormData) {
  const { supabase } = await requireCoordinator();
  const id = String(formData.get("id") ?? "");
  if (id) {
    // Skills/lessons referencing it are set to null via ON DELETE SET NULL.
    await supabase.from("authoring_entities").delete().eq("id", id);
    revalidatePath("/manage/authoring-entities");
  }
}
