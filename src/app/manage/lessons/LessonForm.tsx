"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type { LessonFormState } from "./actions";

type LessonAction = (
  prev: LessonFormState,
  formData: FormData,
) => Promise<LessonFormState>;

type Lesson = {
  id?: string;
  title?: string | null;
  description?: string | null;
  video_url?: string | null;
  credit_hours?: number | null;
  authoring_entity_id?: string | null;
};

type Entity = { id: string; name: string };

export type SkillOption = {
  id: string;
  skill_number: number | null;
  subsection: string | null;
  title: string;
  jpr_code: string | null;
};

const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";
const pickerButtonClass =
  "shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40";

function skillLabel(s: SkillOption) {
  const num =
    s.skill_number != null ? `${s.skill_number}${s.subsection ?? ""}. ` : "";
  const ref = s.jpr_code ? ` — NFPA ${s.jpr_code}` : "";
  return `${num}${s.title}${ref}`;
}

export default function LessonForm({
  action,
  lesson,
  selectedSkillIds,
  skills,
  entities,
}: {
  action: LessonAction;
  lesson?: Lesson;
  selectedSkillIds?: string[];
  skills: SkillOption[];
  entities: Entity[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const [selectedIds, setSelectedIds] = useState<string[]>(
    selectedSkillIds ?? [],
  );
  const [skillFilter, setSkillFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const skillById = useMemo(
    () => new Map(skills.map((s) => [s.id, s])),
    [skills],
  );
  const selectedSkills = selectedIds
    .map((id) => skillById.get(id))
    .filter((s): s is SkillOption => Boolean(s));

  const availableSkills = useMemo(() => {
    const f = skillFilter.trim().toLowerCase();
    const chosen = new Set(selectedIds);
    return skills.filter(
      (s) =>
        !chosen.has(s.id) && (!f || skillLabel(s).toLowerCase().includes(f)),
    );
  }, [skills, selectedIds, skillFilter]);

  // Checkboxes staged for the next Add / Remove click.
  const [pendingAdd, setPendingAdd] = useState<Set<string>>(new Set());
  const [pendingRemove, setPendingRemove] = useState<Set<string>>(new Set());

  function toggle(set: Set<string>, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }
  function addCheckedSkills() {
    setSelectedIds((prev) => {
      const next = [...prev];
      for (const id of pendingAdd) if (!next.includes(id)) next.push(id);
      return next;
    });
    setPendingAdd(new Set());
  }
  function removeCheckedSkills() {
    setSelectedIds((prev) => prev.filter((id) => !pendingRemove.has(id)));
    setPendingRemove(new Set());
  }

  return (
    <form action={formAction} className="space-y-6">
      {lesson?.id && <input type="hidden" name="id" value={lesson.id} />}

      <div>
        <label htmlFor="title" className={labelClass}>
          Title <span className="text-red-600">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={lesson?.title ?? ""}
          placeholder="How to deploy ground ladders"
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
          defaultValue={lesson?.description ?? ""}
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
          defaultValue={lesson?.authoring_entity_id ?? ""}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="video_url" className={labelClass}>
            YouTube video URL
          </label>
          <input
            id="video_url"
            name="video_url"
            type="url"
            defaultValue={lesson?.video_url ?? ""}
            placeholder="https://www.youtube.com/watch?v=…"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="credit_hours" className={labelClass}>
            Credit hours
          </label>
          <input
            id="credit_hours"
            name="credit_hours"
            type="number"
            min="0"
            step="0.25"
            defaultValue={lesson?.credit_hours ?? ""}
            placeholder="1.5"
            className={inputClass}
          />
        </div>
      </div>

      {/* Selected ids submit via hidden inputs so filtering never drops them. */}
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="skill_ids" value={id} />
      ))}

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className={labelClass}>
            Skills in this lesson ({selectedSkills.length})
          </span>
          <button
            type="button"
            onClick={removeCheckedSkills}
            disabled={pendingRemove.size === 0}
            className={pickerButtonClass}
          >
            Remove{pendingRemove.size > 0 ? ` ${pendingRemove.size}` : ""}
          </button>
        </div>
        {selectedSkills.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No skills yet. Check some below and click Add.
          </p>
        ) : (
          <ul className="max-h-64 divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {selectedSkills.map((s) => (
              <li key={s.id} className="bg-white dark:bg-zinc-900">
                <label className="flex cursor-pointer items-start gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <input
                    type="checkbox"
                    checked={pendingRemove.has(s.id)}
                    onChange={() =>
                      setPendingRemove((prev) => toggle(prev, s.id))
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
                  />
                  <span className="text-sm text-zinc-800 dark:text-zinc-200">
                    {skillLabel(s)}
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
            onClick={() => setAddOpen((o) => !o)}
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            <span className="text-xs text-zinc-400">{addOpen ? "▾" : "▸"}</span>
            Add skills
            <span className="text-xs font-normal text-zinc-400">
              ({availableSkills.length})
            </span>
          </button>
          <button
            type="button"
            onClick={addCheckedSkills}
            disabled={pendingAdd.size === 0}
            className={pickerButtonClass}
          >
            Add{pendingAdd.size > 0 ? ` ${pendingAdd.size}` : ""}
          </button>
        </div>

        {addOpen && (
          <>
            <input
              type="text"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="Filter skills…"
              className={`${inputClass} mb-2`}
            />

            {skills.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                No skills exist yet. Add them in{" "}
                <Link
                  href="/manage/skills"
                  className="text-red-600 hover:underline"
                >
                  Skills
                </Link>{" "}
                first.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                {availableSkills.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-start gap-2 border-b border-zinc-100 px-3 py-2 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  >
                    <input
                      type="checkbox"
                      checked={pendingAdd.has(s.id)}
                      onChange={() =>
                        setPendingAdd((prev) => toggle(prev, s.id))
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
                    />
                    <span className="text-sm text-zinc-800 dark:text-zinc-200">
                      {skillLabel(s)}
                    </span>
                  </label>
                ))}
                {availableSkills.length === 0 && (
                  <p className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {skillFilter
                      ? `No unselected skills match "${skillFilter}".`
                      : "All skills are already in this lesson."}
                  </p>
                )}
              </div>
            )}
          </>
        )}
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
          {pending ? "Saving…" : "Save lesson"}
        </button>
        <Link
          href="/manage/lessons"
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
