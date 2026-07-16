"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { saveQuiz, type QuizFormState } from "./actions";

export type BankQuestion = {
  id: string;
  type: "multiple_choice" | "true_false";
  prompt: string;
  categoryId: string | null;
  categoryName: string | null;
  skillIds: string[];
};

const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

function typeTag(type: BankQuestion["type"]) {
  return type === "true_false" ? "T/F" : "MC";
}

export default function QuizBuilder({
  lessonId,
  initialPassingScore,
  initialSelectedIds,
  questions,
  categories,
  lessonSkillIds,
}: {
  lessonId: string;
  initialPassingScore: number;
  initialSelectedIds: string[];
  questions: BankQuestion[];
  categories: { id: string; name: string }[];
  lessonSkillIds: string[];
}) {
  const [state, formAction, pending] = useActionState<QuizFormState, FormData>(
    saveQuiz,
    undefined,
  );
  const [passingScore, setPassingScore] = useState(initialPassingScore);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  const hasLessonSkills = lessonSkillIds.length > 0;
  const [onlyLessonSkills, setOnlyLessonSkills] = useState(hasLessonSkills);
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const questionById = useMemo(
    () => new Map(questions.map((q) => [q.id, q])),
    [questions],
  );
  const lessonSkillSet = useMemo(
    () => new Set(lessonSkillIds),
    [lessonSkillIds],
  );

  const selectedQuestions = selectedIds
    .map((id) => questionById.get(id))
    .filter((q): q is BankQuestion => Boolean(q));

  // Everything not already in the quiz (before the search/category filters).
  const unselected = useMemo(() => {
    const chosen = new Set(selectedIds);
    return questions.filter((q) => !chosen.has(q.id));
  }, [questions, selectedIds]);

  const available = useMemo(() => {
    const f = text.trim().toLowerCase();
    return unselected.filter((q) => {
      if (onlyLessonSkills && !q.skillIds.some((id) => lessonSkillSet.has(id)))
        return false;
      if (categoryId === "__none__" && q.categoryId) return false;
      if (categoryId && categoryId !== "__none__" && q.categoryId !== categoryId)
        return false;
      if (f && !q.prompt.toLowerCase().includes(f)) return false;
      return true;
    });
  }, [unselected, onlyLessonSkills, lessonSkillSet, categoryId, text]);

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
                    {q.categoryName ? ` · ${q.categoryName}` : ""}
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

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search question text…"
            className={`${inputClass} flex-1`}
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="__none__">— No category —</option>
          </select>
        </div>

        <label className="mb-2 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={onlyLessonSkills}
            onChange={(e) => setOnlyLessonSkills(e.target.checked)}
            disabled={!hasLessonSkills}
            className="h-4 w-4 accent-red-600 disabled:opacity-40"
          />
          Only questions for this lesson&apos;s skills
          {!hasLessonSkills && (
            <span className="text-xs text-zinc-400">
              (this lesson has no skills linked)
            </span>
          )}
        </label>

        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Showing {available.length} of {unselected.length} available
        </p>

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
                    {q.categoryName ? ` · ${q.categoryName}` : ""}
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
              <div className="px-2 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                {onlyLessonSkills ? (
                  <>
                    No available questions are tagged with this lesson&apos;s
                    skills{text || categoryId ? " and filters" : ""}.{" "}
                    <button
                      type="button"
                      onClick={() => setOnlyLessonSkills(false)}
                      className="text-red-600 hover:underline"
                    >
                      Show all questions
                    </button>
                  </>
                ) : (
                  "No available questions match your filters."
                )}
              </div>
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
          href={`/manage/lessons/${lessonId}/edit`}
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
