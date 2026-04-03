import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sql } from "@/lib/db";
import { ensureUser } from "@/lib/ensure-user";
import { z } from "zod";

const DEV_USER_ID = "dev-user-001";

// GET /api/groups — list groups the user belongs to
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
      g.id, g.name, g.description, g.invite_code, g.created_at,
      gm.role,
      (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id)::int AS member_count
    FROM groups g
    JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ${userId}
    ORDER BY g.created_at DESC
  `;
  return NextResponse.json({ groups: rows });
}

const createGroupSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  description: z.string().max(200).optional(),
});

// POST /api/groups — create a new group
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  if (user) await ensureUser(user);
  const userId = user?.id ?? DEV_USER_ID;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = createGroupSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 422 });
  }

  const { name, description } = result.data;

  // Step 1: create group
  const { rows: groupRows } = await sql`
    INSERT INTO groups (name, description, created_by)
    VALUES (${name}, ${description ?? null}, ${userId})
    RETURNING id, name, description, invite_code, created_at
  `;
  const group = groupRows[0];

  // Step 2: add creator as admin
  await sql`
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (${group.id}, ${userId}, 'admin')
  `;

  return NextResponse.json({
    group: { ...group, role: "admin", member_count: 1 }
  }, { status: 201 });
}

export const runtime = "nodejs";
