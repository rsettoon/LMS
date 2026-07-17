import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import SkillForm, { type StandardOption } from "../SkillForm";
import { createSkill } from "../actions";

export default async function NewSkillPage() {
  const { supabase } = await requireCoordinator();

  const { data: entities } = await supabase
    .from("authoring_entities")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: standards } = await supabase
    .from("standards")
    .select("id, accreditor, standard, edition, code, title")
    .order("standard", { ascending: true })
    .order("code", { ascending: true });

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
          New skill
        </h1>
        <SkillForm
          action={createSkill}
          entities={entities ?? []}
          standards={(standards as StandardOption[] | null) ?? []}
        />
      </div>
    </main>
  );
}
