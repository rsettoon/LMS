"use server";

import { randomInt } from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireCoordinator } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type AddState =
  | { ok: string; tempPassword?: string }
  | { error: string }
  | undefined;

export type ImportState =
  | {
      mode: "password";
      created: { email: string; password: string }[];
      skipped: string[];
      failed: string[];
    }
  | { mode: "invite"; invited: number; skipped: string[]; failed: string[] }
  | { error: string }
  | undefined;

// Readable temp password: no 0/O/1/l/I to avoid transcription mistakes when
// the coordinator writes these down or reads them aloud.
const PW_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
function generatePassword(length = 12) {
  let out = "";
  for (let i = 0; i < length; i++) out += PW_CHARS[randomInt(PW_CHARS.length)];
  return out;
}

async function getOrigin() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
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

export async function addFirefighter(
  _prev: AddState,
  formData: FormData,
): Promise<AddState> {
  await requireCoordinator(); // authorization — never trust the caller

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const method = String(formData.get("method") ?? "password");
  if (!email) return { error: "Email is required." };

  const admin = createAdminClient();

  if (method === "invite") {
    const origin = await getOrigin();
    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName || null },
      redirectTo: `${origin}/set-password`,
    });
    if (error) {
      if (isDuplicateError(error.message))
        return { error: `${email} already has an account.` };
      return { error: error.message };
    }
    revalidatePath("/manage/firefighters");
    return { ok: `Invitation sent to ${email}.` };
  }

  // Default: create the account directly with a temporary password. No email
  // is sent — the coordinator hands the password to the firefighter.
  const password = generatePassword();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // usable immediately; no confirmation email
    user_metadata: { full_name: fullName || null },
  });

  if (error) {
    if (isDuplicateError(error.message))
      return { error: `${email} already has an account.` };
    return { error: error.message };
  }

  revalidatePath("/manage/firefighters");
  return { ok: `Account created for ${email}.`, tempPassword: password };
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

  const method = String(formData.get("method") ?? "password");
  const admin = createAdminClient();

  const skipped: string[] = [];
  const failed: string[] = [];

  if (method === "invite") {
    const origin = await getOrigin();
    let invited = 0;
    for (const row of rows) {
      const { error } = await admin.auth.admin.inviteUserByEmail(row.email, {
        data: { full_name: row.fullName || null },
        redirectTo: `${origin}/set-password`,
      });
      if (!error) invited++;
      else if (isDuplicateError(error.message)) skipped.push(row.email);
      else failed.push(`${row.email}: ${error.message}`);
    }
    revalidatePath("/manage/firefighters");
    return { mode: "invite", invited, skipped, failed };
  }

  const created: { email: string; password: string }[] = [];
  for (const row of rows) {
    const password = generatePassword();
    const { error } = await admin.auth.admin.createUser({
      email: row.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: row.fullName || null },
    });
    if (!error) created.push({ email: row.email, password });
    else if (isDuplicateError(error.message)) skipped.push(row.email);
    else failed.push(`${row.email}: ${error.message}`);
  }

  revalidatePath("/manage/firefighters");
  return { mode: "password", created, skipped, failed };
}
