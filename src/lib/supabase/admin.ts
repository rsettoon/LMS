import "server-only";
import { createClient } from "@supabase/supabase-js";

// Admin client using the SECRET key. This bypasses Row Level Security and can
// create/invite users, so it must ONLY ever run on the server. Never import
// this into a Client Component.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
