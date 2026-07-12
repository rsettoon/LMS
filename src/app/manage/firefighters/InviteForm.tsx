"use client";

import { useActionState, useState } from "react";
import { addFirefighter, type AddState } from "./actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

export default function AddFirefighterForm() {
  const [state, formAction, pending] = useActionState<AddState, FormData>(
    addFirefighter,
    undefined,
  );
  const [method, setMethod] = useState<"password" | "invite">("password");

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="email"
          type="email"
          required
          placeholder="firefighter@natalbanyfire.org"
          className={inputClass}
          aria-label="Email"
        />
        <input
          name="full_name"
          type="text"
          placeholder="Full name (optional)"
          className={inputClass}
          aria-label="Full name"
        />
      </div>

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
          Temporary password (hand out in person)
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
          Email invitation
        </label>
      </fieldset>

      {state && "error" in state && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
          {state.error}
        </p>
      )}

      {state && "ok" in state && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950/50 dark:text-green-300">
          <p>✅ {state.ok}</p>
          {state.tempPassword && (
            <div className="mt-2">
              <p className="font-medium">
                Temporary password — copy this now, it won&apos;t be shown
                again:
              </p>
              <code className="mt-1 inline-block rounded bg-white px-3 py-1.5 font-mono text-base tracking-wider text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                {state.tempPassword}
              </code>
              <p className="mt-1 text-xs">
                Give it to them; they can change it after signing in.
              </p>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
      >
        {pending
          ? "Working…"
          : method === "invite"
            ? "Send invitation"
            : "Create account"}
      </button>
    </form>
  );
}
