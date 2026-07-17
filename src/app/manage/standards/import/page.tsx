import Link from "next/link";
import { requireCoordinator } from "@/lib/auth";
import ImportStandardsForm from "./ImportStandardsForm";

export default async function ImportStandardsPage() {
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
        <h1 className="mt-1 mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Import standards from CSV
        </h1>

        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            One row per JPR
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Columns:{" "}
              <code>ACCREDITOR, STANDARD, CODE, EDITION, TITLE, DESCRIPTION</code>
            </li>
            <li>
              A row is identified by <code>ACCREDITOR + STANDARD + EDITION +
              CODE</code>; re-importing the same one <strong>updates</strong> its
              title/description instead of duplicating
            </li>
          </ul>
          <a
            href="/manage/standards/import/template"
            className="mt-3 inline-block font-medium text-red-600 hover:underline"
          >
            Download template
          </a>
        </div>

        <ImportStandardsForm />
      </div>
    </main>
  );
}
