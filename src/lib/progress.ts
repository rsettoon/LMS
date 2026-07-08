import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Upsert a firefighter's progress on a lesson and recompute completion.
// Completion rule: video watched AND (quiz passed OR the lesson has no quiz).
// On first completion, credit the lesson's current credit_hours.
export async function applyProgress(
  supabase: SupabaseClient,
  lessonId: string,
  userId: string,
  patch: { video_watched?: boolean; quiz_passed?: boolean },
) {
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("lesson_id", lessonId)
    .eq("firefighter_id", userId)
    .maybeSingle();

  // Both flags are one-way (false -> true); never unset.
  const videoWatched = patch.video_watched || existing?.video_watched || false;
  const quizPassed = patch.quiz_passed || existing?.quiz_passed || false;

  const videoWatchedAt =
    patch.video_watched && !existing?.video_watched
      ? now
      : (existing?.video_watched_at ?? null);
  const quizPassedAt =
    patch.quiz_passed && !existing?.quiz_passed
      ? now
      : (existing?.quiz_passed_at ?? null);

  // Does this lesson have a quiz?
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("lesson_id", lessonId)
    .maybeSingle();
  const hasQuiz = !!quiz;

  const isComplete = videoWatched && (quizPassed || !hasQuiz);

  let completedAt: string | null = existing?.completed_at ?? null;
  let hoursAwarded: number | null = existing?.hours_awarded ?? null;

  if (isComplete && !completedAt) {
    completedAt = now;
    const { data: lesson } = await supabase
      .from("lessons")
      .select("credit_hours")
      .eq("id", lessonId)
      .single();
    hoursAwarded = lesson?.credit_hours ?? null;
  }

  await supabase.from("lesson_progress").upsert(
    {
      lesson_id: lessonId,
      firefighter_id: userId,
      video_watched: videoWatched,
      video_watched_at: videoWatchedAt,
      quiz_passed: quizPassed,
      quiz_passed_at: quizPassedAt,
      completed_at: completedAt,
      hours_awarded: hoursAwarded,
      updated_at: now,
    },
    { onConflict: "lesson_id,firefighter_id" },
  );
}
