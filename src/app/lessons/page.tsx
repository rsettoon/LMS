import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/app/components/AppHeader";
import LessonsBrowser, { type LessonItem } from "./LessonsBrowser";

type LessonRow = {
  id: string;
  title: string;
  description: string | null;
  credit_hours: number | null;
};
type ProgressRow = {
  lesson_id: string;
  video_watched: boolean;
  quiz_passed: boolean;
  completed_at: string | null;
};

export default async function LessonsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, description, credit_hours")
    .order("title", { ascending: true });

  const progressByLesson = new Map<string, ProgressRow>();
  const assignedSet = new Set<string>();
  if (user) {
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id, video_watched, quiz_passed, completed_at")
      .eq("firefighter_id", user.id);
    for (const p of (progress as ProgressRow[] | null) ?? [])
      progressByLesson.set(p.lesson_id, p);

    const { data: assignments } = await supabase
      .from("assignments")
      .select("lesson_id")
      .eq("firefighter_id", user.id);
    for (const a of assignments ?? []) assignedSet.add(a.lesson_id as string);
  }

  const items: LessonItem[] = ((lessons as LessonRow[] | null) ?? []).map(
    (l) => {
      const p = progressByLesson.get(l.id);
      let status: LessonItem["status"] = "not_started";
      if (p?.completed_at) status = "completed";
      else if (p?.video_watched || p?.quiz_passed) status = "in_progress";
      return {
        id: l.id,
        title: l.title,
        description: l.description,
        credit_hours: l.credit_hours,
        status,
        assigned: assignedSet.has(l.id),
      };
    },
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Lessons
        </h1>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No lessons are available yet.
          </div>
        ) : (
          <LessonsBrowser lessons={items} />
        )}
      </main>
    </div>
  );
}
