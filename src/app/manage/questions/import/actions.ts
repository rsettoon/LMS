"use server";

import { revalidatePath } from "next/cache";
import { requireCoordinator } from "@/lib/auth";
import { parseCsvWithHeaders } from "@/lib/csv";

export type QuestionImportState =
  | { imported: number; skipped: string[]; errors: string[] }
  | { error: string }
  | undefined;

export async function importQuestions(
  _prev: QuestionImportState,
  formData: FormData,
): Promise<QuestionImportState> {
  const { supabase } = await requireCoordinator();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a CSV file." };
  }

  const rows = parseCsvWithHeaders(await file.text());
  if (rows.length === 0) {
    return { error: "No data rows found. Is the header row present?" };
  }

  // Existing prompts (lowercased) so re-imports skip duplicates.
  const { data: existing } = await supabase.from("questions").select("prompt");
  const seen = new Set(
    (existing ?? []).map((q) => String(q.prompt).trim().toLowerCase()),
  );

  const skipped: string[] = [];
  const errors: string[] = [];
  let imported = 0;

  for (const [i, r] of rows.entries()) {
    const prompt = (r.prompt ?? "").trim();
    if (!prompt) {
      errors.push(`Row ${i + 2}: missing prompt.`);
      continue;
    }

    const key = prompt.toLowerCase();
    if (seen.has(key)) {
      skipped.push(prompt);
      continue;
    }

    const rawType = (r.question_type ?? "")
      .trim()
      .toLowerCase()
      .replace(/[\s\-/]/g, "_");
    const type =
      rawType === "true_false" || rawType === "tf" || rawType === "truefalse"
        ? "true_false"
        : "multiple_choice";

    let options: string[];
    if (type === "true_false") {
      const a = (r.option_a ?? "").trim();
      const b = (r.option_b ?? "").trim();
      options = a && b ? [a, b] : ["True", "False"];
    } else {
      options = [r.option_a, r.option_b, r.option_c, r.option_d, r.option_e]
        .map((v) => (v ?? "").trim())
        .filter(Boolean);
    }

    if (options.length < 2) {
      errors.push(`"${prompt.slice(0, 40)}": needs at least 2 options.`);
      continue;
    }

    const correctRaw = (r.correct ?? "").trim();
    let correctIndex = -1;
    if (/^[a-zA-Z]$/.test(correctRaw)) {
      correctIndex = correctRaw.toUpperCase().charCodeAt(0) - 65;
    }
    if (correctIndex < 0 || correctIndex >= options.length) {
      correctIndex = options.findIndex(
        (o) => o.toLowerCase() === correctRaw.toLowerCase(),
      );
    }
    if (correctIndex < 0 || correctIndex >= options.length) {
      errors.push(
        `"${prompt.slice(0, 40)}": can't tell which answer is correct ("${correctRaw}").`,
      );
      continue;
    }

    const { data: inserted, error } = await supabase
      .from("questions")
      .insert({ type, prompt })
      .select("id")
      .single();
    if (error || !inserted) {
      errors.push(`"${prompt.slice(0, 40)}": ${error?.message ?? "insert failed"}`);
      continue;
    }

    const optionRows = options.map((label, oi) => ({
      question_id: inserted.id,
      label,
      is_correct: oi === correctIndex,
      position: oi + 1,
    }));
    const { error: optError } = await supabase
      .from("question_options")
      .insert(optionRows);
    if (optError) {
      errors.push(`"${prompt.slice(0, 40)}": ${optError.message}`);
      continue;
    }

    seen.add(key); // guard against duplicates within the same file
    imported++;
  }

  revalidatePath("/manage/questions");
  return { imported, skipped, errors };
}
