import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ETFs that track major world indices — Finnhub free tier supports all of these
const ETF_MAP = [
  { ticker: "SPY",  label: "S&P 500", flag: "🇺🇸" },
  { ticker: "QQQ",  label: "NASDAQ",  flag: "🇺🇸" },
  { ticker: "DIA",  label: "DOW",     flag: "🇺🇸" },
  { ticker: "IWM",  label: "RUSSELL", flag: "🇺🇸" },
  { ticker: "EWG",  label: "DAX",     flag: "🇩🇪" },
  { ticker: "EWU",  label: "FTSE",    flag: "🇬🇧" },
  { ticker: "GLD",  label: "GOLD",    flag: "🟡"  },
  { ticker: "TLT",  label: "BONDS",   flag: "📈"  },
];

export interface IndexQuote {
  symbol: string;
  label: string;
  flag: string;
  price: number;
  change: number;
  changePercent: number;
}

const FINNHUB_BASE = "https://finnhub.io/api/v1";

async function fetchETF(item: typeof ETF_MAP[0], apiKey: string): Promise<IndexQuote | null> {
  try {
    const res = await fetch(
      `${FINNHUB_BASE}/quote?symbol=${item.ticker}&token=${apiKey}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.c || data.c === 0) return null;
    return {
      symbol: item.ticker,
      label: item.label,
      flag: item.flag,
      price: data.c,
      change: data.d ?? 0,
      changePercent: data.dp ?? 0,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return NextResponse.json({ indices: [] });

  try {
    const results = await Promise.all(ETF_MAP.map((item) => fetchETF(item, apiKey)));
    const indices = results.filter((r): r is IndexQuote => r !== null);
    return NextResponse.json(
      { indices },
      { headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  } catch (error) {
    console.error("[GET /api/indices]", error);
    return NextResponse.json({ indices: [] }, { status: 502 });
  }
}
