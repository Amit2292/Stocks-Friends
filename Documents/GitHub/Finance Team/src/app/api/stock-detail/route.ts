import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MASSIVE_BASE = "https://api.massive.com";

export interface StockDetail {
  ticker: string;
  name: string;
  description?: string;
  logoUrl?: string;
  homepageUrl?: string;
  market: string;
  primaryExchange: string;
  type: string;
  price: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  chartPoints: { t: number; c: number }[];
  isMarketOpen: boolean;
}

interface MassiveAgg {
  o: number; c: number; h: number; l: number; v: number; t: number;
}

interface MassiveRef {
  name?: string;
  description?: string;
  market?: string;
  primary_exchange?: string;
  type?: string;
  homepage_url?: string;
  market_cap?: number;
  branding?: { logo_url?: string; icon_url?: string };
}

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.toUpperCase().trim();
  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });

  const apiKey = process.env.MASSIVE_API_KEY ?? process.env.POLYGON_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  try {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const [prevRes, refRes, aggsRes] = await Promise.all([
      // Previous day OHLCV (always available)
      fetch(`${MASSIVE_BASE}/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${apiKey}`, { next: { revalidate: 60 } }),
      // Company reference data
      fetch(`${MASSIVE_BASE}/v3/reference/tickers/${ticker}?apiKey=${apiKey}`, { next: { revalidate: 3600 } }),
      // Daily bars for sparkline (last 7 days)
      fetch(`${MASSIVE_BASE}/v2/aggs/ticker/${ticker}/range/1/day/${fmt(from)}/${fmt(to)}?adjusted=true&sort=asc&limit=10&apiKey=${apiKey}`, { next: { revalidate: 300 } }),
    ]);

    const prevJson = prevRes.ok ? await prevRes.json() : {};
    const refJson  = refRes.ok  ? await refRes.json()  : {};
    const aggsJson = aggsRes.ok ? await aggsRes.json() : {};

    const bar: MassiveAgg | null = prevJson?.results?.[0] ?? null;
    const ref: MassiveRef | null = refJson?.results ?? null;

    if (!bar) {
      return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
    }

    const price     = bar.c;
    const prevOpen  = bar.o;
    const change    = price - prevOpen;
    const changePct = prevOpen ? (change / prevOpen) * 100 : 0;

    const aggsResults: MassiveAgg[] = aggsJson?.results ?? [];

    const logoUrl = ref?.branding?.logo_url
      ? `${ref.branding.logo_url}?apiKey=${apiKey}`
      : undefined;

    const detail: StockDetail = {
      ticker,
      name:            ref?.name ?? ticker,
      description:     ref?.description?.slice(0, 300),
      logoUrl,
      homepageUrl:     ref?.homepage_url,
      market:          ref?.market ?? "stocks",
      primaryExchange: ref?.primary_exchange ?? "",
      type:            ref?.type ?? "CS",
      price,
      open:      bar.o,
      high:      bar.h,
      low:       bar.l,
      prevClose: bar.c,
      change,
      changePercent: changePct,
      volume:    bar.v,
      marketCap: ref?.market_cap,
      chartPoints: aggsResults.map((b) => ({ t: b.t, c: b.c })),
      isMarketOpen: aggsResults.length > 0,
    };

    return NextResponse.json(
      { detail },
      { headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  } catch (err) {
    console.error("[stock-detail]", err);
    return NextResponse.json({ error: "Failed to fetch detail" }, { status: 502 });
  }
}
