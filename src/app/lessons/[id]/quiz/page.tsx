import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/app/components/AppHeader";
import QuizRunner from "./QuizRunner";

type OptionRow = { id: string; label: string; position: number };
type QuestionRow = {
  id: string;
  type: "multiple_choice" | "true_false";
  prompt: string;
  question_options: OptionRow[] | null;
};
type LinkRow = { position: number; questions: QuestionRow | null };

// Fisher–Yates shuffle (returns a new array).
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function TakeQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title")
    .eq("id", id)
    .single();
  if (!lesson) notFound();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, passing_score")
    .eq("lesson_id", id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href={`/lessons/${id}`}
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← {lesson.title}
        </Link>
        <h1 className="mt-1 mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Quiz
        </h1>

        {await renderQuiz()}
      </main>
    </div>
  );

  async function renderQuiz() {
    if (!quiz) {
      return (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          No quiz has been added to this lesson yet.
        </div>
      );
    }

    // is_correct is intentionally NOT selected — correct answers never reach
    // the browser. Grading happens on the server.
    const { data: links } = await supabase
      .from("quiz_questions")
      .select(
        "position, questions ( id, type, prompt, question_options ( id, label, position ) )",
      )
      .eq("quiz_id", quiz.id)
      .order("position", { ascending: true });

    const prepared = shuffle(
      ((links as LinkRow[] | null) ?? [])
        .map((l) => l.questions)
        .filter((q): q is QuestionRow => Boolean(q))
        .map((q) => {
          const opts = q.question_options ?? [];
          // True/False keeps a fixed order (True first); others shuffle.
          const ordered =
            q.type === "true_false"
              ? opts.slice().sort((a, b) => a.position - b.position)
              : shuffle(opts);
          return {
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            options: ordered.map((o) => ({ id: o.id, label: o.label })),
          };
        }),
    );

    if (prepared.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          This quiz has no questions yet.
        </div>
      );
    }

    return <QuizRunner lessonId={id} quizId={quiz.id} questions={prepared} />;
  }
}
