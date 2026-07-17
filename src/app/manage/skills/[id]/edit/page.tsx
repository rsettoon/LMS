import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import SkillForm, { type StandardOption } from "../../SkillForm";
import { updateSkill } from "../../actions";

export default async function EditSkillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireCoordinator();
  const { id } = await params;

  const { data: skill } = await supabase
    .from("skills")
    .select("*")
    .eq("id", id)
    .single();

  if (!skill) notFound();

  const { data: steps } = await supabase
    .from("skill_steps")
    .select("step_number, description")
    .eq("skill_id", id)
    .order("step_number", { ascending: true });

  const { data: entities } = await supabase
    .from("authoring_entities")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: standards } = await supabase
    .from("standards")
    .select("id, accreditor, standard, edition, code, title")
    .order("standard", { ascending: true })
    .order("code", { ascending: true });

  const { data: stdLinks } = await supabase
    .from("skill_standards")
    .select("standard_id")
    .eq("skill_id", id);
  const selectedStandardIds = (stdLinks ?? []).map(
    (l) => l.standard_id as string,
  );

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/manage/skills"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Skills
        </Link>
        <h1 className="mt-1 mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Edit skill
        </h1>
        <SkillForm
          action={updateSkill}
          skill={skill}
          steps={steps ?? []}
          entities={entities ?? []}
          standards={(standards as StandardOption[] | null) ?? []}
          selectedStandardIds={selectedStandardIds}
        />
      </div>
    </main>
  );
}
