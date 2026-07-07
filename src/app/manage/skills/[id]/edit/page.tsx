import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import SkillForm from "../../SkillForm";
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
        <SkillForm action={updateSkill} skill={skill} steps={steps ?? []} />
      </div>
    </main>
  );
}
