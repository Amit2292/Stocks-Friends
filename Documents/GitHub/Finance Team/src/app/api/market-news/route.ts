import { NextResponse } from "next/server";

export const runtime = "nodejs";

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  date: string;
  source: string;
  image?: string;
  summary?: string;
  lang: "en" | "he";
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/rss+xml, application/xml, text/xml, */*",
};

// Parse minimal RSS/Atom XML without a dependency
function parseRSS(xml: string, source: string, lang: "en" | "he"): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = stripTags(extractTag(block, "title") || "").trim();
    const url   = (extractTag(block, "link") || extractTag(block, "guid") || "").trim();
    const date  = (extractTag(block, "pubDate") || extractTag(block, "dc:date") || "").trim();
    const img   = extractAttr(block, "media:content", "url") || extractAttr(block, "media:thumbnail", "url") || extractTag(block, "enclosure url") || undefined;
    const summary = stripTags(extractTag(block, "description") || "").slice(0, 200).trim() || undefined;
    if (title && url) {
      items.push({ id: url, title, url, date, source, image: img, summary, lang });
    }
  }
  return items;
}

function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? (m[1] ?? m[2] ?? null) : null;
}

function extractAttr(xml: string, tag: string, attr: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`, "i");
  const m = xml.match(re);
  return m ? m[1] : undefined;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

interface FinnhubNewsItem {
  id: number;
  headline: string;
  url: string;
  datetime: number;
  source: string;
  image?: string;
  summary?: string;
}

async function fetchFinnhub(apiKey: string): Promise<NewsItem[]> {
  try {
    const url = `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data: FinnhubNewsItem[] = await res.json();
    if (!Array.isArray(data)) return [];
    return data.slice(0, 20).map((item) => ({
      id: String(item.id ?? item.url),
      title: item.headline,
      url: item.url,
      date: new Date(item.datetime * 1000).toISOString(),
      source: item.source,
      image: item.image || undefined,
      summary: item.summary?.slice(0, 200) || undefined,
      lang: "en" as const,
    }));
  } catch { return []; }
}

async function fetchRSS(url: string, source: string, lang: "en" | "he"): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 300 } });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, source, lang).slice(0, 15);
  } catch { return []; }
}

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;

  const sources: Promise<NewsItem[]>[] = [
    // English sources
    ...(apiKey ? [fetchFinnhub(apiKey)] : []),
    fetchRSS("https://feeds.finance.yahoo.com/rss/2.0/headline?region=US&lang=en-US", "Yahoo Finance", "en"),
    fetchRSS("https://feeds.reuters.com/reuters/businessNews", "Reuters", "en"),
    fetchRSS("https://www.cnbc.com/id/100003114/device/rss/rss.html", "CNBC", "en"),
    fetchRSS("https://www.marketwatch.com/rss/topstories", "MarketWatch", "en"),
    fetchRSS("https://news.google.com/rss/search?q=stock+market&hl=en-US&gl=US&ceid=US:en", "Google Finance", "en"),
    // Hebrew sources
    fetchRSS("https://www.themarker.com/cmlink/1.3399832", "TheMarker", "he"),
    fetchRSS("https://www.calcalist.co.il/Rss/AjaxPage", "Calcalist", "he"),
    fetchRSS("https://www.globes.co.il/Rss/RssFeedAllAricles.aspx", "Globes", "he"),
  ];

  const results = await Promise.allSettled(sources);
  const allItems: NewsItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") allItems.push(...r.value);
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = allItems.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  // Sort by date descending
  unique.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  return NextResponse.json(
    { news: unique, count: unique.length },
    { headers: { "Cache-Control": "public, s-maxage=300" } }
  );
}
