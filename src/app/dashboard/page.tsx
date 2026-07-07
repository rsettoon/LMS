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
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-zinc-500 sm:col-span-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
              Assignments and reports will appear here as we build the next
              phases.
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/lessons"
              className="rounded-xl border border-zinc-200 bg-white p-6 transition-colors hover:border-red-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-800"
            >
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Lessons →
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Browse training lessons and watch the demonstrations.
              </p>
            </Link>
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
              Your assigned lessons and training progress will appear here as we
              build the next phases.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
