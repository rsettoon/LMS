import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/app/components/AppHeader";

export default async function LessonsPage() {
  const supabase = await createClient();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, description, credit_hours")
    .order("title", { ascending: true });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Lessons
        </h1>

        {!lessons || lessons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No lessons are available yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-800"
              >
                <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {lesson.title}
                </div>
                {lesson.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {lesson.description}
                  </p>
                )}
                {lesson.credit_hours != null && (
                  <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">
                    {lesson.credit_hours} training hour
                    {lesson.credit_hours === 1 ? "" : "s"}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
