"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitQuiz, type QuizResultState } from "./actions";

type Option = { id: string; label: string };
type Question = { id: string; type: string; prompt: string; options: Option[] };

export default function QuizRunner({
  lessonId,
  quizId,
  questions,
}: {
  lessonId: string;
  quizId: string;
  questions: Question[];
}) {
  const [state, formAction, pending] = useActionState<
    QuizResultState,
    FormData
  >(submitQuiz, undefined);

  // Results view after grading.
  if (state && "graded" in state) {
    const byQuestion = new Map(state.results.map((r) => [r.question_id, r]));
    return (
      <div className="space-y-6">
        <div
          className={`rounded-xl border p-5 ${
            state.passed
              ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/40"
              : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40"
          }`}
        >
          <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {state.passed ? "✅ Passed" : "❌ Not passed"} — {state.score}%
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Passing score is {state.passingScore}%.
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => {
            const r = byQuestion.get(q.id);
            return (
              <div
                key={q.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="font-medium text-zinc-900 dark:text-zinc-50">
                  {i + 1}. {q.prompt}
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {q.options.map((o) => {
                    const isCorrect = r?.correct_option_id === o.id;
                    const isSelected = r?.selected_option_id === o.id;
                    return (
                      <li
                        key={o.id}
                        className={`rounded px-2 py-1 ${
                          isCorrect
                            ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                            : isSelected
                              ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                              : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {isCorrect ? "✓ " : isSelected ? "✗ " : ""}
                        {o.label}
                        {isSelected && !isCorrect && (
                          <span className="ml-1 text-xs">(your answer)</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {/* Plain anchor forces a full reload -> reshuffled, fresh attempt. */}
          <a
            href={`/lessons/${lessonId}/quiz`}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
          >
            Retry quiz
          </a>
          <Link
            href={`/lessons/${lessonId}`}
            className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Back to lesson
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Quiz-taking form.
  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="quiz_id" value={quizId} />

      {questions.map((q, i) => (
        <fieldset
          key={q.id}
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <legend className="px-1 font-medium text-zinc-900 dark:text-zinc-50">
            {i + 1}. {q.prompt}
          </legend>
          <div className="mt-2 space-y-1.5">
            {q.options.map((o) => (
              <label
                key={o.id}
                className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <input
                  type="radio"
                  name={`q_${q.id}`}
                  value={o.id}
                  required
                  className="h-4 w-4 accent-red-600"
                />
                <span className="text-sm text-zinc-800 dark:text-zinc-200">
                  {o.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      {state && "error" in state && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Grading…" : "Submit quiz"}
      </button>
    </form>
  );
}
