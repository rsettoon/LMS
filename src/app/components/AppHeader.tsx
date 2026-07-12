import Link from "next/link";
import { getSessionProfile } from "@/lib/auth";
import { logout } from "@/app/login/actions";

// Shared, role-aware top navigation used across signed-in pages.
export default async function AppHeader() {
  const session = await getSessionProfile();
  const isCoordinator = session?.profile?.role === "coordinator";

  const linkClass =
    "text-sm text-zinc-600 hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-400";

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🚒</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            Firefighter Training LMS
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/lessons" className={linkClass}>
            Lessons
          </Link>
          {isCoordinator && (
            <>
              <Link href="/manage/skills" className={linkClass}>
                Skills
              </Link>
              <Link href="/manage/lessons" className={linkClass}>
                Manage Lessons
              </Link>
              <Link href="/manage/assignments" className={linkClass}>
                Assignments
              </Link>
              <Link href="/manage/overview" className={linkClass}>
                Overview
              </Link>
              <Link href="/manage/firefighters" className={linkClass}>
                Firefighters
              </Link>
            </>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
