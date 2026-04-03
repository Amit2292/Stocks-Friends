import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { nanoid } from "nanoid";

const DEV_USER_ID = "dev-user-001";

// GET /api/invite — list my invite codes
export async function GET() {
  const session = await auth();
  if (!session?.user?.id && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session?.user?.id ?? DEV_USER_ID;

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
  const session = await auth();
  if (!session?.user?.id && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session?.user?.id ?? DEV_USER_ID;

  const code = nanoid(12);
  const { rows } = await sql`
    INSERT INTO invite_codes (code, created_by)
    VALUES (${code}, ${userId})
    RETURNING id, code, created_at
  `;
  return NextResponse.json({ invite: rows[0] }, { status: 201 });
}

export const runtime = "nodejs";
