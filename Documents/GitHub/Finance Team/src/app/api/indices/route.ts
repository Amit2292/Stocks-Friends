import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Major ETFs that proxy world indices — all priced by Massive API free tier
const ETF_MAP = [
  { ticker: "SPY",  label: "S&P 500",  flag: "🇺🇸" },
  { ticker: "QQQ",  label: "NASDAQ",   flag: "🇺🇸" },
  { ticker: "DIA",  label: "DOW",      flag: "🇺🇸" },
  { ticker: "IWM",  label: "RUSSELL",  flag: "🇺🇸" },
  { ticker: "EWG",  label: "DAX",      flag: "🇩🇪" },
  { ticker: "EWU",  label: "FTSE",     flag: "🇬🇧" },
  { ticker: "GLD",  label: "GOLD",     flag: "🟡"  },
  { ticker: "TLT",  label: "BONDS",    flag: "📈"  },
];

export interface IndexQuote {
  symbol: string;
  label: string;
  flag: string;
  price: number;
  change: number;
  changePercent: number;
}

const MASSIVE_BASE = "https://api.massive.com";

async function fetchETF(
  item: typeof ETF_MAP[0],
  apiKey: string
): Promise<IndexQuote | null> {
  try {
    const res = await fetch(
      `${MASSIVE_BASE}/v2/aggs/ticker/${item.ticker}/prev?adjusted=true&apiKey=${apiKey}`,
      { next: { revalidate: 120 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const bar = data?.results?.[0];
    if (!bar) return null;
    const price = bar.c;
    const change = price - bar.o;
    const changePercent = bar.o ? (change / bar.o) * 100 : 0;
    return {
      symbol: item.ticker,
      label: item.label,
      flag: item.flag,
      price,
      change,
      changePercent,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const apiKey = process.env.MASSIVE_API_KEY ?? process.env.POLYGON_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ indices: [] });
  }

  try {
    const results = await Promise.all(ETF_MAP.map((item) => fetchETF(item, apiKey)));
    const indices = results.filter((r): r is IndexQuote => r !== null);
    return NextResponse.json(
      { indices },
      { headers: { "Cache-Control": "public, s-maxage=120" } }
    );
  } catch (error) {
    console.error("[GET /api/indices]", error);
    return NextResponse.json({ indices: [] }, { status: 502 });
  }
}
