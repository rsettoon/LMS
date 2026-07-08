"use client";

import Link from "next/link";
import { useActionState } from "react";
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
  const selected = new Set(selectedSkillIds ?? []);

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

      <div>
        <span className={labelClass}>Skills covered by this lesson</span>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Check every skill this lesson demonstrates.
        </p>
        {skills.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            No skills yet.{" "}
            <Link href="/manage/skills/new" className="text-red-600 hover:underline">
              Add a skill first
            </Link>
            .
          </p>
        ) : (
          <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
            {skills.map((s) => (
              <label
                key={s.id}
                className="flex items-start gap-2 rounded px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <input
                  type="checkbox"
                  name="skill_ids"
                  value={s.id}
                  defaultChecked={selected.has(s.id)}
                  className="mt-1 h-4 w-4 accent-red-600"
                />
                <span className="text-sm text-zinc-800 dark:text-zinc-200">
                  {skillLabel(s)}
                </span>
              </label>
            ))}
          </div>
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
