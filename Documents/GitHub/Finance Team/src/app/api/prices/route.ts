import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export interface TickerQuote {
  price: number;
  change: number;
  changePercent: number;
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
    .slice(0, 50);

  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "POLYGON_API_KEY not configured" }, { status: 500 });
  }

  try {
    const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${tickers.join(",")}&apiKey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 60 } });

    if (!res.ok) {
      throw new Error(`Polygon responded ${res.status}`);
    }

    const data = await res.json();

    const prices: Record<string, TickerQuote> = {};
    if (Array.isArray(data.tickers)) {
      for (const t of data.tickers) {
        const price = t.lastTrade?.p ?? t.day?.c ?? t.prevDay?.c ?? null;
        const prevClose = t.prevDay?.c ?? null;
        if (price !== null) {
          const change = prevClose !== null ? price - prevClose : 0;
          const changePercent = prevClose ? (change / prevClose) * 100 : 0;
          prices[t.ticker] = { price, change, changePercent };
        }
      }
    }

    return NextResponse.json(
      { prices },
      { headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  } catch (error) {
    console.error("[GET /api/prices]", error);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 502 });
  }
}
