import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import QuizBuilder from "./QuizBuilder";

type BankQuestion = {
  id: string;
  type: "multiple_choice" | "true_false";
  prompt: string;
};

export default async function ManageQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireCoordinator();
  const { id } = await params;

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

  let initialPassingScore = 80;
  let initialSelectedIds: string[] = [];
  if (quiz) {
    initialPassingScore = quiz.passing_score;
    const { data: links } = await supabase
      .from("quiz_questions")
      .select("question_id")
      .eq("quiz_id", quiz.id)
      .order("position", { ascending: true });
    initialSelectedIds = (links ?? []).map((l) => l.question_id as string);
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, type, prompt")
    .order("prompt", { ascending: true });

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href={`/manage/lessons/${id}/edit`}
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← {lesson.title}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Quiz
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          for {lesson.title} — pick questions from the bank
        </p>
        <QuizBuilder
          lessonId={id}
          initialPassingScore={initialPassingScore}
          initialSelectedIds={initialSelectedIds}
          questions={(questions as BankQuestion[] | null) ?? []}
        />
      </div>
    </main>
  );
}
