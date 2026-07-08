"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createAssignment, type AssignmentFormState } from "./actions";

type LessonOption = { id: string; title: string };
type FirefighterOption = { id: string; name: string };

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";
const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function AssignmentForm({
  lessons,
  firefighters,
}: {
  lessons: LessonOption[];
  firefighters: FirefighterOption[];
}) {
  const [state, formAction, pending] = useActionState<
    AssignmentFormState,
    FormData
  >(createAssignment, undefined);
  const [target, setTarget] = useState<"everyone" | "individuals">(
    "individuals",
  );

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="lesson_id" className={labelClass}>
          Lesson <span className="text-red-600">*</span>
        </label>
        <select id="lesson_id" name="lesson_id" required className={inputClass}>
          <option value="">— Select a lesson —</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className={labelClass}>Assign to</span>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="target"
              value="individuals"
              checked={target === "individuals"}
              onChange={() => setTarget("individuals")}
              className="h-4 w-4 accent-red-600"
            />
            Specific firefighters
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="target"
              value="everyone"
              checked={target === "everyone"}
              onChange={() => setTarget("everyone")}
              className="h-4 w-4 accent-red-600"
            />
            Everyone
          </label>
        </div>
      </div>

      {target === "individuals" && (
        <div>
          <span className={labelClass}>Firefighters</span>
          {firefighters.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              No firefighters found yet.
            </p>
          ) : (
            <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
              {firefighters.map((f) => (
                <label
                  key={f.id}
                  className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <input
                    type="checkbox"
                    name="firefighter_ids"
                    value={f.id}
                    className="h-4 w-4 accent-red-600"
                  />
                  <span className="text-sm text-zinc-800 dark:text-zinc-200">
                    {f.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label htmlFor="due_date" className={labelClass}>
          Due date (optional)
        </label>
        <input
          id="due_date"
          name="due_date"
          type="date"
          className={`${inputClass} w-48`}
        />
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
          {pending ? "Assigning…" : "Assign lesson"}
        </button>
        <Link
          href="/manage/assignments"
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
