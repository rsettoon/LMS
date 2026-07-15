"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { saveQuiz, type QuizFormState } from "./actions";

type BankQuestion = {
  id: string;
  type: "multiple_choice" | "true_false";
  prompt: string;
};

const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

function typeTag(type: BankQuestion["type"]) {
  return type === "true_false" ? "T/F" : "MC";
}

export default function QuizBuilder({
  lessonId,
  initialPassingScore,
  initialSelectedIds,
  questions,
}: {
  lessonId: string;
  initialPassingScore: number;
  initialSelectedIds: string[];
  questions: BankQuestion[];
}) {
  const [state, formAction, pending] = useActionState<QuizFormState, FormData>(
    saveQuiz,
    undefined,
  );
  const [passingScore, setPassingScore] = useState(initialPassingScore);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [filter, setFilter] = useState("");

  const questionById = useMemo(
    () => new Map(questions.map((q) => [q.id, q])),
    [questions],
  );

  const selectedQuestions = selectedIds
    .map((id) => questionById.get(id))
    .filter((q): q is BankQuestion => Boolean(q));

  const available = useMemo(() => {
    const f = filter.trim().toLowerCase();
    const chosen = new Set(selectedIds);
    return questions.filter(
      (q) =>
        !chosen.has(q.id) && (!f || q.prompt.toLowerCase().includes(f)),
    );
  }, [questions, selectedIds, filter]);

  function add(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }
  function remove(id: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="lesson_id" value={lessonId} />
      <input type="hidden" name="passing_score" value={passingScore} />
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="question_ids" value={id} />
      ))}

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <label
          htmlFor="passing_score_input"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Passing score (%)
        </label>
        <input
          id="passing_score_input"
          type="number"
          min={1}
          max={100}
          value={passingScore}
          onChange={(e) => setPassingScore(Number(e.target.value))}
          className={`${inputClass} mt-1 w-32`}
        />
      </div>

      {/* Selected questions */}
      <div>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          In this quiz ({selectedQuestions.length})
        </span>
        {selectedQuestions.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No questions yet. Add some from the bank below.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {selectedQuestions.map((q) => (
              <li
                key={q.id}
                className="flex items-center justify-between gap-3 bg-white px-3 py-2 dark:bg-zinc-900"
              >
                <span className="text-sm">
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {q.prompt}
                  </span>
                  <span className="ml-2 text-xs text-zinc-400">
                    {typeTag(q.type)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => remove(q.id)}
                  className="shrink-0 text-sm text-zinc-500 hover:text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add from bank */}
      <div>
        <div className="mb-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Add from the bank
          </span>
        </div>

        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter questions…"
          className={`${inputClass} mb-2 w-full`}
        />

        {questions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            The question bank is empty. Add questions in the{" "}
            <Link
              href="/manage/questions"
              className="text-red-600 hover:underline"
            >
              Question Bank
            </Link>{" "}
            first.
          </p>
        ) : (
          <div className="max-h-80 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
            {available.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between gap-3 rounded px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <span className="text-sm">
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {q.prompt}
                  </span>
                  <span className="ml-2 text-xs text-zinc-400">
                    {typeTag(q.type)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => add(q.id)}
                  className="shrink-0 text-sm text-red-600 hover:underline"
                >
                  Add
                </button>
              </div>
            ))}
            {available.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                {filter
                  ? `No unselected questions match "${filter}".`
                  : "All bank questions are already in this quiz."}
              </p>
            )}
          </div>
        )}
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save quiz"}
        </button>
        <Link
          href="/manage/lessons"
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
