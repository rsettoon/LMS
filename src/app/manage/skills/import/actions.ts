"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireCoordinator } from "@/lib/auth";
import { parseCsvWithHeaders } from "@/lib/csv";

export type SkillImportState =
  | {
      created: number;
      updated: number;
      steps: number;
      warnings: string[];
      errors: string[];
    }
  | { error: string }
  | undefined;

// Accepts "1:00" (m:ss) or a plain number of seconds.
function parseTimeToSeconds(value: string): number | null {
  if (!value) return null;
  if (value.includes(":")) {
    const [m, s] = value.split(":");
    const mins = Number(m);
    const secs = Number(s);
    if (!Number.isFinite(mins) || !Number.isFinite(secs)) return null;
    return mins * 60 + secs;
  }
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// A skill's business key: number + subsection, falling back to title when the
// skill has no number.
function skillKey(skillNumber: string, subsection: string, title: string) {
  const sub = subsection.trim().toLowerCase();
  return skillNumber
    ? `#${skillNumber}|${sub}`
    : `t:${title.trim().toLowerCase()}|${sub}`;
}

async function findSkillId(
  supabase: SupabaseClient,
  skillNumber: number | null,
  subsection: string | null,
  title: string,
): Promise<string | null> {
  let query = supabase.from("skills").select("id");
  if (skillNumber != null) {
    query = query.eq("skill_number", skillNumber);
  } else {
    query = query.eq("title", title);
  }
  query = subsection
    ? query.eq("subsection", subsection)
    : query.is("subsection", null);

  const { data } = await query.limit(1);
  return data?.[0]?.id ?? null;
}

export async function importSkills(
  _prev: SkillImportState,
  formData: FormData,
): Promise<SkillImportState> {
  const { supabase } = await requireCoordinator();

  const skillsFile = formData.get("skills_file");
  const stepsFile = formData.get("steps_file");

  const hasSkills = skillsFile instanceof File && skillsFile.size > 0;
  const hasSteps = stepsFile instanceof File && stepsFile.size > 0;

  if (!hasSkills && !hasSteps) {
    return { error: "Choose a skills file, a steps file, or both." };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  let created = 0;
  let updated = 0;
  let stepCount = 0;

  // Remembers skills touched in this run so the steps file can resolve them
  // without another lookup.
  const idByKey = new Map<string, string>();

  // ---- Skills file ----
  if (hasSkills) {
    const rows = parseCsvWithHeaders(await (skillsFile as File).text());
    if (rows.length === 0) {
      return { error: "The skills file has no data rows." };
    }

    const { data: entities } = await supabase
      .from("authoring_entities")
      .select("id, name");
    const entityByName = new Map(
      (entities ?? []).map((e) => [
        String(e.name).trim().toLowerCase(),
        e.id as string,
      ]),
    );

    for (const [i, r] of rows.entries()) {
      const title = (r.title ?? "").trim();
      if (!title) {
        errors.push(`Skills row ${i + 2}: missing title.`);
        continue;
      }

      const numberRaw = (r.skill_number ?? "").trim();
      const parsed = numberRaw ? Number(numberRaw) : NaN;
      const skillNumber = Number.isFinite(parsed) ? parsed : null;
      const subsection = (r.subsection ?? "").trim() || null;

      const entityName = (r.authoring_entity ?? "").trim();
      let entityId: string | null = null;
      if (entityName) {
        entityId = entityByName.get(entityName.toLowerCase()) ?? null;
        if (!entityId) {
          const label =
            skillNumber != null
              ? `skill ${skillNumber}${subsection ?? ""} ("${title}")`
              : `"${title}"`;
          warnings.push(
            `Unknown authoring entity "${entityName}" — left blank on ${label}.`,
          );
        }
      }

      const payload = {
        skill_number: skillNumber,
        subsection,
        title,
        nfpa_edition: (r.nfpa_edition ?? "").trim() || null,
        jpr_code: (r.jpr_code ?? "").trim() || null,
        jpr_designation: (r.jpr_designation ?? "").trim() || null,
        condition: (r.condition ?? "").trim() || null,
        time_limit_seconds: parseTimeToSeconds((r.time_limit ?? "").trim()),
        notes: (r.notes ?? "").trim() || null,
        authoring_entity_id: entityId,
      };

      const existingId = await findSkillId(
        supabase,
        skillNumber,
        subsection,
        title,
      );

      if (existingId) {
        const { error } = await supabase
          .from("skills")
          .update(payload)
          .eq("id", existingId);
        if (error) {
          errors.push(`${title}: ${error.message}`);
          continue;
        }
        idByKey.set(skillKey(numberRaw, subsection ?? "", title), existingId);
        updated++;
      } else {
        const { data: inserted, error } = await supabase
          .from("skills")
          .insert(payload)
          .select("id")
          .single();
        if (error || !inserted) {
          errors.push(`${title}: ${error?.message ?? "could not create skill"}`);
          continue;
        }
        idByKey.set(skillKey(numberRaw, subsection ?? "", title), inserted.id);
        created++;
      }
    }
  }

  // ---- Steps file ----
  if (hasSteps) {
    const rows = parseCsvWithHeaders(await (stepsFile as File).text());
    if (rows.length === 0) {
      errors.push("The steps file has no data rows.");
    }

    // Group steps by the skill they belong to.
    type Group = {
      skillNumber: string;
      subsection: string;
      title: string;
      steps: { order: number; text: string }[];
    };
    const groups = new Map<string, Group>();

    rows.forEach((r, i) => {
      const text = (r.step_description ?? "").trim();
      if (!text) {
        errors.push(`Steps row ${i + 2}: missing step_description.`);
        return;
      }
      const skillNumber = (r.skill_number ?? "").trim();
      const subsection = (r.subsection ?? "").trim();
      const title = (r.title ?? "").trim();

      if (!skillNumber && !title) {
        errors.push(
          `Steps row ${i + 2}: needs a skill_number (or a title for unnumbered skills).`,
        );
        return;
      }

      const key = skillKey(skillNumber, subsection, title);
      if (!groups.has(key)) {
        groups.set(key, { skillNumber, subsection, title, steps: [] });
      }
      const group = groups.get(key)!;
      const n = Number(r.step_number);
      group.steps.push({
        order: Number.isFinite(n) && n > 0 ? n : group.steps.length + 1,
        text,
      });
    });

    for (const [key, group] of groups) {
      let skillId = idByKey.get(key) ?? null;

      if (!skillId) {
        const parsed = group.skillNumber ? Number(group.skillNumber) : NaN;
        skillId = await findSkillId(
          supabase,
          Number.isFinite(parsed) ? parsed : null,
          group.subsection || null,
          group.title,
        );
      }

      if (!skillId) {
        const label = group.skillNumber
          ? `Skill ${group.skillNumber}${group.subsection}`
          : `"${group.title}"`;
        errors.push(
          `${label} not found — ${group.steps.length} step(s) skipped. Import the skill first.`,
        );
        continue;
      }

      // The CSV is the source of truth: replace this skill's steps.
      await supabase.from("skill_steps").delete().eq("skill_id", skillId);

      const ordered = group.steps.slice().sort((a, b) => a.order - b.order);
      const stepRows = ordered.map((s, idx) => ({
        skill_id: skillId,
        step_number: idx + 1,
        description: s.text,
      }));

      const { error } = await supabase.from("skill_steps").insert(stepRows);
      if (error) errors.push(`Steps for ${key}: ${error.message}`);
      else stepCount += stepRows.length;
    }
  }

  revalidatePath("/manage/skills");
  return { created, updated, steps: stepCount, warnings, errors };
}
