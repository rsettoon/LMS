import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import ImportSkillsForm from "./ImportSkillsForm";

export default async function ImportSkillsPage() {
  await requireCoordinator();

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/manage/skills"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Skills
        </Link>
        <h1 className="mt-1 mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Import skills from CSV
        </h1>

        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            Two files, mirroring the two tables
          </p>
          <p className="mt-1">
            A skill&apos;s details are entered once in the skills file. Its
            steps live in the steps file, linked back by{" "}
            <code>skill_number</code> + <code>subsection</code>.
          </p>

          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>
              <strong>skills.csv</strong> — <code>skill_number, subsection,
              title, nfpa_edition, jpr_code, jpr_designation, condition,
              time_limit, notes, authoring_entity</code>
            </li>
            <li>
              <strong>skill-steps.csv</strong> — <code>skill_number,
              subsection, step_number, step_description</code>
            </li>
            <li>
              <code>time_limit</code> accepts <code>1:00</code> (m:ss) or a
              number of seconds
            </li>
            <li>
              <code>authoring_entity</code> must match a name on your{" "}
              <Link
                href="/manage/authoring-entities"
                className="text-red-600 hover:underline"
              >
                authoring entities
              </Link>{" "}
              list, or it is left blank and reported
            </li>
            <li>
              Re-importing a skill with the same number + subsection{" "}
              <strong>updates</strong> it instead of duplicating, and importing
              steps <strong>replaces</strong> that skill&apos;s existing steps
            </li>
            <li>
              For a skill with <em>no</em> number, add a <code>title</code>{" "}
              column to the steps file so its steps can be matched
            </li>
          </ul>
        </div>

        <ImportSkillsForm />
      </div>
    </main>
  );
}
