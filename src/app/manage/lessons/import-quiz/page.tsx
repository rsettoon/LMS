import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import ImportQuizForm from "./ImportQuizForm";

export default async function ImportQuizPage() {
  await requireCoordinator();

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/manage/lessons"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Lessons
        </Link>
        <h1 className="mt-1 mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Import quiz questions from CSV
        </h1>

        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            Format: one row per question
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Columns: <code>lesson_title, passing_score, question_type,
              prompt, option_a, option_b, option_c, option_d, correct</code>
            </li>
            <li>
              <code>lesson_title</code> must match an existing lesson&apos;s
              title exactly (not case-sensitive)
            </li>
            <li>
              <code>question_type</code> is <code>multiple_choice</code> or{" "}
              <code>true_false</code> (for true/false, leave the options blank
              and they default to True / False)
            </li>
            <li>
              <code>correct</code> is the letter of the right answer (
              <code>A</code>, <code>B</code>, …) or the exact answer text
            </li>
            <li>
              ⚠️ Importing <strong>replaces</strong> that lesson&apos;s existing
              quiz questions
            </li>
          </ul>
          <a
            href="/manage/lessons/import-quiz/template"
            className="mt-3 inline-block font-medium text-red-600 hover:underline"
          >
            Download template
          </a>
        </div>

        <ImportQuizForm />
      </div>
    </main>
  );
}
