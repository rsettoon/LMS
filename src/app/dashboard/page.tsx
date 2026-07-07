import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../login/actions";

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

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚒</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              Firefighter Training LMS
            </span>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

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

        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {isCoordinator
            ? "Coordinator tools (manage lessons, competencies, assignments, and reports) will appear here as we build the next phases."
            : "Your assigned lessons and training progress will appear here as we build the next phases."}
        </div>
      </div>
    </main>
  );
}
