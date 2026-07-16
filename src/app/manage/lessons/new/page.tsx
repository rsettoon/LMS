import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import LessonForm from "../LessonForm";
import { createLesson } from "../actions";

export default async function NewLessonPage() {
  const { supabase } = await requireCoordinator();

  const { data: skills } = await supabase
    .from("skills")
    .select("id, skill_number, subsection, title, jpr_code")
    .order("skill_number", { ascending: true, nullsFirst: false })
    .order("subsection", { ascending: true, nullsFirst: true });

  const { data: entities } = await supabase
    .from("authoring_entities")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/manage/lessons"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Lessons
        </Link>
        <div className="mt-1 mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            New lesson
          </h1>
          <button
            type="button"
            disabled
            title="Save the lesson first, then you can build its quiz."
            className="cursor-not-allowed rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-400 opacity-60 dark:border-zinc-700 dark:text-zinc-500"
          >
            Quiz →
          </button>
        </div>
        <p className="-mt-4 mb-6 text-xs text-zinc-500 dark:text-zinc-400">
          Save the lesson first — then the Quiz button becomes available.
        </p>
        <LessonForm
          action={createLesson}
          skills={skills ?? []}
          entities={entities ?? []}
        />
      </div>
    </main>
  );
}
