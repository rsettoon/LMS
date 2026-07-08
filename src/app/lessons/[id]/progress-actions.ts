"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyProgress } from "@/lib/progress";

export async function markWatched(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const lessonId = String(formData.get("lesson_id") ?? "");
  if (!lessonId) return;

  await applyProgress(supabase, lessonId, user.id, { video_watched: true });
  revalidatePath(`/lessons/${lessonId}`);
}
