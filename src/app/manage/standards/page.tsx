import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import StandardsBrowser, { type StandardRow } from "./StandardsBrowser";

type Row = {
  id: string;
  accreditor: string;
  standard: string;
  edition: string;
  code: string;
  title: string | null;
  skill_standards: { count: number }[] | null;
};

export default async function StandardsPage() {
  const { supabase } = await requireCoordinator();

  const { data } = await supabase
    .from("standards")
    .select(
      "id, accreditor, standard, edition, code, title, skill_standards(count)",
    )
    .order("standard", { ascending: true })
    .order("code", { ascending: true });

  const rows: StandardRow[] = ((data as Row[] | null) ?? []).map((s) => ({
    id: s.id,
    accreditor: s.accreditor,
    standard: s.standard,
    edition: s.edition,
    code: s.code,
    title: s.title,
    usedIn: s.skill_standards?.[0]?.count ?? 0,
  }));

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
            >
              ← Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Standards
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Published JPR references (NFPA 1001, etc.) that skills link to.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/manage/standards/import"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Import CSV
            </Link>
            <Link
              href="/manage/standards/new"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              + New standard
            </Link>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No standards yet. Import your CSV or add one.
          </div>
        ) : (
          <StandardsBrowser standards={rows} />
        )}
      </div>
    </main>
  );
}
