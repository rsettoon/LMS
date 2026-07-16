import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import QuestionForm, { type SkillOption } from "../../QuestionForm";
import { updateQuestion } from "../../actions";

type OptionRow = { label: string; is_correct: boolean; position: number };

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireCoordinator();
  const { id } = await params;

  const { data: question } = await supabase
    .from("questions")
    .select("id, type, prompt, category_id")
    .eq("id", id)
    .single();
  if (!question) notFound();

  const { data: options } = await supabase
    .from("question_options")
    .select("label, is_correct, position")
    .eq("question_id", id)
    .order("position", { ascending: true });

  const { data: skillLinks } = await supabase
    .from("question_skills")
    .select("skill_id")
    .eq("question_id", id);

  const { data: categories } = await supabase
    .from("question_categories")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: skills } = await supabase
    .from("skills")
    .select("id, skill_number, subsection, title, jpr_code")
    .order("skill_number", { ascending: true, nullsFirst: false })
    .order("subsection", { ascending: true, nullsFirst: true });

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/manage/questions"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Question bank
        </Link>
        <h1 className="mt-1 mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Edit question
        </h1>
        <QuestionForm
          action={updateQuestion}
          categories={categories ?? []}
          skills={(skills as SkillOption[] | null) ?? []}
          question={{
            id: question.id,
            type: question.type,
            prompt: question.prompt,
            category_id: question.category_id,
            skillIds: (skillLinks ?? []).map((l) => l.skill_id as string),
            options: ((options as OptionRow[] | null) ?? []).map((o) => ({
              label: o.label,
              is_correct: o.is_correct,
            })),
          }}
        />
      </div>
    </main>
  );
}
