import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/app/components/AppHeader";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

type Step = { step_number: number; description: string };
type LessonSkill = {
  id: string;
  skill_number: number | null;
  subsection: string | null;
  title: string;
  jpr_code: string | null;
  jpr_designation: string | null;
  condition: string | null;
  time_limit_seconds: number | null;
  skill_steps: Step[] | null;
};

function formatTime(seconds: number | null): string | null {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", id)
    .single();

  if (!lesson) notFound();

  const { data: links } = await supabase
    .from("lesson_skills")
    .select("skill_id")
    .eq("lesson_id", id);
  const skillIds = (links ?? []).map((l) => l.skill_id as string);

  let skills: LessonSkill[] = [];
  if (skillIds.length > 0) {
    const { data } = await supabase
      .from("skills")
      .select(
        "id, skill_number, subsection, title, jpr_code, jpr_designation, condition, time_limit_seconds, skill_steps ( step_number, description )",
      )
      .in("id", skillIds)
      .order("skill_number", { ascending: true, nullsFirst: false })
      .order("subsection", { ascending: true, nullsFirst: true });
    skills = (data as LessonSkill[] | null) ?? [];
  }

  const embedUrl = getYouTubeEmbedUrl(lesson.video_url);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/lessons"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Lessons
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {lesson.title}
        </h1>
        {lesson.credit_hours != null && (
          <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">
            {lesson.credit_hours} training hour
            {lesson.credit_hours === 1 ? "" : "s"}
          </p>
        )}
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
              Watch video ↗
            </a>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              No video added yet.
            </div>
          )}
        </section>

        {/* Skills covered */}
        {skills.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Required skills
            </h2>
            <div className="mt-3 space-y-4">
              {skills.map((skill) => {
                const steps = (skill.skill_steps ?? [])
                  .slice()
                  .sort((a, b) => a.step_number - b.step_number);
                const time = formatTime(skill.time_limit_seconds);
                return (
                  <div
                    key={skill.id}
                    className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">
                      {skill.skill_number != null && (
                        <span className="text-zinc-400">
                          {skill.skill_number}
                          {skill.subsection ?? ""}.{" "}
                        </span>
                      )}
                      {skill.title}
                    </div>
                    <div className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                      {skill.jpr_code && (
                        <span>
                          NFPA {skill.jpr_code}
                          {skill.jpr_designation
                            ? ` (${skill.jpr_designation})`
                            : ""}
                        </span>
                      )}
                      {time && <span> · Time: {time}</span>}
                    </div>
                    {skill.condition && (
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <span className="font-medium">Condition:</span>{" "}
                        {skill.condition}
                      </p>
                    )}
                    {steps.length > 0 && (
                      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                        {steps.map((step) => (
                          <li key={step.step_number}>{step.description}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Quiz placeholder */}
        <section className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          📝 Quiz coming soon — you&apos;ll complete a quiz here to finish the
          lesson.
        </section>
      </main>
    </div>
  );
}
