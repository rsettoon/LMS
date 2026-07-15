"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type LessonItem = {
  id: string;
  title: string;
  description: string | null;
  credit_hours: number | null;
  status: "completed" | "in_progress" | "not_started";
  assigned: boolean;
};

type FilterKey = "completed" | "in_progress" | "assigned";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "assigned", label: "Assigned, not started" },
  { key: "in_progress", label: "In process" },
  { key: "completed", label: "Completed" },
];

function StatusBadge({ item }: { item: LessonItem }) {
  if (item.status === "completed") {
    return (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950/60 dark:text-green-300">
        Completed
      </span>
    );
  }
  if (item.status === "in_progress") {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
        In process
      </span>
    );
  }
  if (item.assigned) {
    return (
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
        Assigned, not started
      </span>
    );
  }
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
      Not started
    </span>
  );
}

export default function LessonsBrowser({ lessons }: { lessons: LessonItem[] }) {
  const [active, setActive] = useState<Set<FilterKey>>(new Set());

  function toggle(key: FilterKey) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filtered = useMemo(() => {
    if (active.size === 0) return lessons;
    return lessons.filter((l) => {
      if (active.has("completed") && l.status === "completed") return true;
      if (active.has("in_progress") && l.status === "in_progress") return true;
      if (active.has("assigned") && l.assigned && l.status === "not_started")
        return true;
      return false;
    });
  }, [active, lessons]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Show:</span>
        {FILTERS.map((f) => {
          const on = active.has(f.key);
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => toggle(f.key)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                on
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {f.label}
            </button>
          );
        })}
        {active.size > 0 && (
          <button
            type="button"
            onClick={() => setActive(new Set())}
            className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
          >
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          No lessons match the selected filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/lessons/${lesson.id}`}
              className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {lesson.title}
                </div>
                <StatusBadge item={lesson} />
              </div>
              {lesson.description && (
                <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {lesson.description}
                </p>
              )}
              {lesson.credit_hours != null && (
                <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">
                  {lesson.credit_hours} training hour
                  {lesson.credit_hours === 1 ? "" : "s"}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
