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
  hours_awarded: number | null;
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
    .select("firefighter_id, lesson_id, completed_at, hours_awarded");

  const today = new Date().toISOString().slice(0, 10);

  // completed[firefighterId] = Set of completed lesson ids
  const completedByFf = new Map<string, Set<string>>();
  const hoursByFf = new Map<string, number>();
  for (const p of (progress as Progress[] | null) ?? []) {
    if (p.completed_at) {
      if (!completedByFf.has(p.firefighter_id))
        completedByFf.set(p.firefighter_id, new Set());
      completedByFf.get(p.firefighter_id)!.add(p.lesson_id);
      hoursByFf.set(
        p.firefighter_id,
        (hoursByFf.get(p.firefighter_id) ?? 0) + Number(p.hours_awarded ?? 0),
      );
    }
  }

  const assignmentsByFf = new Map<string, Assignment[]>();
  for (const a of (assignments as Assignment[] | null) ?? []) {
    if (!assignmentsByFf.has(a.firefighter_id))
      assignmentsByFf.set(a.firefighter_id, []);
    assignmentsByFf.get(a.firefighter_id)!.push(a);
  }

  const rows = ((firefighters as Profile[] | null) ?? []).map((ff) => {
    const ffAssignments = assignmentsByFf.get(ff.id) ?? [];
    const completedSet = completedByFf.get(ff.id) ?? new Set<string>();
    const assigned = ffAssignments.length;
    const completed = ffAssignments.filter((a) =>
      completedSet.has(a.lesson_id),
    ).length;
    const overdue = ffAssignments.filter(
      (a) =>
        !completedSet.has(a.lesson_id) &&
        a.due_date != null &&
        a.due_date < today,
    ).length;
    return {
      id: ff.id,
      name: ff.full_name || ff.email || "(unnamed)",
      assigned,
      completed,
      overdue,
      hours: hoursByFf.get(ff.id) ?? 0,
    };
  });

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-1 mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Training overview
        </h1>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No firefighters yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="px-4 py-3 font-medium">Firefighter</th>
                  <th className="px-4 py-3 text-center font-medium">Assigned</th>
                  <th className="px-4 py-3 text-center font-medium">
                    Completed
                  </th>
                  <th className="px-4 py-3 text-center font-medium">Overdue</th>
                  <th className="px-4 py-3 text-center font-medium">Hours</th>
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
                    <td className="px-4 py-3 text-center text-zinc-700 dark:text-zinc-300">
                      {r.assigned}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-700 dark:text-zinc-300">
                      {r.completed}/{r.assigned}
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
                    <td className="px-4 py-3 text-center text-zinc-700 dark:text-zinc-300">
                      {r.hours}
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
