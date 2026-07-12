"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireCoordinator } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type InviteState = { ok?: string; error?: string } | undefined;
export type ImportState =
  | { invited: number; skipped: string[]; failed: string[] }
  | { error: string }
  | undefined;

// The invite email links back to this app's /auth/confirm route. Deriving the
// origin from the request means invites work from localhost and production.
async function getOrigin() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function isDuplicateError(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("already been registered") ||
    m.includes("already registered") ||
    m.includes("already exists")
  );
}

export async function inviteFirefighter(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  await requireCoordinator(); // authorization — never trust the caller

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!email) return { error: "Email is required." };

  const origin = await getOrigin();
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName || null },
    redirectTo: `${origin}/set-password`,
  });

  if (error) {
    if (isDuplicateError(error.message)) {
      return { error: `${email} already has an account.` };
    }
    return { error: error.message };
  }

  revalidatePath("/manage/firefighters");
  return { ok: `Invitation sent to ${email}.` };
}

// --- CSV parsing (email,full_name) ---

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseCsv(text: string): { email: string; fullName: string }[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  // Skip a header row if present.
  const start = lines[0].toLowerCase().includes("email") ? 1 : 0;

  const rows: { email: string; fullName: string }[] = [];
  for (let i = start; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const email = (cols[0] ?? "").trim().toLowerCase();
    const fullName = (cols[1] ?? "").trim();
    if (email) rows.push({ email, fullName });
  }
  return rows;
}

export async function importFirefighters(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  await requireCoordinator();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a CSV file." };
  }

  const rows = parseCsv(await file.text());
  if (rows.length === 0) {
    return { error: "No rows found. Expected columns: email, full_name." };
  }

  const origin = await getOrigin();
  const admin = createAdminClient();

  let invited = 0;
  const skipped: string[] = [];
  const failed: string[] = [];

  for (const row of rows) {
    const { error } = await admin.auth.admin.inviteUserByEmail(row.email, {
      data: { full_name: row.fullName || null },
      redirectTo: `${origin}/set-password`,
    });
    if (!error) {
      invited++;
    } else if (isDuplicateError(error.message)) {
      skipped.push(row.email);
    } else {
      failed.push(`${row.email}: ${error.message}`);
    }
  }

  revalidatePath("/manage/firefighters");
  return { invited, skipped, failed };
}
