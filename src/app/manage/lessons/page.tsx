import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import { deleteLesson } from "./actions";

export default async function ManageLessonsPage() {
  const { supabase } = await requireCoordinator();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, credit_hours, lesson_skills(count)")
    .order("title", { ascending: true });

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
            >
              ← Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Lessons
            </h1>
          </div>
          <Link
            href="/manage/lessons/new"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            + New lesson
          </Link>
        </div>

        {!lessons || lessons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No lessons yet. Click{" "}
            <span className="font-medium">New lesson</span> to create your first.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {lessons.map((lesson) => {
              const skillCount =
                (lesson.lesson_skills as { count: number }[] | null)?.[0]
                  ?.count ?? 0;
              return (
                <li
                  key={lesson.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                      {lesson.title}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {lesson.credit_hours != null
                        ? `${lesson.credit_hours} hr`
                        : "No credit set"}
                      {" · "}
                      {skillCount} skill{skillCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Link
                      href={`/manage/lessons/${lesson.id}/edit`}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/manage/lessons/${lesson.id}/quiz`}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Quiz
                    </Link>
                    <form action={deleteLesson}>
                      <input type="hidden" name="id" value={lesson.id} />
                      <button
                        type="submit"
                        className="text-sm text-zinc-500 hover:text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
