import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import QuestionForm from "../QuestionForm";
import { createQuestion } from "../actions";

export default async function NewQuestionPage() {
  await requireCoordinator();

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
          New question
        </h1>
        <QuestionForm action={createQuestion} />
      </div>
    </main>
  );
}
