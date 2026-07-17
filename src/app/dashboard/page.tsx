import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/app/components/AppHeader";

type FfItem = {
  lessonId: string;
  title: string;
  dueDate: string | null;
  overdue: boolean;
};

function LessonSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: FfItem[];
  emptyText: string;
}) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {emptyText}
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {items.map((item) => (
            <li key={item.lessonId}>
              <Link
                href={`/lessons/${item.lessonId}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                    {item.title}
                  </div>
                  {item.dueDate && (
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      Due {item.dueDate}
                    </div>
                  )}
                </div>
                {item.overdue && (
                  <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950/60 dark:text-red-300">
                    Overdue
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The proxy already redirects unauthenticated users, but we guard here too
  // (defense in depth — never rely on the proxy alone for protection).
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const name = profile?.full_name ?? user.email;
  const isCoordinator = profile?.role === "coordinator";

  const assignedNotStarted: FfItem[] = [];
  const inProcess: FfItem[] = [];
  const completed: FfItem[] = [];
  let hoursEarned = 0;

  if (!isCoordinator) {
    const { data: assignments } = await supabase
      .from("assignments")
      .select("lesson_id, due_date")
      .eq("firefighter_id", user.id);
    const assignedMap = new Map<string, string | null>();
    for (const a of assignments ?? [])
      assignedMap.set(a.lesson_id as string, a.due_date as string | null);

    const { data: progressRows } = await supabase
      .from("lesson_progress")
      .select("lesson_id, video_watched, quiz_passed, completed_at")
      .eq("firefighter_id", user.id);
    type ProgressRow = {
      lesson_id: string;
      video_watched: boolean;
      quiz_passed: boolean;
      completed_at: string | null;
    };
    const progressByLesson = new Map<string, ProgressRow>();
    for (const p of (progressRows as ProgressRow[] | null) ?? [])
      progressByLesson.set(p.lesson_id, p);

    // Every lesson the firefighter is assigned OR has touched.
    const ids = new Set<string>([
      ...assignedMap.keys(),
      ...progressByLesson.keys(),
    ]);

    const lessonInfo = new Map<
      string,
      { title: string; credit_hours: number | null }
    >();
    if (ids.size > 0) {
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, title, credit_hours")
        .in("id", [...ids]);
      for (const l of lessons ?? [])
        lessonInfo.set(l.id as string, {
          title: l.title as string,
          credit_hours: l.credit_hours as number | null,
        });
    }

    const today = new Date().toISOString().slice(0, 10);

    for (const id of ids) {
      const info = lessonInfo.get(id);
      if (!info) continue; // lesson was deleted
      const p = progressByLesson.get(id);
      const assigned = assignedMap.has(id);
      const dueDate = assigned ? (assignedMap.get(id) ?? null) : null;

      let status: "completed" | "in_progress" | "not_started";
      if (p?.completed_at) status = "completed";
      else if (p?.video_watched || p?.quiz_passed) status = "in_progress";
      else status = "not_started";

      const item: FfItem = {
        lessonId: id,
        title: info.title,
        dueDate,
        overdue: !!(dueDate && dueDate < today && status !== "completed"),
      };

      if (status === "completed") {
        completed.push(item);
        hoursEarned += Number(info.credit_hours ?? 0);
      } else if (status === "in_progress") {
        inProcess.push(item);
      } else if (assigned) {
        assignedNotStarted.push(item);
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader />

      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome, {name}
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          You are signed in as{" "}
          <span className="font-medium">
            {isCoordinator ? "Training Coordinator" : "Firefighter"}
          </span>
          .{" "}
          <Link
            href="/set-password"
            className="text-red-600 hover:underline dark:text-red-400"
          >
            Change password
          </Link>
        </p>

        {isCoordinator ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/manage/skills"
              className="rounded-xl border border-zinc-200 bg-white p-6 transition-colors hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-800"
            >
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Skills →
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Manage NFPA 1001 skill sheets and their steps.
              </p>
            </Link>
            <Link
              href="/manage/lessons"
              className="rounded-xl border border-zinc-200 bg-white p-6 transition-colors hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-800"
            >
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Lessons →
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Build lessons with a video, credit hours, and skills.
              </p>
            </Link>
            <Link
              href="/manage/questions"
              className="rounded-xl border border-zinc-200 bg-white p-6 transition-colors hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-800"
            >
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Question bank →
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Build reusable questions to add to lesson quizzes.
              </p>
            </Link>
            <Link
              href="/manage/authoring-entities"
              className="rounded-xl border border-zinc-200 bg-white p-6 transition-colors hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-800"
            >
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Authoring entities →
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Manage the organizations that author skills and lessons.
              </p>
            </Link>
            <Link
              href="/manage/standards"
              className="rounded-xl border border-zinc-200 bg-white p-6 transition-colors hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-800"
            >
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Standards →
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Manage the NFPA JPR standards that skills reference.
              </p>
            </Link>
            <Link
              href="/manage/assignments"
              className="rounded-xl border border-zinc-200 bg-white p-6 transition-colors hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-800"
            >
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Assignments →
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Assign lessons to firefighters with due dates.
              </p>
            </Link>
            <Link
              href="/manage/overview"
              className="rounded-xl border border-zinc-200 bg-white p-6 transition-colors hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-800"
            >
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Training overview →
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                See every firefighter&apos;s progress, overdue items, and hours.
              </p>
            </Link>
            <Link
              href="/manage/firefighters"
              className="rounded-xl border border-zinc-200 bg-white p-6 transition-colors hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-800"
            >
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Firefighters →
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Invite firefighters individually or import a CSV.
              </p>
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {hoursEarned} training hour{hoursEarned === 1 ? "" : "s"}
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  earned from completed lessons
                </div>
              </div>
              <Link
                href="/lessons"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Browse all lessons
              </Link>
            </div>

            <LessonSection
              title="Assigned, not started"
              items={assignedNotStarted}
              emptyText="Nothing assigned and waiting to start."
            />
            <LessonSection
              title="In process"
              items={inProcess}
              emptyText="No lessons in process right now."
            />
            <LessonSection
              title="Completed"
              items={completed}
              emptyText="No completed lessons yet."
            />
          </div>
        )}
      </div>
    </div>
  );
}
