import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { deleteLesson } from "../actions";

type SkillRow = {
  id: string;
  skill_number: number | null;
  subsection: string | null;
  title: string;
  jpr_code: string | null;
};

export default async function ViewLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireCoordinator();
  const { id } = await params;

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, authoring_entities ( name )")
    .eq("id", id)
    .single();

  if (!lesson) notFound();

  const { data: links } = await supabase
    .from("lesson_skills")
    .select("skill_id")
    .eq("lesson_id", id);
  const skillIds = (links ?? []).map((l) => l.skill_id as string);

  let skills: SkillRow[] = [];
  if (skillIds.length > 0) {
    const { data } = await supabase
      .from("skills")
      .select("id, skill_number, subsection, title, jpr_code")
      .in("id", skillIds)
      .order("skill_number", { ascending: true, nullsFirst: false })
      .order("subsection", { ascending: true, nullsFirst: true });
    skills = (data as SkillRow[] | null) ?? [];
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, passing_score, quiz_questions(count)")
    .eq("lesson_id", id)
    .maybeSingle();
  const questionCount =
    (quiz?.quiz_questions as { count: number }[] | null)?.[0]?.count ?? 0;

  const authoringEntity =
    (lesson.authoring_entities as { name: string } | null)?.name ?? null;
  const embedUrl = getYouTubeEmbedUrl(lesson.video_url);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/manage/lessons"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Lessons
        </Link>

        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {lesson.title}
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href={`/manage/lessons/${id}/edit`}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Edit
            </Link>
            <Link
              href={`/manage/lessons/${id}/quiz`}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Quiz
            </Link>
            <form action={deleteLesson}>
              <input type="hidden" name="id" value={id} />
              <button
                type="submit"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-red-600 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-300"
              >
                Delete
              </button>
            </form>
          </div>
        </div>

        <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {lesson.credit_hours != null && (
            <span>
              {lesson.credit_hours} training hour
              {lesson.credit_hours === 1 ? "" : "s"}
            </span>
          )}
          {authoringEntity && <span> · Authored by {authoringEntity}</span>}
        </div>

        {lesson.description && (
          <p className="mt-3 text-zinc-700 dark:text-zinc-300">
            {lesson.description}
          </p>
        )}

        {/* Video */}
        <section className="mt-6">
          {embedUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              <iframe
                src={embedUrl}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          ) : lesson.video_url ? (
            <a
              href={lesson.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:underline"
            >
              {lesson.video_url}
            </a>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No video added.
            </p>
          )}
        </section>

        {/* Skills */}
        <h2 className="mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Skills covered ({skills.length})
        </h2>
        {skills.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            No skills linked.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {skills.map((s) => (
              <li key={s.id} className="px-4 py-2.5 text-sm">
                <Link
                  href={`/manage/skills/${s.id}`}
                  className="text-zinc-800 hover:text-red-600 dark:text-zinc-200"
                >
                  {s.skill_number != null && (
                    <span className="text-zinc-400">
                      {s.skill_number}
                      {s.subsection ?? ""}.{" "}
                    </span>
                  )}
                  {s.title}
                  {s.jpr_code && (
                    <span className="text-zinc-400"> — NFPA {s.jpr_code}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Quiz */}
        <h2 className="mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Quiz
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {quiz
            ? `${questionCount} question${questionCount === 1 ? "" : "s"} · ${quiz.passing_score}% to pass`
            : "No quiz yet."}
        </p>
      </div>
    </main>
  );
}
