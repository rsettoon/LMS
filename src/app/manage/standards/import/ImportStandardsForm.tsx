"use client";

import { useActionState } from "react";
import { importStandards, type StandardImportState } from "./actions";

export default function ImportStandardsForm() {
  const [state, formAction, pending] = useActionState<
    StandardImportState,
    FormData
  >(importStandards, undefined);

  return (
    <form action={formAction} className="space-y-4">
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

      {state && "inserted" in state && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="font-medium text-green-700 dark:text-green-400">
            ✅ {state.inserted} added, {state.updated} updated
          </p>
          {state.errors.length > 0 && (
            <div className="mt-2 text-red-700 dark:text-red-400">
              Errors:
              <ul className="list-disc pl-5">
                {state.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Importing…" : "Import standards"}
      </button>
    </form>
  );
}
