"use client";

import { useActionState, useState } from "react";
import { importFirefighters, type ImportState } from "./actions";

export default function ImportForm() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(
    importFirefighters,
    undefined,
  );
  const [method, setMethod] = useState<"password" | "invite">("password");
  const [copied, setCopied] = useState(false);

  const created =
    state && "mode" in state && state.mode === "password" ? state.created : [];

  async function copyAll() {
    const text = created
      .map((c) => `${c.email}\t${c.password}`)
      .join("\n");
    await navigator.clipboard.writeText(`email\tpassword\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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

      <fieldset className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="radio"
            name="method"
            value="password"
            checked={method === "password"}
            onChange={() => setMethod("password")}
            className="h-4 w-4 accent-red-600"
          />
          Temporary passwords
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="radio"
            name="method"
            value="invite"
            checked={method === "invite"}
            onChange={() => setMethod("invite")}
            className="h-4 w-4 accent-red-600"
          />
          Email invitations
        </label>
      </fieldset>

      {state && "error" in state && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
          {state.error}
        </p>
      )}

      {state && "mode" in state && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-800/50">
          {state.mode === "invite" ? (
            <p className="font-medium text-green-700 dark:text-green-400">
              ✅ {state.invited} invitation{state.invited === 1 ? "" : "s"} sent
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-green-700 dark:text-green-400">
                  ✅ {created.length} account{created.length === 1 ? "" : "s"}{" "}
                  created
                </p>
                {created.length > 0 && (
                  <button
                    type="button"
                    onClick={copyAll}
                    className="rounded-lg border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {copied ? "Copied!" : "Copy all"}
                  </button>
                )}
              </div>

              {created.length > 0 && (
                <>
                  <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    Save or print these now — the passwords are not stored and
                    won&apos;t be shown again.
                  </p>
                  <table className="mt-2 w-full text-left text-xs">
                    <thead className="text-zinc-500 dark:text-zinc-400">
                      <tr>
                        <th className="py-1 pr-4 font-medium">Email</th>
                        <th className="py-1 font-medium">Temporary password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {created.map((c) => (
                        <tr key={c.email}>
                          <td className="py-1 pr-4 text-zinc-800 dark:text-zinc-200">
                            {c.email}
                          </td>
                          <td className="py-1 font-mono tracking-wider text-zinc-900 dark:text-zinc-50">
                            {c.password}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}

          {state.skipped.length > 0 && (
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Skipped (already have accounts): {state.skipped.join(", ")}
            </p>
          )}
          {state.failed.length > 0 && (
            <div className="mt-2 text-red-700 dark:text-red-400">
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
