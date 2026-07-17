"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";

export type StandardFormState = { error: string } | undefined;

function parseStandard(formData: FormData) {
  return {
    accreditor: String(formData.get("accreditor") ?? "").trim(),
    standard: String(formData.get("standard") ?? "").trim(),
    edition: String(formData.get("edition") ?? "").trim(),
    code: String(formData.get("code") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
  };
}

function validate(s: ReturnType<typeof parseStandard>): string | null {
  if (!s.accreditor) return "Accreditor is required (e.g. NFPA).";
  if (!s.standard) return "Standard is required (e.g. 1001).";
  if (!s.edition) return "Edition is required (e.g. 2019).";
  if (!s.code) return "JPR code is required (e.g. 4.3.1).";
  return null;
}

function isDuplicate(message: string) {
  return message.toLowerCase().includes("duplicate");
}

export async function createStandard(
  _prev: StandardFormState,
  formData: FormData,
): Promise<StandardFormState> {
  const { supabase } = await requireCoordinator();
  const s = parseStandard(formData);
  const problem = validate(s);
  if (problem) return { error: problem };

  const { error } = await supabase.from("standards").insert(s);
  if (error) {
    return {
      error: isDuplicate(error.message)
        ? "That accreditor + standard + edition + code already exists."
        : error.message,
    };
  }

  revalidatePath("/manage/standards");
  redirect("/manage/standards");
}

export async function updateStandard(
  _prev: StandardFormState,
  formData: FormData,
): Promise<StandardFormState> {
  const { supabase } = await requireCoordinator();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing standard id." };
  const s = parseStandard(formData);
  const problem = validate(s);
  if (problem) return { error: problem };

  const { error } = await supabase.from("standards").update(s).eq("id", id);
  if (error) {
    return {
      error: isDuplicate(error.message)
        ? "That accreditor + standard + edition + code already exists."
        : error.message,
    };
  }

  revalidatePath("/manage/standards");
  redirect("/manage/standards");
}

export async function deleteStandard(formData: FormData) {
  const { supabase } = await requireCoordinator();
  const id = String(formData.get("id") ?? "");
  if (id) {
    // skill_standards links cascade away.
    await supabase.from("standards").delete().eq("id", id);
    revalidatePath("/manage/standards");
  }
  redirect("/manage/standards");
}
