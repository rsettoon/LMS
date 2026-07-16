import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import ImportQuestionsForm from "./ImportQuestionsForm";

export default async function ImportQuestionsPage() {
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
        <h1 className="mt-1 mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Import questions from CSV
        </h1>

        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            One row per question
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Columns: <code>question_type, prompt, option_a, option_b,
              option_c, option_d, correct, category, skills</code>
            </li>
            <li>
              <code>question_type</code> is <code>multiple_choice</code> or{" "}
              <code>true_false</code> (for true/false, leave options blank to
              default to True / False)
            </li>
            <li>
              <code>correct</code> is the letter of the right answer (
              <code>A</code>, <code>B</code>, …) or the exact answer text
            </li>
            <li>
              <code>category</code> must match a name on your{" "}
              <Link
                href="/manage/question-categories"
                className="text-red-600 hover:underline"
              >
                question categories
              </Link>{" "}
              list, or it is left blank and reported
            </li>
            <li>
              <code>skills</code> references skills by number + subsection —{" "}
              <code>10</code>, <code>11A</code>. List several separated by{" "}
              <code>|</code> or <code>;</code> (e.g. <code>10|11B</code>).
              Unrecognized ones are reported.
            </li>
            <li>
              Questions with a prompt that already exists in the bank are{" "}
              <strong>skipped</strong>
            </li>
            <li>
              Imported questions go into the bank; attach them to a lesson from
              that lesson&apos;s <strong>Quiz</strong> page
            </li>
          </ul>
          <a
            href="/manage/questions/import/template"
            className="mt-3 inline-block font-medium text-red-600 hover:underline"
          >
            Download template
          </a>
        </div>

        <ImportQuestionsForm />
      </div>
    </main>
  );
}
