"use server";

import { revalidatePath } from "next/cache";
import { requireCoordinator } from "@/lib/auth";
import { parseCsvWithHeaders } from "@/lib/csv";

export type QuestionImportState =
  | {
      imported: number;
      skipped: string[];
      warnings: string[];
      errors: string[];
    }
  | { error: string }
  | undefined;

// Skills are referenced by number + optional subsection, e.g. "10" or "11A".
// Several may be listed, separated by | ; or , (inside a quoted cell).
function skillKeyFromToken(token: string) {
  return token.trim().toUpperCase().replace(/\s+/g, "");
}

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

  // Managed category list.
  const { data: categories } = await supabase
    .from("question_categories")
    .select("id, name");
  const categoryByName = new Map(
    (categories ?? []).map((c) => [
      String(c.name).trim().toLowerCase(),
      c.id as string,
    ]),
  );

  // Skills keyed by number+subsection (e.g. 11A).
  const { data: skills } = await supabase
    .from("skills")
    .select("id, skill_number, subsection");
  const skillByKey = new Map<string, string>();
  for (const s of skills ?? []) {
    if (s.skill_number == null) continue;
    const key = skillKeyFromToken(`${s.skill_number}${s.subsection ?? ""}`);
    skillByKey.set(key, s.id as string);
  }

  const skipped: string[] = [];
  const warnings: string[] = [];
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

    // Category (unknown names are left blank and reported).
    const categoryName = (r.category ?? "").trim();
    let categoryId: string | null = null;
    if (categoryName) {
      categoryId = categoryByName.get(categoryName.toLowerCase()) ?? null;
      if (!categoryId) {
        warnings.push(
          `Unknown category "${categoryName}" — left blank on "${prompt.slice(0, 40)}".`,
        );
      }
    }

    // Related skills (unknown references are skipped and reported).
    const skillIds: string[] = [];
    const skillsRaw = (r.skills ?? "").trim();
    if (skillsRaw) {
      for (const token of skillsRaw.split(/[|;,]/)) {
        const t = token.trim();
        if (!t) continue;
        const id = skillByKey.get(skillKeyFromToken(t));
        if (id) {
          if (!skillIds.includes(id)) skillIds.push(id);
        } else {
          warnings.push(
            `Unknown skill "${t}" — not linked on "${prompt.slice(0, 40)}".`,
          );
        }
      }
    }

    const { data: inserted, error } = await supabase
      .from("questions")
      .insert({ type, prompt, category_id: categoryId })
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

    if (skillIds.length > 0) {
      const linkRows = skillIds.map((skill_id) => ({
        question_id: inserted.id,
        skill_id,
      }));
      const { error: linkError } = await supabase
        .from("question_skills")
        .insert(linkRows);
      if (linkError) {
        warnings.push(
          `"${prompt.slice(0, 40)}": skills not linked — ${linkError.message}`,
        );
      }
    }

    seen.add(key); // guard against duplicates within the same file
    imported++;
  }

  revalidatePath("/manage/questions");
  return { imported, skipped, warnings, errors };
}
