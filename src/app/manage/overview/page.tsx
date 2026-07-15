import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";

type Profile = { id: string; full_name: string | null; email: string | null };
type Assignment = {
  firefighter_id: string;
  lesson_id: string;
  due_date: string | null;
};
type Progress = {
  firefighter_id: string;
  lesson_id: string;
  completed_at: string | null;
};

export default async function OverviewPage() {
  const { supabase } = await requireCoordinator();

  const { data: firefighters } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "firefighter")
    .order("full_name", { ascending: true, nullsFirst: false });

  const { data: assignments } = await supabase
    .from("assignments")
    .select("firefighter_id, lesson_id, due_date");

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("firefighter_id, lesson_id, completed_at");

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, credit_hours");
  const creditByLesson = new Map<string, number>(
    (lessons ?? []).map((l) => [l.id as string, Number(l.credit_hours ?? 0)]),
  );

  // assigned[ff] = Map(lessonId -> due_date); completed[ff] = Set(lessonId)
  const assignedByFf = new Map<string, Map<string, string | null>>();
  for (const a of (assignments as Assignment[] | null) ?? []) {
    if (!assignedByFf.has(a.firefighter_id))
      assignedByFf.set(a.firefighter_id, new Map());
    assignedByFf.get(a.firefighter_id)!.set(a.lesson_id, a.due_date);
  }
  const completedByFf = new Map<string, Set<string>>();
  for (const p of (progress as Progress[] | null) ?? []) {
    if (!p.completed_at) continue;
    if (!completedByFf.has(p.firefighter_id))
      completedByFf.set(p.firefighter_id, new Set());
    completedByFf.get(p.firefighter_id)!.add(p.lesson_id);
  }

  const today = new Date().toISOString().slice(0, 10);

  const rows = ((firefighters as Profile[] | null) ?? []).map((ff) => {
    const assigned = assignedByFf.get(ff.id) ?? new Map<string, string | null>();
    const completed = completedByFf.get(ff.id) ?? new Set<string>();

    let mandDone = 0;
    let mandHrs = 0;
    let volDone = 0;
    let volHrs = 0;
    for (const lessonId of completed) {
      const hrs = creditByLesson.get(lessonId) ?? 0;
      if (assigned.has(lessonId)) {
        mandDone++;
        mandHrs += hrs;
      } else {
        volDone++;
        volHrs += hrs;
      }
    }

    let overdue = 0;
    for (const [lessonId, due] of assigned) {
      if (!completed.has(lessonId) && due && due < today) overdue++;
    }

    return {
      id: ff.id,
      name: ff.full_name || ff.email || "(unnamed)",
      assignedTotal: assigned.size,
      mandDone,
      mandHrs,
      volDone,
      volHrs,
      overdue,
    };
  });

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Training overview
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Mandatory = assigned lessons. Non-mandatory = lessons completed
          voluntarily.
        </p>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No firefighters yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="px-4 py-3 text-left font-medium">
                    Firefighter
                  </th>
                  <th
                    className="border-l border-zinc-200 px-4 py-2 text-center font-medium dark:border-zinc-800"
                    colSpan={3}
                  >
                    Mandatory (assigned)
                  </th>
                  <th
                    className="border-l border-zinc-200 px-4 py-2 text-center font-medium dark:border-zinc-800"
                    colSpan={2}
                  >
                    Non-mandatory
                  </th>
                </tr>
                <tr className="border-b border-zinc-200 text-xs text-zinc-400 dark:border-zinc-800">
                  <th className="px-4 py-2" />
                  <th className="border-l border-zinc-200 px-4 py-2 text-center font-medium dark:border-zinc-800">
                    Completed
                  </th>
                  <th className="px-4 py-2 text-center font-medium">Hours</th>
                  <th className="px-4 py-2 text-center font-medium">Overdue</th>
                  <th className="border-l border-zinc-200 px-4 py-2 text-center font-medium dark:border-zinc-800">
                    Completed
                  </th>
                  <th className="px-4 py-2 text-center font-medium">Hours</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {r.name}
                    </td>
                    <td className="border-l border-zinc-100 px-4 py-3 text-center text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                      {r.mandDone}/{r.assignedTotal}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-700 dark:text-zinc-300">
                      {r.mandHrs}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.overdue > 0 ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950/60 dark:text-red-300">
                          {r.overdue}
                        </span>
                      ) : (
                        <span className="text-zinc-400">0</span>
                      )}
                    </td>
                    <td className="border-l border-zinc-100 px-4 py-3 text-center text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                      {r.volDone}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-700 dark:text-zinc-300">
                      {r.volHrs}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
