import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/app/components/AppHeader";

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

  type AssignedLesson = {
    lessonId: string;
    title: string;
    dueDate: string | null;
    status: "completed" | "overdue" | "in_progress" | "not_started";
  };
  let assignedLessons: AssignedLesson[] = [];
  let hoursEarned = 0;

  if (!isCoordinator) {
    const { data: assignments } = await supabase
      .from("assignments")
      .select("due_date, lesson_id, lessons ( title, credit_hours )")
      .eq("firefighter_id", user.id);

    const { data: progressRows } = await supabase
      .from("lesson_progress")
      .select("lesson_id, video_watched, quiz_passed, completed_at, hours_awarded")
      .eq("firefighter_id", user.id);

    type ProgressRow = {
      lesson_id: string;
      video_watched: boolean;
      quiz_passed: boolean;
      completed_at: string | null;
      hours_awarded: number | null;
    };
    const progressByLesson = new Map<string, ProgressRow>(
      ((progressRows as ProgressRow[] | null) ?? []).map((p) => [
        p.lesson_id,
        p,
      ]),
    );

    hoursEarned = ((progressRows as ProgressRow[] | null) ?? []).reduce(
      (sum, p) =>
        sum + (p.completed_at && p.hours_awarded ? Number(p.hours_awarded) : 0),
      0,
    );

    const today = new Date().toISOString().slice(0, 10);
    type AssignmentRow = {
      due_date: string | null;
      lesson_id: string;
      lessons: { title: string; credit_hours: number | null } | null;
    };
    assignedLessons = ((assignments as AssignmentRow[] | null) ?? []).map(
      (a) => {
        const p = progressByLesson.get(a.lesson_id);
        let status: AssignedLesson["status"];
        if (p?.completed_at) status = "completed";
        else if (a.due_date && a.due_date < today) status = "overdue";
        else if (p?.video_watched || p?.quiz_passed) status = "in_progress";
        else status = "not_started";
        return {
          lessonId: a.lesson_id,
          title: a.lessons?.title ?? "(lesson removed)",
          dueDate: a.due_date,
          status,
        };
      },
    );
  }

  const statusMeta: Record<
    AssignedLesson["status"],
    { label: string; className: string }
  > = {
    completed: {
      label: "Completed",
      className:
        "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300",
    },
    overdue: {
      label: "Overdue",
      className:
        "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
    },
    in_progress: {
      label: "In progress",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    },
    not_started: {
      label: "Not started",
      className:
        "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    },
  };

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
          .
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

            <div>
              <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Your assigned lessons
              </h2>
              {assignedLessons.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                  You have no assigned lessons right now.
                </div>
              ) : (
                <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                  {assignedLessons.map((a) => (
                    <li key={a.lessonId}>
                      <Link
                        href={`/lessons/${a.lessonId}`}
                        className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                            {a.title}
                          </div>
                          {a.dueDate && (
                            <div className="text-sm text-zinc-500 dark:text-zinc-400">
                              Due {a.dueDate}
                            </div>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusMeta[a.status].className}`}
                        >
                          {statusMeta[a.status].label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
