import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "edge";

interface NewsItem {
  title: string;
  url: string;
  date: string;
  source: string;
  image?: string;
  summary?: string;
}

function dateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.toUpperCase().trim();
  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;

  // ── Primary: Finnhub company news ──────────────────────────────────────────
  if (apiKey) {
    try {
      const { from, to } = dateRange();
      const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: 300 } });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const items: NewsItem[] = data.slice(0, 12).map(
            (item: {
              headline: string;
              url: string;
              datetime: number;
              source: string;
              image?: string;
              summary?: string;
            }) => ({
              title: item.headline,
              url: item.url,
              date: new Date(item.datetime * 1000).toISOString(),
              source: item.source,
              image: item.image || undefined,
              summary: item.summary || undefined,
            })
          );
          return NextResponse.json(
            { news: items, ticker, provider: "Finnhub" },
            { headers: { "Cache-Control": "public, s-maxage=300" } }
          );
        }
      }
    } catch {
      // fall through to Yahoo
    }
  }

  // ── Fallback: Yahoo Finance RSS ─────────────────────────────────────────────
  try {
    const yahooUrl = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${ticker}&region=US&lang=en-US`;
    const res = await fetch(yahooUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; StockSocial/1.0)" },
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const xml = await res.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      const items: NewsItem[] = [];
      $("item").each((_, el) => {
        const link =
          $(el).find("link").text().trim() ||
          $(el).find("guid").text().trim();
        items.push({
          title: $(el).find("title").text().trim(),
          url: link,
          date: $(el).find("pubDate").text().trim(),
          source: "Yahoo Finance",
        });
      });
      if (items.length > 0) {
        return NextResponse.json(
          { news: items.slice(0, 12), ticker, provider: "Yahoo" },
          { headers: { "Cache-Control": "public, s-maxage=300" } }
        );
      }
    }
  } catch {
    // fall through to Google
  }

  // ── Last resort: Google News RSS ────────────────────────────────────────────
  try {
    const q = encodeURIComponent(`${ticker} stock`);
    const googleUrl = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(googleUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; StockSocial/1.0)" },
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const xml = await res.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      const items: NewsItem[] = [];
      $("item").each((_, el) => {
        items.push({
          title: $(el).find("title").text().trim(),
          url:
            $(el).find("link").text().trim() ||
            $(el).find("guid").text().trim(),
          date: $(el).find("pubDate").text().trim(),
          source: $(el).find("source").text().trim() || "Google News",
        });
      });
      return NextResponse.json(
        { news: items.slice(0, 12), ticker, provider: "Google" },
        { headers: { "Cache-Control": "public, s-maxage=300" } }
      );
    }
  } catch {
    //
  }

  return NextResponse.json({ news: [], ticker });
}
