"use server";

import { revalidatePath } from "next/cache";
import { requireCoordinator } from "@/lib/auth";
import { parseCsvWithHeaders } from "@/lib/csv";

export type StandardImportState =
  | { inserted: number; updated: number; errors: string[] }
  | { error: string }
  | undefined;

export async function importStandards(
  _prev: StandardImportState,
  formData: FormData,
): Promise<StandardImportState> {
  const { supabase } = await requireCoordinator();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a CSV file." };
  }

  const rows = parseCsvWithHeaders(await file.text());
  if (rows.length === 0) {
    return { error: "No data rows found. Is the header row present?" };
  }

  // Existing standards keyed by accreditor|standard|edition|code.
  const { data: existing } = await supabase
    .from("standards")
    .select("id, accreditor, standard, edition, code");
  const idByKey = new Map<string, string>();
  for (const s of existing ?? []) {
    idByKey.set(
      `${s.accreditor}|${s.standard}|${s.edition}|${s.code}`.toLowerCase(),
      s.id as string,
    );
  }

  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;

  for (const [i, r] of rows.entries()) {
    const accreditor = (r.accreditor ?? "").trim();
    const standard = (r.standard ?? "").trim();
    const edition = (r.edition ?? "").trim();
    const code = (r.code ?? "").trim();
    const title = (r.title ?? "").trim() || null;
    const description = (r.description ?? "").trim() || null;

    if (!accreditor || !standard || !edition || !code) {
      errors.push(
        `Row ${i + 2}: needs accreditor, standard, edition, and code.`,
      );
      continue;
    }

    const payload = { accreditor, standard, edition, code, title, description };
    const key = `${accreditor}|${standard}|${edition}|${code}`.toLowerCase();
    const existingId = idByKey.get(key);

    if (existingId) {
      const { error } = await supabase
        .from("standards")
        .update(payload)
        .eq("id", existingId);
      if (error) errors.push(`${standard} ${code}: ${error.message}`);
      else updated++;
    } else {
      const { data: ins, error } = await supabase
        .from("standards")
        .insert(payload)
        .select("id")
        .single();
      if (error || !ins) {
        errors.push(`${standard} ${code}: ${error?.message ?? "insert failed"}`);
      } else {
        idByKey.set(key, ins.id);
        inserted++;
      }
    }
  }

  revalidatePath("/manage/standards");
  return { inserted, updated, errors };
}
