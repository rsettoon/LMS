import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "firefighter" | "coordinator";

// Cached per request: current user + their profile (or null if signed out).
// Use in pages/nav to display info or branch on role.
export const getSessionProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return { user, profile: profile as { full_name: string | null; role: Role } | null };
});

// Guard for Coordinator-only pages AND Server Actions. Redirects if the caller
// isn't a signed-in coordinator, otherwise returns the Supabase client to reuse.
export async function requireCoordinator() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "coordinator") redirect("/dashboard");

  return { supabase, user, profile };
}
