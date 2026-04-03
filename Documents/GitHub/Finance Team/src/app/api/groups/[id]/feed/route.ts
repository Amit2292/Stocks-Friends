import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

const DEV_USER_ID = "dev-user-001";

// GET /api/groups/[id]/feed — trades from group members only
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session?.user?.id ?? DEV_USER_ID;

  // Verify the requesting user is a member
  const { rows: membership } = await sql`
    SELECT 1 FROM group_members WHERE group_id = ${params.id} AND user_id = ${userId}
  `;
  if (membership.length === 0) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const { rows } = await sql`
    SELECT
      t.id, t.user_id, t.ticker, t.type,
      t.price::float, t.quantity::float,
      t.timestamp, t.tags, t.notes, t.created_at,
      u.name  AS user_name,
      u.image AS user_image,
      u.email AS user_email
    FROM trades t
    JOIN users u ON u.id = t.user_id
    WHERE t.user_id IN (
      SELECT user_id FROM group_members WHERE group_id = ${params.id}
    )
    ORDER BY t.timestamp DESC
    LIMIT 100
  `;
  return NextResponse.json({ trades: rows });
}

export const runtime = "nodejs";
