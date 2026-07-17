"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { StandardFormState } from "./actions";

type StandardAction = (
  prev: StandardFormState,
  formData: FormData,
) => Promise<StandardFormState>;

type Standard = {
  id?: string;
  accreditor?: string | null;
  standard?: string | null;
  edition?: string | null;
  code?: string | null;
  title?: string | null;
  description?: string | null;
};

const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

export default function StandardForm({
  action,
  standard,
}: {
  action: StandardAction;
  standard?: Standard;
}) {
  const [state, formAction, pending] = useActionState<
    StandardFormState,
    FormData
  >(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {standard?.id && <input type="hidden" name="id" value={standard.id} />}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="accreditor" className={labelClass}>
            Accreditor <span className="text-red-600">*</span>
          </label>
          <input
            id="accreditor"
            name="accreditor"
            required
            defaultValue={standard?.accreditor ?? "NFPA"}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="standard" className={labelClass}>
            Standard <span className="text-red-600">*</span>
          </label>
          <input
            id="standard"
            name="standard"
            required
            defaultValue={standard?.standard ?? ""}
            placeholder="1001"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="edition" className={labelClass}>
            Edition <span className="text-red-600">*</span>
          </label>
          <input
            id="edition"
            name="edition"
            required
            defaultValue={standard?.edition ?? ""}
            placeholder="2019"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="code" className={labelClass}>
            JPR code <span className="text-red-600">*</span>
          </label>
          <input
            id="code"
            name="code"
            required
            defaultValue={standard?.code ?? ""}
            placeholder="4.3.1"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={standard?.title ?? ""}
          placeholder="Use self-contained breathing apparatus (SCBA)"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={standard?.description ?? ""}
          className={inputClass}
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
          {pending ? "Saving…" : "Save standard"}
        </button>
        <Link
          href="/manage/standards"
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
