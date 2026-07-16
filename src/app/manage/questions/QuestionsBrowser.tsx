"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deleteQuestion } from "./actions";

export type QuestionRow = {
  id: string;
  type: "multiple_choice" | "true_false";
  prompt: string;
  categoryId: string | null;
  categoryName: string | null;
  usedIn: number;
};

const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

export default function QuestionsBrowser({
  questions,
  categories,
}: {
  questions: QuestionRow[];
  categories: { id: string; name: string }[];
}) {
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const filtered = useMemo(() => {
    const f = text.trim().toLowerCase();
    return questions.filter((q) => {
      if (categoryId === "__none__" && q.categoryId) return false;
      if (categoryId && categoryId !== "__none__" && q.categoryId !== categoryId)
        return false;
      if (f && !q.prompt.toLowerCase().includes(f)) return false;
      return true;
    });
  }, [questions, text, categoryId]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
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
        {(text || categoryId) && (
          <button
            type="button"
            onClick={() => {
              setText("");
              setCategoryId("");
            }}
            className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
          >
            Clear
          </button>
        )}
      </div>

      <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
        Showing {filtered.length} of {questions.length}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          No questions match your filters.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {filtered.map((q) => (
            <li
              key={q.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                  {q.prompt}
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  {q.type === "true_false" ? "True / False" : "Multiple choice"}
                  {q.categoryName && ` · ${q.categoryName}`}
                  {` · in ${q.usedIn} quiz${q.usedIn === 1 ? "" : "zes"}`}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/manage/questions/${q.id}`}
                  className="text-sm text-red-600 hover:underline"
                >
                  View
                </Link>
                <Link
                  href={`/manage/questions/${q.id}/edit`}
                  className="text-sm text-red-600 hover:underline"
                >
                  Edit
                </Link>
                <form action={deleteQuestion}>
                  <input type="hidden" name="id" value={q.id} />
                  <button
                    type="submit"
                    className="text-sm text-zinc-500 hover:text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
