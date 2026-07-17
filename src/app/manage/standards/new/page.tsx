import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import StandardForm from "../StandardForm";
import { createStandard } from "../actions";

export default async function NewStandardPage() {
  await requireCoordinator();
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
          New standard
        </h1>
        <StandardForm action={createStandard} />
      </div>
    </main>
  );
}
