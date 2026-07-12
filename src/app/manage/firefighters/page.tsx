import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import AddFirefighterForm from "./InviteForm";
import ImportForm from "./ImportForm";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
};

export default async function ManageFirefightersPage() {
  const { supabase } = await requireCoordinator();

  const { data: people } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .order("role", { ascending: true })
    .order("full_name", { ascending: true, nullsFirst: false });

  const rows = (people as Profile[] | null) ?? [];

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-1 mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Firefighters
        </h1>

        <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-50">
            Add a firefighter
          </h2>
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            A temporary password needs no email to be delivered — you hand it to
            them and they change it after signing in.
          </p>
          <AddFirefighterForm />
        </section>

        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
            Import from CSV
          </h2>
          <ImportForm />
        </section>

        <h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
          Everyone ({rows.length})
        </h2>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No accounts yet.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {rows.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                    {p.full_name || "(no name yet)"}
                  </div>
                  <div className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                    {p.email}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.role === "coordinator"
                      ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {p.role === "coordinator" ? "Coordinator" : "Firefighter"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
