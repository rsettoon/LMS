import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import { deleteAssignment, updateAssignmentDueDate } from "./actions";

type AssignmentRow = {
  id: string;
  due_date: string | null;
  lesson_id: string;
  firefighter_id: string;
  lessons: { title: string } | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

export default async function ManageAssignmentsPage() {
  const { supabase } = await requireCoordinator();

  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      "id, due_date, lesson_id, firefighter_id, lessons ( title ), profiles ( full_name, email )",
    )
    .order("due_date", { ascending: true, nullsFirst: false });

  // Which (lesson, firefighter) pairs are completed?
  const { data: completed } = await supabase
    .from("lesson_progress")
    .select("lesson_id, firefighter_id")
    .not("completed_at", "is", null);
  const completedSet = new Set(
    (completed ?? []).map((c) => `${c.lesson_id}|${c.firefighter_id}`),
  );

  const today = new Date().toISOString().slice(0, 10);
  const rows = (assignments as AssignmentRow[] | null) ?? [];

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
            >
              ← Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Assignments
            </h1>
          </div>
          <Link
            href="/manage/assignments/new"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            + Assign a lesson
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No assignments yet. Click{" "}
            <span className="font-medium">Assign a lesson</span> to create one.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {rows.map((a) => {
              const isComplete = completedSet.has(
                `${a.lesson_id}|${a.firefighter_id}`,
              );
              const isOverdue =
                !isComplete && a.due_date != null && a.due_date < today;
              const who =
                a.profiles?.full_name || a.profiles?.email || "(unknown)";
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                      {a.lessons?.title ?? "(lesson removed)"}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {who}
                    </div>
                    <form
                      action={updateAssignmentDueDate}
                      className="mt-1 flex items-center gap-2"
                    >
                      <input type="hidden" name="id" value={a.id} />
                      <label className="text-xs text-zinc-500 dark:text-zinc-400">
                        Due
                      </label>
                      <input
                        type="date"
                        name="due_date"
                        defaultValue={a.due_date ?? ""}
                        className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                      />
                      <button
                        type="submit"
                        className="text-xs text-red-600 hover:underline"
                      >
                        Save
                      </button>
                    </form>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {isComplete ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950/60 dark:text-green-300">
                        Completed
                      </span>
                    ) : isOverdue ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950/60 dark:text-red-300">
                        Overdue
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        Assigned
                      </span>
                    )}
                    <form action={deleteAssignment}>
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        type="submit"
                        className="text-sm text-zinc-500 hover:text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
