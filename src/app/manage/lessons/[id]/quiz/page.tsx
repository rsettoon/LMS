import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import QuizBuilder from "./QuizBuilder";

type OptionRow = { label: string; is_correct: boolean; position: number };
type QuestionRow = {
  type: "multiple_choice" | "true_false";
  prompt: string;
  position: number;
  quiz_options: OptionRow[] | null;
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
  let initialQuestions: {
    type: "multiple_choice" | "true_false";
    prompt: string;
    options: { label: string; is_correct: boolean }[];
  }[] = [];

  if (quiz) {
    initialPassingScore = quiz.passing_score;
    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("type, prompt, position, quiz_options ( label, is_correct, position )")
      .eq("quiz_id", quiz.id)
      .order("position", { ascending: true });

    initialQuestions = ((questions as QuestionRow[] | null) ?? []).map((q) => ({
      type: q.type,
      prompt: q.prompt,
      options: (q.quiz_options ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((o) => ({ label: o.label, is_correct: o.is_correct })),
    }));
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/manage/lessons"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Lessons
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Quiz
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          for {lesson.title}
        </p>
        <QuizBuilder
          lessonId={id}
          lessonTitle={lesson.title}
          initialPassingScore={initialPassingScore}
          initialQuestions={initialQuestions}
        />
      </div>
    </main>
  );
}
