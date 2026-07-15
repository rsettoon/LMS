"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { QuestionFormState } from "./actions";

type OptionDraft = { label: string; is_correct: boolean };
type QuestionAction = (
  prev: QuestionFormState,
  formData: FormData,
) => Promise<QuestionFormState>;

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
}: {
  action: QuestionAction;
  question?: {
    id: string;
    type: "multiple_choice" | "true_false";
    prompt: string;
    options: OptionDraft[];
  };
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
