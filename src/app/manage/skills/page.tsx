import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import { deleteSkill } from "./actions";

export default async function ManageSkillsPage() {
  const { supabase } = await requireCoordinator();

  const { data: skills } = await supabase
    .from("skills")
    .select("id, skill_number, subsection, title, jpr_code, jpr_designation")
    .order("skill_number", { ascending: true, nullsFirst: false })
    .order("subsection", { ascending: true, nullsFirst: true });

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
              Skills
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/manage/skills/import"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Import CSV
            </Link>
            <Link
              href="/manage/skills/new"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              + New skill
            </Link>
          </div>
        </div>

        {!skills || skills.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No skills yet. Click <span className="font-medium">New skill</span>{" "}
            to add your first one.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {skills.map((skill) => (
              <li
                key={skill.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                    {skill.skill_number != null && (
                      <span className="text-zinc-400">
                        {skill.skill_number}
                        {skill.subsection ?? ""}.{" "}
                      </span>
                    )}
                    {skill.title}
                  </div>
                  {skill.jpr_code && (
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      NFPA {skill.jpr_code}
                      {skill.jpr_designation ? ` (${skill.jpr_designation})` : ""}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href={`/manage/skills/${skill.id}`}
                    className="text-sm text-red-600 hover:underline"
                  >
                    View
                  </Link>
                  <Link
                    href={`/manage/skills/${skill.id}/edit`}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <form action={deleteSkill}>
                    <input type="hidden" name="id" value={skill.id} />
                    <button
                      type="submit"
                      className="text-sm text-zinc-500 hover:text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
