import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import QuestionsBrowser, { type QuestionRow } from "./QuestionsBrowser";

type Row = {
  id: string;
  type: "multiple_choice" | "true_false";
  prompt: string;
  category_id: string | null;
  question_categories: { name: string } | null;
  quiz_questions: { count: number }[] | null;
};

export default async function QuestionBankPage() {
  const { supabase } = await requireCoordinator();

  const { data } = await supabase
    .from("questions")
    .select(
      "id, type, prompt, category_id, question_categories ( name ), quiz_questions(count)",
    )
    .order("prompt", { ascending: true });

  const { data: categories } = await supabase
    .from("question_categories")
    .select("id, name")
    .order("name", { ascending: true });

  const rows: QuestionRow[] = ((data as unknown as Row[] | null) ?? []).map(
    (q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      categoryId: q.category_id,
      categoryName: q.question_categories?.name ?? null,
      usedIn: q.quiz_questions?.[0]?.count ?? 0,
    }),
  );

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
              href="/manage/question-categories"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Categories
            </Link>
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
          <QuestionsBrowser questions={rows} categories={categories ?? []} />
        )}
      </div>
    </main>
  );
}
