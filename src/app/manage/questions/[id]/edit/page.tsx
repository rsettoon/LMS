import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import QuestionForm from "../../QuestionForm";
import { updateQuestion } from "../../actions";

type OptionRow = { label: string; is_correct: boolean; position: number };

export default async function EditQuestionPage({
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

  const { data: options } = await supabase
    .from("question_options")
    .select("label, is_correct, position")
    .eq("question_id", id)
    .order("position", { ascending: true });

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/manage/questions"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Question bank
        </Link>
        <h1 className="mt-1 mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Edit question
        </h1>
        <QuestionForm
          action={updateQuestion}
          question={{
            id: question.id,
            type: question.type,
            prompt: question.prompt,
            options: ((options as OptionRow[] | null) ?? []).map((o) => ({
              label: o.label,
              is_correct: o.is_correct,
            })),
          }}
        />
      </div>
    </main>
  );
}
