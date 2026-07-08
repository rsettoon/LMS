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
        <h1 className="mt-1 mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          New lesson
        </h1>
        <LessonForm
          action={createLesson}
          skills={skills ?? []}
          entities={entities ?? []}
        />
      </div>
    </main>
  );
}
