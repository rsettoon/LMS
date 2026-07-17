"use client";

import { useEffect, useState } from "react";
import { fetchLessonContent, type LessonContent } from "./actions";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

function formatTime(seconds: number | null): string | null {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function LessonQuickView({ lessonId }: { lessonId: string }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleOpen() {
    setOpen(true);
    if (content) return; // already loaded
    setLoading(true);
    setError("");
    try {
      const data = await fetchLessonContent(lessonId);
      if (data) setContent(data);
      else setError("Could not load this lesson.");
    } catch {
      setError("Could not load this lesson.");
    }
    setLoading(false);
  }

  // Close on Escape, and lock the page behind the overlay from scrolling.
  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const embedUrl = getYouTubeEmbedUrl(content?.video_url);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="text-sm text-red-600 hover:underline"
      >
        View
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="relative mx-auto my-8 w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Lesson quick view"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
              aria-label="Close"
            >
              ✕
            </button>

            {loading && (
              <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Loading lesson…
              </p>
            )}

            {error && (
              <p className="py-8 text-center text-sm text-red-600">{error}</p>
            )}

            {content && (
              <div className="pr-6">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {content.title}
                </h2>
                <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {content.credit_hours != null && (
                    <span>
                      {content.credit_hours} training hour
                      {content.credit_hours === 1 ? "" : "s"}
                    </span>
                  )}
                  {content.authoringEntity && (
                    <span> · Authored by {content.authoringEntity}</span>
                  )}
                </div>
                {content.description && (
                  <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
                    {content.description}
                  </p>
                )}

                {/* Video */}
                <section className="mt-5">
                  {embedUrl ? (
                    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                      <iframe
                        src={embedUrl}
                        title={content.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                  ) : content.video_url ? (
                    <a
                      href={content.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-red-600 hover:underline"
                    >
                      {content.video_url}
                    </a>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No video added.
                    </p>
                  )}
                </section>

                {/* Skills */}
                <h3 className="mt-6 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Skills ({content.skills.length})
                </h3>
                {content.skills.length === 0 ? (
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    No skills linked.
                  </p>
                ) : (
                  <div className="mt-2 space-y-3">
                    {content.skills.map((s) => {
                      const time = formatTime(s.time_limit_seconds);
                      return (
                        <div
                          key={s.id}
                          className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                        >
                          <div className="font-medium text-zinc-900 dark:text-zinc-50">
                            {s.skill_number != null && (
                              <span className="text-zinc-400">
                                {s.skill_number}
                                {s.subsection ?? ""}.{" "}
                              </span>
                            )}
                            {s.title}
                          </div>
                          <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {s.standards.length > 0 && (
                              <span>JPR {s.standards.join(", ")}</span>
                            )}
                            {time && <span> · Time: {time}</span>}
                          </div>
                          {s.condition && (
                            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                              <span className="font-medium">Condition:</span>{" "}
                              {s.condition}
                            </p>
                          )}
                          {s.steps.length > 0 && (
                            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                              {s.steps.map((step) => (
                                <li key={step.step_number}>
                                  {step.description}
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Quiz */}
                <h3 className="mt-6 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Quiz
                  {content.quiz
                    ? ` (${content.quiz.questions.length} question${
                        content.quiz.questions.length === 1 ? "" : "s"
                      } · ${content.quiz.passing_score}% to pass)`
                    : ""}
                </h3>
                {!content.quiz || content.quiz.questions.length === 0 ? (
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    No quiz questions yet.
                  </p>
                ) : (
                  <ol className="mt-2 space-y-3">
                    {content.quiz.questions.map((q, qi) => (
                      <li
                        key={q.id}
                        className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                      >
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {qi + 1}. {q.prompt}
                          <span className="ml-2 text-xs font-normal text-zinc-400">
                            {q.type === "true_false" ? "T/F" : "MC"}
                          </span>
                        </div>
                        <ul className="mt-2 space-y-1 text-sm">
                          {q.options.map((o) => (
                            <li
                              key={o.id}
                              className={`rounded px-2 py-1 ${
                                o.is_correct
                                  ? "bg-green-100 font-medium text-green-800 dark:bg-green-950/60 dark:text-green-300"
                                  : "text-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              {o.is_correct ? "✓ " : ""}
                              {o.label}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
