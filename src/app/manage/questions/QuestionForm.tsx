"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type { QuestionFormState } from "./actions";

type OptionDraft = { label: string; is_correct: boolean };
type QuestionAction = (
  prev: QuestionFormState,
  formData: FormData,
) => Promise<QuestionFormState>;

export type Category = { id: string; name: string };
export type SkillOption = {
  id: string;
  skill_number: number | null;
  subsection: string | null;
  title: string;
  jpr_code: string | null;
};

function skillLabel(s: SkillOption) {
  const num =
    s.skill_number != null ? `${s.skill_number}${s.subsection ?? ""}. ` : "";
  const ref = s.jpr_code ? ` — NFPA ${s.jpr_code}` : "";
  return `${num}${s.title}${ref}`;
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

function trueFalseOptions(): OptionDraft[] {
  return [
    { label: "True", is_correct: true },
    { label: "False", is_correct: false },
  ];
}

export default function QuestionForm({
  action,
  question,
  categories,
  skills,
}: {
  action: QuestionAction;
  question?: {
    id: string;
    type: "multiple_choice" | "true_false";
    prompt: string;
    options: OptionDraft[];
    category_id: string | null;
    skillIds: string[];
  };
  categories: Category[];
  skills: SkillOption[];
}) {
  const [state, formAction, pending] = useActionState<
    QuestionFormState,
    FormData
  >(action, undefined);

  const [type, setType] = useState<"multiple_choice" | "true_false">(
    question?.type ?? "multiple_choice",
  );
  const [prompt, setPrompt] = useState(question?.prompt ?? "");
  const [options, setOptions] = useState<OptionDraft[]>(
    question?.options ?? [
      { label: "", is_correct: true },
      { label: "", is_correct: false },
    ],
  );

  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(
    question?.skillIds ?? [],
  );
  const [skillFilter, setSkillFilter] = useState("");

  const skillById = useMemo(
    () => new Map(skills.map((s) => [s.id, s])),
    [skills],
  );
  const selectedSkills = selectedSkillIds
    .map((id) => skillById.get(id))
    .filter((s): s is SkillOption => Boolean(s));
  const availableSkills = useMemo(() => {
    const f = skillFilter.trim().toLowerCase();
    const chosen = new Set(selectedSkillIds);
    return skills.filter(
      (s) =>
        !chosen.has(s.id) && (!f || skillLabel(s).toLowerCase().includes(f)),
    );
  }, [skills, selectedSkillIds, skillFilter]);

  function addSkill(id: string) {
    setSelectedSkillIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }
  function removeSkill(id: string) {
    setSelectedSkillIds((prev) => prev.filter((x) => x !== id));
  }

  function changeType(next: "multiple_choice" | "true_false") {
    setType(next);
    if (next === "true_false") setOptions(trueFalseOptions());
    else
      setOptions([
        { label: "", is_correct: true },
        { label: "", is_correct: false },
      ]);
  }
  function setCorrect(i: number) {
    setOptions((prev) => prev.map((o, j) => ({ ...o, is_correct: j === i })));
  }
  function setLabel(i: number, label: string) {
    setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, label } : o)));
  }
  function addOption() {
    setOptions((prev) => [...prev, { label: "", is_correct: false }]);
  }
  function removeOption(i: number) {
    setOptions((prev) => {
      if (prev.length <= 2) return prev;
      const next = prev.filter((_, j) => j !== i);
      if (!next.some((o) => o.is_correct)) next[0].is_correct = true;
      return next;
    });
  }

  const payload = JSON.stringify({ type, prompt, options });

  return (
    <form action={formAction} className="space-y-5">
      {question?.id && <input type="hidden" name="id" value={question.id} />}
      <input type="hidden" name="payload" value={payload} />
      {/* Selected skills submit via hidden inputs so filtering never drops them. */}
      {selectedSkillIds.map((id) => (
        <input key={id} type="hidden" name="skill_ids" value={id} />
      ))}

      <div>
        <label
          htmlFor="category_id"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Category
        </label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={question?.category_id ?? ""}
          className={`${inputClass} mt-1`}
        >
          <option value="">— None —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Manage the list in{" "}
          <Link
            href="/manage/question-categories"
            className="text-red-600 hover:underline"
          >
            Question categories
          </Link>
          .
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Question type
        </label>
        <select
          value={type}
          onChange={(e) =>
            changeType(e.target.value as "multiple_choice" | "true_false")
          }
          className={`${inputClass} mt-1`}
        >
          <option value="multiple_choice">Multiple choice</option>
          <option value="true_false">True / False</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          placeholder="What should you check first when donning SCBA?"
          className={`${inputClass} mt-1`}
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Answer options
        </span>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Select the radio next to the correct answer.
        </p>
        <div className="mt-2 space-y-2">
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={o.is_correct}
                onChange={() => setCorrect(i)}
                className="h-4 w-4 accent-red-600"
                aria-label={`Mark option ${i + 1} correct`}
              />
              {type === "true_false" ? (
                <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">
                  {o.label}
                </span>
              ) : (
                <input
                  type="text"
                  value={o.label}
                  onChange={(e) => setLabel(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className={inputClass}
                />
              )}
              {type === "multiple_choice" && options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="px-2 text-zinc-400 hover:text-red-600"
                  aria-label={`Remove option ${i + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {type === "multiple_choice" && (
          <button
            type="button"
            onClick={addOption}
            className="mt-2 text-sm text-red-600 hover:underline"
          >
            + Add option
          </button>
        )}
      </div>

      {/* Related skills */}
      <div>
        <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Related skills ({selectedSkills.length})
        </span>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Tagging a question with the skills it tests lets you find it fast when
          building a lesson&apos;s quiz.
        </p>
        {selectedSkills.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-zinc-300 p-3 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No skills linked yet.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {selectedSkills.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 bg-white px-3 py-2 dark:bg-zinc-900"
              >
                <span className="text-sm text-zinc-800 dark:text-zinc-200">
                  {skillLabel(s)}
                </span>
                <button
                  type="button"
                  onClick={() => removeSkill(s.id)}
                  className="shrink-0 text-sm text-zinc-500 hover:text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Add skills
        </span>
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
            <Link href="/manage/skills" className="text-red-600 hover:underline">
              Skills
            </Link>{" "}
            first.
          </p>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
            {availableSkills.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <span className="text-sm text-zinc-800 dark:text-zinc-200">
                  {skillLabel(s)}
                </span>
                <button
                  type="button"
                  onClick={() => addSkill(s.id)}
                  className="shrink-0 text-sm text-red-600 hover:underline"
                >
                  Add
                </button>
              </div>
            ))}
            {availableSkills.length === 0 && (
              <p className="px-2 py-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                {skillFilter
                  ? `No unselected skills match "${skillFilter}".`
                  : "All skills are already linked."}
              </p>
            )}
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
          {pending ? "Saving…" : "Save question"}
        </button>
        <Link
          href="/manage/questions"
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
