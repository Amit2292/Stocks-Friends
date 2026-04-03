import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

const DEV_USER_ID = "dev-user-001";

// GET /api/portfolio — authenticated user's aggregated positions
export async function GET() {
  const session = await auth();
  if (!session?.user?.id && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session?.user?.id ?? DEV_USER_ID;

  try {
    // CTE-based aggregation:
    // 1. Sum BUY qty + value per ticker
    // 2. Sum SELL qty + proceeds per ticker
    // 3. Full outer join to get net position, avg cost, realized P&L
    const { rows } = await sql`
      WITH
        buys AS (
          SELECT
            ticker,
            SUM(quantity)           AS buy_qty,
            SUM(price * quantity)   AS buy_value
          FROM trades
          WHERE user_id = ${userId} AND type = 'BUY'
          GROUP BY ticker
        ),
        sells AS (
          SELECT
            ticker,
            SUM(quantity)           AS sell_qty,
            SUM(price * quantity)   AS sell_proceeds
          FROM trades
          WHERE user_id = ${userId} AND type = 'SELL'
          GROUP BY ticker
        ),
        combined AS (
          SELECT
            COALESCE(b.ticker, s.ticker)       AS ticker,
            COALESCE(b.buy_qty, 0)::float      AS buy_qty,
            COALESCE(b.buy_value, 0)::float    AS buy_value,
            COALESCE(s.sell_qty, 0)::float     AS sell_qty,
            COALESCE(s.sell_proceeds, 0)::float AS sell_proceeds
          FROM buys b
          FULL OUTER JOIN sells s ON b.ticker = s.ticker
        )
      SELECT
        c.ticker,
        (c.buy_qty - c.sell_qty)   AS net_quantity,
        CASE
          WHEN c.buy_qty > 0 THEN c.buy_value / c.buy_qty
          ELSE 0
        END                        AS avg_cost,
        c.buy_value                AS total_invested,
        (c.sell_proceeds - CASE
          WHEN c.buy_qty > 0 THEN (c.sell_qty * c.buy_value / c.buy_qty)
          ELSE 0
        END)                       AS realized_pnl,
        (
          SELECT COUNT(*)::int
          FROM trades t2
          WHERE t2.user_id = ${userId} AND t2.ticker = c.ticker
        )                          AS trade_count
      FROM combined c
      ORDER BY c.buy_value DESC
    `;
    return NextResponse.json({ positions: rows });
  } catch (error) {
    console.error("[GET /api/portfolio]", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
