import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import AssignmentForm from "../AssignmentForm";

type ProfileRow = { id: string; full_name: string | null; email: string | null };

export default async function NewAssignmentPage() {
  const { supabase } = await requireCoordinator();

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title")
    .order("title", { ascending: true });

  const { data: firefighters } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "firefighter")
    .order("full_name", { ascending: true, nullsFirst: false });

  const firefighterOptions = ((firefighters as ProfileRow[] | null) ?? []).map(
    (f) => ({
      id: f.id,
      name: f.full_name || f.email || "(unnamed)",
    }),
  );

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/manage/assignments"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Assignments
        </Link>
        <h1 className="mt-1 mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Assign a lesson
        </h1>
        <AssignmentForm
          lessons={lessons ?? []}
          firefighters={firefighterOptions}
        />
      </div>
    </main>
  );
}
