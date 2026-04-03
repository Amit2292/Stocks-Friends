import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MASSIVE_BASE = "https://api.massive.com";
const FINNHUB_BASE = "https://finnhub.io/api/v1";

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

  const massiveKey = process.env.MASSIVE_API_KEY ?? process.env.POLYGON_API_KEY;
  const finnhubKey = process.env.FINNHUB_API_KEY;

  if (!massiveKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  try {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    // Fetch company info + chart from Massive, live quote from Finnhub
    const requests: Promise<Response>[] = [
      fetch(`${MASSIVE_BASE}/v3/reference/tickers/${ticker}?apiKey=${massiveKey}`, { next: { revalidate: 3600 } }),
      fetch(`${MASSIVE_BASE}/v2/aggs/ticker/${ticker}/range/1/day/${fmt(from)}/${fmt(to)}?adjusted=true&sort=asc&limit=10&apiKey=${massiveKey}`, { next: { revalidate: 300 } }),
      fetch(`${MASSIVE_BASE}/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${massiveKey}`, { next: { revalidate: 300 } }),
    ];
    if (finnhubKey) {
      requests.push(fetch(`${FINNHUB_BASE}/quote?symbol=${ticker}&token=${finnhubKey}`, { next: { revalidate: 30 } }));
    }

    const [refRes, aggsRes, prevRes, quoteRes] = await Promise.all(requests);

    const refJson  = refRes?.ok  ? await refRes.json()  : {};
    const aggsJson = aggsRes?.ok ? await aggsRes.json() : {};
    const prevJson = prevRes?.ok ? await prevRes.json() : {};
    const quoteJson = quoteRes?.ok ? await quoteRes.json() : null;

    const ref: MassiveRef | null = refJson?.results ?? null;
    const bar: MassiveAgg | null = prevJson?.results?.[0] ?? null;
    const aggsResults: MassiveAgg[] = aggsJson?.results ?? [];

    // If Finnhub returns a live quote, use it; otherwise fall back to Massive prev-day
    let price: number, open: number, high: number, low: number, prevClose: number, change: number, changePercent: number, volume: number;

    if (quoteJson && quoteJson.c && quoteJson.c !== 0) {
      price        = quoteJson.c;
      open         = quoteJson.o ?? bar?.o ?? price;
      high         = quoteJson.h ?? bar?.h ?? price;
      low          = quoteJson.l ?? bar?.l ?? price;
      prevClose    = quoteJson.pc ?? bar?.c ?? price;
      change       = quoteJson.d ?? (price - prevClose);
      changePercent = quoteJson.dp ?? (prevClose ? (change / prevClose) * 100 : 0);
      volume       = bar?.v ?? 0;
    } else if (bar) {
      price        = bar.c;
      open         = bar.o;
      high         = bar.h;
      low          = bar.l;
      prevClose    = bar.c;
      change       = bar.c - bar.o;
      changePercent = bar.o ? ((bar.c - bar.o) / bar.o) * 100 : 0;
      volume       = bar.v;
    } else {
      return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
    }

    const logoUrl = ref?.branding?.logo_url
      ? `${ref.branding.logo_url}?apiKey=${massiveKey}`
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
      open,
      high,
      low,
      prevClose,
      change,
      changePercent,
      volume,
      marketCap: ref?.market_cap,
      chartPoints: aggsResults.map((b) => ({ t: b.t, c: b.c })),
      isMarketOpen: quoteJson ? (quoteJson.c !== quoteJson.pc) : aggsResults.length > 0,
    };

    return NextResponse.json(
      { detail },
      { headers: { "Cache-Control": "public, s-maxage=30" } }
    );
  } catch (err) {
    console.error("[stock-detail]", err);
    return NextResponse.json({ error: "Failed to fetch detail" }, { status: 502 });
  }
}
