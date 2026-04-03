import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export interface TickerQuote {
  price: number;
  change: number;
  changePercent: number;
}

const MASSIVE_BASE = "https://api.massive.com";

// Fetch latest intraday close for a ticker (falls back to prev-day close)
async function fetchQuote(ticker: string, apiKey: string): Promise<TickerQuote | null> {
  // Try today's most recent 1-minute bar first
  try {
    const today = new Date().toISOString().split("T")[0];
    const url = `${MASSIVE_BASE}/v2/aggs/ticker/${ticker}/range/1/minute/${today}/${today}?adjusted=true&sort=desc&limit=1&apiKey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        const bar = data.results[0];
        // Get prev close to compute change
        const prevRes = await fetch(`${MASSIVE_BASE}/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${apiKey}`, { next: { revalidate: 300 } });
        let prevClose = bar.c;
        if (prevRes.ok) {
          const prevData = await prevRes.json();
          if (Array.isArray(prevData.results) && prevData.results.length > 0) {
            prevClose = prevData.results[0].c;
          }
        }
        const change = bar.c - prevClose;
        const changePercent = prevClose ? (change / prevClose) * 100 : 0;
        return { price: bar.c, change, changePercent };
      }
    }
  } catch { /* fall through */ }

  // Fall back to previous day close
  try {
    const url = `${MASSIVE_BASE}/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        const bar = data.results[0];
        const price = bar.c;
        const open  = bar.o;
        const change = price - open;
        const changePercent = open ? (change / open) * 100 : 0;
        return { price, change, changePercent };
      }
    }
  } catch { /* ignore */ }

  return null;
}

// GET /api/prices?tickers=AAPL,TSLA,NVDA
// Returns { prices: { AAPL: { price, change, changePercent }, ... } }
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("tickers");
  if (!raw) {
    return NextResponse.json({ error: "tickers required" }, { status: 400 });
  }

  const tickers = raw
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 30);

  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const entries = await Promise.all(
      tickers.map(async (ticker) => {
        const quote = await fetchQuote(ticker, apiKey);
        return [ticker, quote] as [string, TickerQuote | null];
      })
    );

    const prices: Record<string, TickerQuote> = {};
    for (const [ticker, quote] of entries) {
      if (quote) prices[ticker] = quote;
    }

    return NextResponse.json(
      { prices },
      { headers: { "Cache-Control": "public, s-maxage=30" } }
    );
  } catch (error) {
    console.error("[GET /api/prices]", error);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 502 });
  }
}
