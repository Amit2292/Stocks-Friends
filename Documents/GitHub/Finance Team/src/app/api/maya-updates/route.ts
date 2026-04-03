import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import type { MayaAnnouncement } from "@/lib/types";

// TASE Maya (maya.tase.co.il) is a React SPA — the HTML shell is empty.
// Strategy:
//   1. PRIMARY: Hit Maya's internal JSON API that the SPA calls internally.
//   2. FALLBACK: Parse the public RSS feed using cheerio in xmlMode.
//
// Both endpoints return the same announcements data.
// Cached for 5 minutes to avoid rate-limiting.

const MAYA_JSON_API =
  "https://maya.tase.co.il/api/event/rssEvents?feedId=5&lang=he&ps=20";
const MAYA_RSS_FALLBACK =
  "https://maya.tase.co.il/rss/events?language=he&feedId=5";
const MAYA_BASE_URL = "https://maya.tase.co.il";

const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/json, text/html, application/rss+xml, */*",
  "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8",
  Referer: "https://maya.tase.co.il/",
};

async function fetchFromJsonApi(): Promise<MayaAnnouncement[]> {
  const res = await fetch(MAYA_JSON_API, {
    headers: REQUEST_HEADERS,
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Maya JSON API: ${res.status}`);

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) throw new Error("Not a JSON response");

  const data = await res.json();
  const events: Array<Record<string, unknown>> =
    data?.data?.events ?? data?.events ?? (Array.isArray(data) ? data : []);

  return events.map((ev) => ({
    id: String(ev.id ?? ev.eventId ?? Math.random()),
    title: String(ev.header ?? ev.title ?? ev.subject ?? ""),
    company: String(ev.companyName ?? ev.company ?? ""),
    date: String(ev.eventDateStr ?? ev.date ?? ev.publishDate ?? ""),
    url: ev.url
      ? String(ev.url).startsWith("http")
        ? String(ev.url)
        : `${MAYA_BASE_URL}${ev.url}`
      : MAYA_BASE_URL,
  }));
}

async function fetchFromRss(): Promise<MayaAnnouncement[]> {
  const res = await fetch(MAYA_RSS_FALLBACK, {
    headers: {
      ...REQUEST_HEADERS,
      Accept: "application/rss+xml, text/xml, */*",
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Maya RSS: ${res.status}`);

  const xml = await res.text();
  // xmlMode: true correctly handles self-closing XML tags
  const $ = cheerio.load(xml, { xmlMode: true });

  const announcements: MayaAnnouncement[] = [];
  $("item").each((i, el) => {
    const $el = $(el);
    const title = $el.find("title").first().text().trim();
    const link =
      $el.find("link").first().text().trim() ||
      $el.find("guid").first().text().trim();
    const pubDate = $el.find("pubDate").first().text().trim();
    const desc = $el.find("description").first().text().trim();
    const company =
      $el.find("author").first().text().trim() ||
      desc.split("|")[0]?.trim() ||
      "";

    announcements.push({
      id: link || String(i),
      title: title || desc,
      company,
      date: pubDate,
      url: link || MAYA_BASE_URL,
    });
  });

  return announcements;
}

// GET /api/maya-updates — public, no auth required
export async function GET() {
  try {
    let announcements: MayaAnnouncement[];

    try {
      announcements = await fetchFromJsonApi();
    } catch (jsonErr) {
      console.warn("[maya-updates] JSON API failed, trying RSS:", jsonErr);
      announcements = await fetchFromRss();
    }

    return NextResponse.json(
      { announcements, fetchedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/maya-updates]", error);
    return NextResponse.json(
      { error: "Failed to fetch Maya announcements", announcements: [] },
      { status: 502 }
    );
  }
}

// This route has no pg dependency — safe to run on Edge (faster cold starts)
export const runtime = "edge";
