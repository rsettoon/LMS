"use client";

import { useActionState } from "react";
import { importFirefighters, type ImportState } from "./actions";

export default function ImportForm() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(
    importFirefighters,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        CSV columns: <code>email, full_name</code>. A header row is optional.{" "}
        <a
          href="/manage/firefighters/template"
          className="text-red-600 hover:underline"
        >
          Download template
        </a>
      </p>

      <input
        name="file"
        type="file"
        accept=".csv,text/csv"
        required
        className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-red-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-red-700 dark:text-zinc-300"
      />

      {state && "error" in state && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
          {state.error}
        </p>
      )}

      {state && "invited" in state && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="font-medium text-green-700 dark:text-green-400">
            ✅ {state.invited} invitation{state.invited === 1 ? "" : "s"} sent
          </p>
          {state.skipped.length > 0 && (
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Skipped (already have accounts): {state.skipped.join(", ")}
            </p>
          )}
          {state.failed.length > 0 && (
            <div className="mt-1 text-red-700 dark:text-red-400">
              Failed:
              <ul className="list-disc pl-5">
                {state.failed.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-60"
      >
        {pending ? "Importing…" : "Import CSV"}
      </button>
    </form>
  );
}
