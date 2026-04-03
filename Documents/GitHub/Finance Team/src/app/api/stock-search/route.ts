import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export interface SearchResult {
  ticker: string;
  name: string;
  market: string;
  type: string;
  primaryExchange: string;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.MASSIVE_API_KEY ?? process.env.POLYGON_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const url = `https://api.massive.com/v3/reference/tickers?search=${encodeURIComponent(query)}&active=true&market=stocks&limit=10&apiKey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Polygon ${res.status}`);

    const data = await res.json();
    const results: SearchResult[] = (data.results ?? []).map((t: {
      ticker: string;
      name: string;
      market: string;
      type: string;
      primary_exchange: string;
    }) => ({
      ticker: t.ticker,
      name: t.name,
      market: t.market,
      type: t.type,
      primaryExchange: t.primary_exchange,
    }));

    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  } catch (err) {
    console.error("[stock-search]", err);
    return NextResponse.json({ results: [] }, { status: 502 });
  }
}
