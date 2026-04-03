import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sql } from "@/lib/db";
import { ensureUser } from "@/lib/ensure-user";
import { z } from "zod";

const createTradeSchema = z.object({
  ticker: z.string().min(1).max(10).trim().toUpperCase(),
  type: z.enum(["BUY", "SELL"]),
  price: z.number().positive().max(9_999_999),
  quantity: z.number().positive().max(9_999_999),
  tags: z.array(z.string()).max(5).default([]),
  notes: z.string().max(500).optional(),
});

const DEV_USER_ID = "dev-user-001";

// GET /api/trades — social feed (all users, newest first)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  try {
    const { rows } = await sql`
      SELECT
        t.id,
        t.user_id,
        t.ticker,
        t.type,
        t.price::float      AS price,
        t.quantity::float   AS quantity,
        t.timestamp,
        t.tags,
        t.notes,
        t.created_at,
        u.name  AS user_name,
        u.image AS user_image,
        u.email AS user_email
      FROM trades t
      JOIN users u ON u.id = t.user_id
      ORDER BY t.timestamp DESC
      LIMIT 100
    `;
    return NextResponse.json({ trades: rows });
  } catch (error) {
    console.error("[GET /api/trades]", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// POST /api/trades — log a new trade
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }
  if (user) await ensureUser(user);
  const userId = user?.id ?? DEV_USER_ID;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = createTradeSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten() },
      { status: 422 }
    );
  }

  const { ticker, type, price, quantity, tags, notes } = result.data;
  const tagsJson = JSON.stringify(tags);

  try {
    const { rows } = await sql`
      INSERT INTO trades (user_id, ticker, type, price, quantity, tags, notes)
      VALUES (
        ${userId},
        ${ticker},
        ${type},
        ${price},
        ${quantity},
        ${tagsJson}::jsonb,
        ${notes ?? null}
      )
      RETURNING
        id, user_id, ticker, type,
        price::float    AS price,
        quantity::float AS quantity,
        timestamp, tags, notes, created_at
    `;
    return NextResponse.json({ trade: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/trades]", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("foreign key")) {
      return NextResponse.json(
        { error: "Session expired — please sign in again." },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
