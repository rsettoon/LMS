"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type { SkillFormState } from "./actions";

type SkillAction = (
  prev: SkillFormState,
  formData: FormData,
) => Promise<SkillFormState>;

type Skill = {
  id?: string;
  skill_number?: number | null;
  subsection?: string | null;
  title?: string | null;
  condition?: string | null;
  time_limit_seconds?: number | null;
  notes?: string | null;
  authoring_entity_id?: string | null;
};

type Entity = { id: string; name: string };

export type StandardOption = {
  id: string;
  accreditor: string;
  standard: string;
  edition: string;
  code: string;
  title: string | null;
};

function standardLabel(s: StandardOption) {
  const ref = `${s.accreditor} ${s.standard}, ${s.edition} · JPR ${s.code}`;
  return s.title ? `${ref} — ${s.title}` : ref;
}

const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";
const pickerButtonClass =
  "shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40";

export default function SkillForm({
  action,
  skill,
  steps,
  entities,
  standards,
  selectedStandardIds,
}: {
  action: SkillAction;
  skill?: Skill;
  steps?: { step_number: number; description: string }[];
  entities: Entity[];
  standards: StandardOption[];
  selectedStandardIds?: string[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const [stepList, setStepList] = useState<string[]>(
    steps && steps.length > 0 ? steps.map((s) => s.description) : [""],
  );

  // Standards picker (batch add/remove, like the other pickers).
  const [selectedStdIds, setSelectedStdIds] = useState<string[]>(
    selectedStandardIds ?? [],
  );
  const [stdFilter, setStdFilter] = useState("");
  const [addStdOpen, setAddStdOpen] = useState(false);
  const [pendingAddStd, setPendingAddStd] = useState<Set<string>>(new Set());
  const [pendingRemoveStd, setPendingRemoveStd] = useState<Set<string>>(
    new Set(),
  );

  const standardById = useMemo(
    () => new Map(standards.map((s) => [s.id, s])),
    [standards],
  );
  const selectedStandards = selectedStdIds
    .map((id) => standardById.get(id))
    .filter((s): s is StandardOption => Boolean(s));
  const availableStandards = useMemo(() => {
    const f = stdFilter.trim().toLowerCase();
    const chosen = new Set(selectedStdIds);
    return standards.filter(
      (s) =>
        !chosen.has(s.id) &&
        (!f || standardLabel(s).toLowerCase().includes(f)),
    );
  }, [standards, selectedStdIds, stdFilter]);

  function toggleStd(set: Set<string>, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }
  function addCheckedStd() {
    setSelectedStdIds((prev) => {
      const next = [...prev];
      for (const id of pendingAddStd) if (!next.includes(id)) next.push(id);
      return next;
    });
    setPendingAddStd(new Set());
  }
  function removeCheckedStd() {
    setSelectedStdIds((prev) => prev.filter((id) => !pendingRemoveStd.has(id)));
    setPendingRemoveStd(new Set());
  }

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
  function moveStep(index: number, direction: -1 | 1) {
    setStepList((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      {skill?.id && <input type="hidden" name="id" value={skill.id} />}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
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
        <div>
          <label htmlFor="subsection" className={labelClass}>
            Subsection
          </label>
          <input
            id="subsection"
            name="subsection"
            type="text"
            maxLength={5}
            defaultValue={skill?.subsection ?? ""}
            placeholder="A"
            className={inputClass}
          />
        </div>
        <div className="col-span-2 sm:col-span-4">
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

      {/* Standards (JPRs) — selected ids submit as hidden inputs */}
      {selectedStdIds.map((id) => (
        <input key={id} type="hidden" name="standard_ids" value={id} />
      ))}

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className={labelClass}>
            Standards / JPRs ({selectedStandards.length})
          </span>
          <button
            type="button"
            onClick={removeCheckedStd}
            disabled={pendingRemoveStd.size === 0}
            className={pickerButtonClass}
          >
            Remove{pendingRemoveStd.size > 0 ? ` ${pendingRemoveStd.size}` : ""}
          </button>
        </div>
        {selectedStandards.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No standards linked. Check some below and click Add.
          </p>
        ) : (
          <ul className="max-h-56 divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {selectedStandards.map((s) => (
              <li key={s.id} className="bg-white dark:bg-zinc-900">
                <label className="flex cursor-pointer items-start gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <input
                    type="checkbox"
                    checked={pendingRemoveStd.has(s.id)}
                    onChange={() =>
                      setPendingRemoveStd((prev) => toggleStd(prev, s.id))
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
                  />
                  <span className="text-sm text-zinc-800 dark:text-zinc-200">
                    {standardLabel(s)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setAddStdOpen((o) => !o)}
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            <span className="text-xs text-zinc-400">
              {addStdOpen ? "▾" : "▸"}
            </span>
            Add standards
            <span className="text-xs font-normal text-zinc-400">
              ({availableStandards.length})
            </span>
          </button>
          <button
            type="button"
            onClick={addCheckedStd}
            disabled={pendingAddStd.size === 0}
            className={pickerButtonClass}
          >
            Add{pendingAddStd.size > 0 ? ` ${pendingAddStd.size}` : ""}
          </button>
        </div>
        {addStdOpen && (
          <>
            <input
              type="text"
              value={stdFilter}
              onChange={(e) => setStdFilter(e.target.value)}
              placeholder="Filter by code or title…"
              className={`${inputClass} mb-2`}
            />
            {standards.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                No standards exist yet. Add them in{" "}
                <Link
                  href="/manage/standards"
                  className="text-red-600 hover:underline"
                >
                  Standards
                </Link>{" "}
                first.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                {availableStandards.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-start gap-2 border-b border-zinc-100 px-3 py-2 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  >
                    <input
                      type="checkbox"
                      checked={pendingAddStd.has(s.id)}
                      onChange={() =>
                        setPendingAddStd((prev) => toggleStd(prev, s.id))
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
                    />
                    <span className="text-sm text-zinc-800 dark:text-zinc-200">
                      {standardLabel(s)}
                    </span>
                  </label>
                ))}
                {availableStandards.length === 0 && (
                  <p className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {stdFilter
                      ? `No unselected standards match "${stdFilter}".`
                      : "All standards are already linked."}
                  </p>
                )}
              </div>
            )}
          </>
        )}
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
        <label htmlFor="authoring_entity_id" className={labelClass}>
          Authoring entity
        </label>
        <select
          id="authoring_entity_id"
          name="authoring_entity_id"
          defaultValue={skill?.authoring_entity_id ?? ""}
          className={inputClass}
        >
          <option value="">— Select —</option>
          {entities.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
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
              <div className="mt-0.5 flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => moveStep(i, -1)}
                  disabled={i === 0}
                  className="rounded px-1.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500 dark:hover:bg-zinc-800"
                  aria-label={`Move step ${i + 1} up`}
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(i, 1)}
                  disabled={i === stepList.length - 1}
                  className="rounded px-1.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500 dark:hover:bg-zinc-800"
                  aria-label={`Move step ${i + 1} down`}
                >
                  ▼
                </button>
              </div>
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
