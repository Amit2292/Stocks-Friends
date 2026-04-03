import { NextResponse } from "next/server";

export const runtime = "nodejs";

const INDICES = [
  { symbol: "^TA35",   label: "TA-35",      flag: "🇮🇱" },
  { symbol: "^TA125",  label: "TA-125",     flag: "🇮🇱" },
  { symbol: "^DJI",    label: "DOW",        flag: "🇺🇸" },
  { symbol: "^GSPC",   label: "S&P 500",   flag: "🇺🇸" },
  { symbol: "^IXIC",   label: "NASDAQ",     flag: "🇺🇸" },
  { symbol: "^RUT",    label: "RUSSELL",    flag: "🇺🇸" },
  { symbol: "^VIX",    label: "VIX",        flag: "🇺🇸" },
  { symbol: "^GDAXI",  label: "DAX",        flag: "🇩🇪" },
  { symbol: "^FTSE",   label: "FTSE 100",   flag: "🇬🇧" },
  { symbol: "^FCHI",   label: "CAC 40",     flag: "🇫🇷" },
  { symbol: "^BVSP",   label: "BOVESPA",    flag: "🇧🇷" },
  { symbol: "^GSPTSE", label: "S&P/TSX",    flag: "🇨🇦" },
];

export interface IndexQuote {
  symbol: string;
  label: string;
  flag: string;
  price: number;
  change: number;
  changePercent: number;
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

async function fetchOne(idx: typeof INDICES[0]): Promise<IndexQuote | null> {
  try {
    const encoded = encodeURIComponent(idx.symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;
    return { symbol: idx.symbol, label: idx.label, flag: idx.flag, price, change, changePercent };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const results = await Promise.all(INDICES.map(fetchOne));
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
