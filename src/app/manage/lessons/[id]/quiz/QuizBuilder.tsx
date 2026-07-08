"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveQuiz, type QuizFormState } from "./actions";

type OptionDraft = { label: string; is_correct: boolean };
type QuestionDraft = {
  type: "multiple_choice" | "true_false";
  prompt: string;
  options: OptionDraft[];
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";

function blankMultipleChoice(): QuestionDraft {
  return {
    type: "multiple_choice",
    prompt: "",
    options: [
      { label: "", is_correct: true },
      { label: "", is_correct: false },
    ],
  };
}

function trueFalseOptions(): OptionDraft[] {
  return [
    { label: "True", is_correct: true },
    { label: "False", is_correct: false },
  ];
}

export default function QuizBuilder({
  lessonId,
  lessonTitle,
  initialPassingScore,
  initialQuestions,
}: {
  lessonId: string;
  lessonTitle: string;
  initialPassingScore: number;
  initialQuestions: QuestionDraft[];
}) {
  const [state, formAction, pending] = useActionState<QuizFormState, FormData>(
    saveQuiz,
    undefined,
  );
  const [passingScore, setPassingScore] = useState(initialPassingScore);
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialQuestions.length > 0 ? initialQuestions : [blankMultipleChoice()],
  );

  function patchQuestion(qi: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, ...patch } : q)),
    );
  }
  function changeType(qi: number, type: QuestionDraft["type"]) {
    if (type === "true_false") {
      patchQuestion(qi, { type, options: trueFalseOptions() });
    } else {
      patchQuestion(qi, {
        type,
        options: [
          { label: "", is_correct: true },
          { label: "", is_correct: false },
        ],
      });
    }
  }
  function setCorrect(qi: number, oi: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi
          ? {
              ...q,
              options: q.options.map((o, j) => ({
                ...o,
                is_correct: j === oi,
              })),
            }
          : q,
      ),
    );
  }
  function setOptionLabel(qi: number, oi: number, label: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi
          ? {
              ...q,
              options: q.options.map((o, j) =>
                j === oi ? { ...o, label } : o,
              ),
            }
          : q,
      ),
    );
  }
  function addOption(qi: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi
          ? { ...q, options: [...q.options, { label: "", is_correct: false }] }
          : q,
      ),
    );
  }
  function removeOption(qi: number, oi: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi || q.options.length <= 2) return q;
        const options = q.options.filter((_, j) => j !== oi);
        // Ensure a correct answer still exists.
        if (!options.some((o) => o.is_correct)) options[0].is_correct = true;
        return { ...q, options };
      }),
    );
  }
  function addQuestion() {
    setQuestions((prev) => [...prev, blankMultipleChoice()]);
  }
  function removeQuestion(qi: number) {
    setQuestions((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== qi) : prev,
    );
  }

  const payload = JSON.stringify({ passing_score: passingScore, questions });

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="lesson_id" value={lessonId} />
      <input type="hidden" name="payload" value={payload} />

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <label
          htmlFor="passing_score"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Passing score (%)
        </label>
        <input
          id="passing_score"
          type="number"
          min={1}
          max={100}
          value={passingScore}
          onChange={(e) => setPassingScore(Number(e.target.value))}
          className={`${inputClass} mt-1 w-32`}
        />
      </div>

      {questions.map((q, qi) => (
        <div
          key={qi}
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-zinc-500">
              Question {qi + 1}
            </span>
            <div className="flex items-center gap-3">
              <select
                value={q.type}
                onChange={(e) =>
                  changeType(qi, e.target.value as QuestionDraft["type"])
                }
                className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="multiple_choice">Multiple choice</option>
                <option value="true_false">True / False</option>
              </select>
              <button
                type="button"
                onClick={() => removeQuestion(qi)}
                className="text-sm text-zinc-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          </div>

          <textarea
            value={q.prompt}
            onChange={(e) => patchQuestion(qi, { prompt: e.target.value })}
            rows={2}
            placeholder="Question prompt"
            className={inputClass}
          />

          <div className="mt-3 space-y-2">
            {q.options.map((o, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct_${qi}`}
                  checked={o.is_correct}
                  onChange={() => setCorrect(qi, oi)}
                  className="h-4 w-4 accent-red-600"
                  aria-label={`Mark option ${oi + 1} correct`}
                />
                {q.type === "true_false" ? (
                  <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">
                    {o.label}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={o.label}
                    onChange={(e) => setOptionLabel(qi, oi, e.target.value)}
                    placeholder={`Option ${oi + 1}`}
                    className={inputClass}
                  />
                )}
                {q.type === "multiple_choice" && q.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(qi, oi)}
                    className="px-2 text-zinc-400 hover:text-red-600"
                    aria-label={`Remove option ${oi + 1}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {q.type === "multiple_choice" && (
            <button
              type="button"
              onClick={() => addOption(qi)}
              className="mt-2 text-sm text-red-600 hover:underline"
            >
              + Add option
            </button>
          )}
          <p className="mt-2 text-xs text-zinc-400">
            Select the radio next to the correct answer.
          </p>
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        + Add question
      </button>

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
          {pending ? "Saving…" : "Save quiz"}
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
