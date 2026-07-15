import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import { deleteQuestion } from "./actions";

type Row = {
  id: string;
  type: "multiple_choice" | "true_false";
  prompt: string;
  quiz_questions: { count: number }[] | null;
};

export default async function QuestionBankPage() {
  const { supabase } = await requireCoordinator();

  const { data } = await supabase
    .from("questions")
    .select("id, type, prompt, quiz_questions(count)")
    .order("prompt", { ascending: true });

  const rows = (data as Row[] | null) ?? [];

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
            >
              ← Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Question bank
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/manage/questions/import"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Import CSV
            </Link>
            <Link
              href="/manage/questions/new"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              + New question
            </Link>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No questions yet. Add one, or import a CSV.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {rows.map((q) => {
              const usedIn = q.quiz_questions?.[0]?.count ?? 0;
              return (
                <li
                  key={q.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                      {q.prompt}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {q.type === "true_false"
                        ? "True / False"
                        : "Multiple choice"}
                      {" · "}
                      in {usedIn} quiz{usedIn === 1 ? "" : "zes"}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Link
                      href={`/manage/questions/${q.id}`}
                      className="text-sm text-red-600 hover:underline"
                    >
                      View
                    </Link>
                    <Link
                      href={`/manage/questions/${q.id}/edit`}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <form action={deleteQuestion}>
                      <input type="hidden" name="id" value={q.id} />
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
