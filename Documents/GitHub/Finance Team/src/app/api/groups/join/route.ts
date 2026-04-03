import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sql } from "@/lib/db";

const DEV_USER_ID = "dev-user-001";

// POST /api/groups/join  { code: "abc123" }
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const userId = user?.id ?? DEV_USER_ID;

  let body: { code?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = body.code?.trim();
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const { rows: groupRows } = await sql`
    SELECT id, name FROM groups WHERE invite_code = ${code}
  `;
  if (groupRows.length === 0) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const group = groupRows[0];

  // Upsert — ignore if already a member
  await sql`
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (${group.id}, ${userId}, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING
  `;

  return NextResponse.json({ group });
}

export const runtime = "nodejs";
