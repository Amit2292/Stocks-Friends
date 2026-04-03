import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sql } from "@/lib/db";

const DEV_USER_ID = "dev-user-001";

// GET /api/groups/[id] — get single group (must be a member)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const userId = user?.id ?? DEV_USER_ID;

  const { rows } = await sql`
    SELECT
      g.id, g.name, g.description, g.invite_code, g.created_at,
      gm.role,
      (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id)::int AS member_count
    FROM groups g
    JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ${userId}
    WHERE g.id = ${params.id}
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found or not a member" }, { status: 404 });
  }

  return NextResponse.json({ group: rows[0] });
}

export const runtime = "nodejs";
