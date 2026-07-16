import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import {
  createQuestionCategory,
  deleteQuestionCategory,
} from "./actions";

export default async function QuestionCategoriesPage() {
  const { supabase } = await requireCoordinator();

  const { data: categories } = await supabase
    .from("question_categories")
    .select("id, name, questions(count)")
    .order("name", { ascending: true });

  type Row = { id: string; name: string; questions: { count: number }[] | null };
  const rows = (categories as Row[] | null) ?? [];

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/manage/questions"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Question bank
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Question categories
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Broad groupings (e.g. SCBA, Ladders, Ropes) used to organize and
          filter questions.
        </p>

        <form
          action={createQuestionCategory}
          className="mb-6 flex items-center gap-2"
        >
          <input
            name="name"
            type="text"
            required
            placeholder="e.g. SCBA"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <button
            type="submit"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Add
          </button>
        </form>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No categories yet. Add your first one above.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {rows.map((c) => {
              const used = c.questions?.[0]?.count ?? 0;
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div>
                    <span className="text-zinc-900 dark:text-zinc-50">
                      {c.name}
                    </span>
                    <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {used} question{used === 1 ? "" : "s"}
                    </span>
                  </div>
                  <form action={deleteQuestionCategory}>
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      className="text-sm text-zinc-500 hover:text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
