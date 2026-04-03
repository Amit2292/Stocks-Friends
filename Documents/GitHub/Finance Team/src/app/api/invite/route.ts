import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sql } from "@/lib/db";
import { ensureUser } from "@/lib/ensure-user";
import { nanoid } from "nanoid";

const DEV_USER_ID = "dev-user-001";

// GET /api/invite — list my invite codes
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  if (user) await ensureUser(user);
  const userId = user?.id ?? DEV_USER_ID;

  const { rows } = await sql`
    SELECT
      ic.id, ic.code, ic.created_at,
      ic.used_at,
      u.name AS used_by_name
    FROM invite_codes ic
    LEFT JOIN users u ON u.id = ic.used_by
    WHERE ic.created_by = ${userId}
    ORDER BY ic.created_at DESC
  `;
  return NextResponse.json({ invites: rows });
}

// POST /api/invite — generate a new invite code
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  if (user) await ensureUser(user);
  const userId = user?.id ?? DEV_USER_ID;

  const code = nanoid(12);
  const { rows } = await sql`
    INSERT INTO invite_codes (code, created_by)
    VALUES (${code}, ${userId})
    RETURNING id, code, created_at
  `;
  return NextResponse.json({ invite: rows[0] }, { status: 201 });
}

export const runtime = "nodejs";
