"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { SkillFormState } from "./actions";

type SkillAction = (
  prev: SkillFormState,
  formData: FormData,
) => Promise<SkillFormState>;

type Skill = {
  id?: string;
  skill_number?: number | null;
  title?: string | null;
  nfpa_edition?: string | null;
  jpr_code?: string | null;
  jpr_designation?: string | null;
  condition?: string | null;
  time_limit_seconds?: number | null;
  notes?: string | null;
};

const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

export default function SkillForm({
  action,
  skill,
  steps,
}: {
  action: SkillAction;
  skill?: Skill;
  steps?: { step_number: number; description: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const [stepList, setStepList] = useState<string[]>(
    steps && steps.length > 0 ? steps.map((s) => s.description) : [""],
  );

  const totalSeconds = skill?.time_limit_seconds ?? 0;
  const initialMinutes = totalSeconds ? Math.floor(totalSeconds / 60) : "";
  const initialSeconds = totalSeconds ? totalSeconds % 60 : "";

  function updateStep(index: number, value: string) {
    setStepList((prev) => prev.map((s, i) => (i === index ? value : s)));
  }
  function addStep() {
    setStepList((prev) => [...prev, ""]);
  }
  function removeStep(index: number) {
    setStepList((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {skill?.id && <input type="hidden" name="id" value={skill.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="skill_number" className={labelClass}>
            Skill #
          </label>
          <input
            id="skill_number"
            name="skill_number"
            type="number"
            min="0"
            defaultValue={skill?.skill_number ?? ""}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="title" className={labelClass}>
            Title <span className="text-red-600">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={skill?.title ?? ""}
            placeholder="Demonstrate donning Self-Contained Breathing Apparatus (SCBA)"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="nfpa_edition" className={labelClass}>
            NFPA edition
          </label>
          <input
            id="nfpa_edition"
            name="nfpa_edition"
            type="text"
            defaultValue={skill?.nfpa_edition ?? ""}
            placeholder="2019"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="jpr_code" className={labelClass}>
            JPR code
          </label>
          <input
            id="jpr_code"
            name="jpr_code"
            type="text"
            defaultValue={skill?.jpr_code ?? ""}
            placeholder="4.3.1"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="jpr_designation" className={labelClass}>
            Designation
          </label>
          <input
            id="jpr_designation"
            name="jpr_designation"
            type="text"
            defaultValue={skill?.jpr_designation ?? ""}
            placeholder="B"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="condition" className={labelClass}>
          Condition
        </label>
        <input
          id="condition"
          name="condition"
          type="text"
          defaultValue={skill?.condition ?? ""}
          placeholder="Wearing full protective clothing and SCBA."
          className={inputClass}
        />
      </div>

      <div>
        <span className={labelClass}>Time limit</span>
        <div className="mt-1 flex items-center gap-2">
          <input
            name="minutes"
            type="number"
            min="0"
            defaultValue={initialMinutes}
            className={`${inputClass} w-24`}
            aria-label="Minutes"
          />
          <span className="text-sm text-zinc-500">min</span>
          <input
            name="seconds"
            type="number"
            min="0"
            max="59"
            defaultValue={initialSeconds}
            className={`${inputClass} w-24`}
            aria-label="Seconds"
          />
          <span className="text-sm text-zinc-500">sec</span>
        </div>
      </div>

      {/* Steps */}
      <div>
        <span className={labelClass}>Performance steps</span>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Each step is stored separately so it can be graded during a hands-on
          demonstration later.
        </p>
        <div className="mt-2 space-y-2">
          {stepList.map((description, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2 w-6 shrink-0 text-right text-sm text-zinc-400">
                {i + 1}.
              </span>
              <input
                name="step"
                type="text"
                value={description}
                onChange={(e) => updateStep(i, e.target.value)}
                placeholder="Open cylinder valve fully"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeStep(i)}
                className="mt-1 rounded-lg px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                aria-label={`Remove step ${i + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addStep}
          className="mt-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          + Add step
        </button>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={skill?.notes ?? ""}
          placeholder="*Steps may vary with different SCBAs; all of the above should be covered."
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
          {pending ? "Saving…" : "Save skill"}
        </button>
        <Link
          href="/manage/skills"
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
