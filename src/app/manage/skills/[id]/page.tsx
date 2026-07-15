import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import { deleteSkill } from "../actions";

function formatTime(seconds: number | null): string | null {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">{value}</dd>
    </div>
  );
}

export default async function ViewSkillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireCoordinator();
  const { id } = await params;

  const { data: skill } = await supabase
    .from("skills")
    .select("*, authoring_entities ( name )")
    .eq("id", id)
    .single();

  if (!skill) notFound();

  const { data: steps } = await supabase
    .from("skill_steps")
    .select("step_number, description")
    .eq("skill_id", id)
    .order("step_number", { ascending: true });

  const authoringEntity =
    (skill.authoring_entities as { name: string } | null)?.name ?? null;
  const jpr = skill.jpr_code
    ? `NFPA ${skill.jpr_code}${skill.jpr_designation ? ` (${skill.jpr_designation})` : ""}${skill.nfpa_edition ? `, ${skill.nfpa_edition} edition` : ""}`
    : null;
  const heading = `${
    skill.skill_number != null
      ? `${skill.skill_number}${skill.subsection ?? ""}. `
      : ""
  }${skill.title}`;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/manage/skills"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Skills
        </Link>

        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {heading}
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href={`/manage/skills/${id}/edit`}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Edit
            </Link>
            <form action={deleteSkill}>
              <input type="hidden" name="id" value={id} />
              <button
                type="submit"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-red-600 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-300"
              >
                Delete
              </button>
            </form>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
          <Field label="Reference" value={jpr} />
          <Field label="Authoring entity" value={authoringEntity} />
          <Field label="Condition" value={skill.condition} />
          <Field label="Time limit" value={formatTime(skill.time_limit_seconds)} />
          {skill.notes && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Notes
              </dt>
              <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                {skill.notes}
              </dd>
            </div>
          )}
        </dl>

        <h2 className="mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Performance steps
        </h2>
        {!steps || steps.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            No steps entered.
          </p>
        ) : (
          <ol className="mt-3 list-decimal space-y-2 rounded-xl border border-zinc-200 bg-white p-5 pl-9 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {steps.map((step) => (
              <li key={step.step_number}>{step.description}</li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
