"use client";

import { useActionState } from "react";
import { importSkills, type SkillImportState } from "./actions";

const fileClass =
  "mt-1 block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-red-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-red-700 dark:text-zinc-300";
const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function ImportSkillsForm() {
  const [state, formAction, pending] = useActionState<
    SkillImportState,
    FormData
  >(importSkills, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="skills_file" className={labelClass}>
          1. Skills file
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          One row per skill.{" "}
          <a
            href="/manage/skills/import/template-skills"
            className="text-red-600 hover:underline"
          >
            Download template
          </a>
        </p>
        <input
          id="skills_file"
          name="skills_file"
          type="file"
          accept=".csv,text/csv"
          className={fileClass}
        />
      </div>

      <div>
        <label htmlFor="steps_file" className={labelClass}>
          2. Steps file
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          One row per step, linked by skill_number + subsection.{" "}
          <a
            href="/manage/skills/import/template-steps"
            className="text-red-600 hover:underline"
          >
            Download template
          </a>
        </p>
        <input
          id="steps_file"
          name="steps_file"
          type="file"
          accept=".csv,text/csv"
          className={fileClass}
        />
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        You can upload both together, or just one (e.g. steps only, to update
        the steps of skills that already exist).
      </p>

      {state && "error" in state && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
          {state.error}
        </p>
      )}

      {state && "created" in state && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-800/50">
          <p className="font-medium text-green-700 dark:text-green-400">
            ✅ {state.created} skill{state.created === 1 ? "" : "s"} created,{" "}
            {state.updated} updated · {state.steps} step
            {state.steps === 1 ? "" : "s"} saved
          </p>

          {state.warnings.length > 0 && (
            <div className="mt-2 text-amber-700 dark:text-amber-400">
              Warnings:
              <ul className="list-disc pl-5">
                {state.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

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
        {pending ? "Importing…" : "Import"}
      </button>
    </form>
  );
}
