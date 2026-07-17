import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import StandardForm from "../../StandardForm";
import { updateStandard } from "../../actions";

export default async function EditStandardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireCoordinator();
  const { id } = await params;

  const { data: standard } = await supabase
    .from("standards")
    .select("*")
    .eq("id", id)
    .single();
  if (!standard) notFound();

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/manage/standards"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Standards
        </Link>
        <h1 className="mt-1 mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Edit standard
        </h1>
        <StandardForm action={updateStandard} standard={standard} />
      </div>
    </main>
  );
}
