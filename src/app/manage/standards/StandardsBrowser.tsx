"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deleteStandard } from "./actions";

export type StandardRow = {
  id: string;
  accreditor: string;
  standard: string;
  edition: string;
  code: string;
  title: string | null;
  usedIn: number;
};

export default function StandardsBrowser({
  standards,
}: {
  standards: StandardRow[];
}) {
  const [text, setText] = useState("");

  const filtered = useMemo(() => {
    const f = text.trim().toLowerCase();
    if (!f) return standards;
    return standards.filter((s) =>
      `${s.accreditor} ${s.standard} ${s.edition} ${s.code} ${s.title ?? ""}`
        .toLowerCase()
        .includes(f),
    );
  }, [standards, text]);

  return (
    <div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search by code, standard, or title…"
        className="mb-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
      />
      <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
        Showing {filtered.length} of {standards.length}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          No standards match.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {filtered.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="font-medium text-zinc-900 dark:text-zinc-50">
                  {s.accreditor} {s.standard}, {s.edition} Edition · JPR{" "}
                  {s.code}
                </div>
                <div className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                  {s.title ?? "—"}
                  {` · on ${s.usedIn} skill${s.usedIn === 1 ? "" : "s"}`}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/manage/standards/${s.id}/edit`}
                  className="text-sm text-red-600 hover:underline"
                >
                  Edit
                </Link>
                <form action={deleteStandard}>
                  <input type="hidden" name="id" value={s.id} />
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
