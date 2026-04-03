import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// GET /api/invite/[code] — validate an invite code (public, no auth needed)
export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { rows } = await sql`
    SELECT
      ic.id, ic.code, ic.used_at,
      u.name AS invited_by
    FROM invite_codes ic
    JOIN users u ON u.id = ic.created_by
    WHERE ic.code = ${params.code}
  `;

  if (rows.length === 0) {
    return NextResponse.json({ valid: false, error: "Invalid invite code" }, { status: 404 });
  }

  const invite = rows[0];
  if (invite.used_at) {
    return NextResponse.json({ valid: false, error: "Invite already used" }, { status: 410 });
  }

  return NextResponse.json({ valid: true, invited_by: invite.invited_by, code: invite.code });
}

export const runtime = "nodejs";
