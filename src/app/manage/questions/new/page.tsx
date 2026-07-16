import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import QuestionForm, { type SkillOption } from "../QuestionForm";
import { createQuestion } from "../actions";

export default async function NewQuestionPage() {
  const { supabase } = await requireCoordinator();

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
          New question
        </h1>
        <QuestionForm
          action={createQuestion}
          categories={categories ?? []}
          skills={(skills as SkillOption[] | null) ?? []}
        />
      </div>
    </main>
  );
}
