import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import { deleteQuestion } from "../actions";

type Option = { id: string; label: string; is_correct: boolean; position: number };
type UsageRow = {
  quizzes: { lesson_id: string; lessons: { title: string } | null } | null;
};

export default async function ViewQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireCoordinator();
  const { id } = await params;

  const { data: question } = await supabase
    .from("questions")
    .select("id, type, prompt")
    .eq("id", id)
    .single();
  if (!question) notFound();

  const { data: opts } = await supabase
    .from("question_options")
    .select("id, label, is_correct, position")
    .eq("question_id", id)
    .order("position", { ascending: true });
  const options = (opts as Option[] | null) ?? [];

  // Which lessons' quizzes use this question?
  const { data: usageData } = await supabase
    .from("quiz_questions")
    .select("quizzes ( lesson_id, lessons ( title ) )")
    .eq("question_id", id);
  const usage = ((usageData as UsageRow[] | null) ?? [])
    .map((u) => ({
      lessonId: u.quizzes?.lesson_id ?? null,
      title: u.quizzes?.lessons?.title ?? "(lesson removed)",
    }))
    .filter((u) => u.lessonId);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/manage/questions"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Question bank
        </Link>

        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Question
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href={`/manage/questions/${id}/edit`}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Edit
            </Link>
            <form action={deleteQuestion}>
              <input type="hidden" name="id" value={id} />
              <button
                type="submit"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-red-600 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-300"
              >
                Delete
              </button>
            </form>
          </div>
        </div>

        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {question.type === "true_false" ? "True / False" : "Multiple choice"}
        </p>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            {question.prompt}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {options.map((o) => (
              <li
                key={o.id}
                className={`rounded px-2 py-1.5 ${
                  o.is_correct
                    ? "bg-green-100 font-medium text-green-800 dark:bg-green-950/60 dark:text-green-300"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {o.is_correct ? "✓ " : ""}
                {o.label}
                {o.is_correct && (
                  <span className="ml-1 text-xs font-normal">
                    (correct answer)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <h2 className="mt-6 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Used in {usage.length} quiz{usage.length === 1 ? "" : "zes"}
        </h2>
        {usage.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm">
            {usage.map((u) => (
              <li key={u.lessonId}>
                <Link
                  href={`/manage/lessons/${u.lessonId}/quiz`}
                  className="text-red-600 hover:underline"
                >
                  {u.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
