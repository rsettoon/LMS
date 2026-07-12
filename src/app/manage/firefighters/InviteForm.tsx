"use client";

import { useActionState } from "react";
import { inviteFirefighter, type InviteState } from "./actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

export default function InviteForm() {
  const [state, formAction, pending] = useActionState<InviteState, FormData>(
    inviteFirefighter,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="email"
          type="email"
          required
          placeholder="firefighter@example.com"
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

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/50 dark:text-green-400">
          {state.ok}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send invitation"}
      </button>
    </form>
  );
}
