import { sql } from "@/lib/db";
import type { User } from "@supabase/supabase-js";

/**
 * Upsert a Supabase user into the Neon `users` table so that FK constraints
 * on trades, groups, group_members, and invite_codes are satisfied.
 * Call this after every authenticated API request before touching the DB.
 */
export async function ensureUser(user: User): Promise<void> {
  const name =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "User";
  const image = user.user_metadata?.avatar_url ?? null;
  const email = user.email ?? null;

  await sql`
    INSERT INTO users (id, name, email, image)
    VALUES (${user.id}, ${name}, ${email}, ${image})
    ON CONFLICT (id) DO UPDATE SET
      name  = EXCLUDED.name,
      image = EXCLUDED.image
  `;
}
