import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export interface TickerQuote {
  price: number;
  change: number;
  changePercent: number;
}

const FINNHUB_BASE = "https://finnhub.io/api/v1";

async function fetchQuote(ticker: string, apiKey: string): Promise<TickerQuote | null> {
  try {
    const res = await fetch(
      `${FINNHUB_BASE}/quote?symbol=${ticker}&token=${apiKey}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // c = current price, d = change, dp = percent change, pc = prev close
    if (!data.c || data.c === 0) return null;
    return {
      price: data.c,
      change: data.d ?? 0,
      changePercent: data.dp ?? 0,
    };
  } catch {
    return null;
  }
}

// GET /api/prices?tickers=AAPL,TSLA,NVDA
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("tickers");
  if (!raw) return NextResponse.json({ error: "tickers required" }, { status: 400 });

  const tickers = raw
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 30);

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

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
}
