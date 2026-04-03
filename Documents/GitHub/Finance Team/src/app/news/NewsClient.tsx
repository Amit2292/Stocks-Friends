"use client";

import { useEffect, useState, useCallback } from "react";
import type { NewsItem } from "@/app/api/market-news/route";

type Filter = "all" | "en" | "he";

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const SOURCE_COLORS: Record<string, string> = {
  "Reuters":      "text-[#ff6b00]",
  "CNBC":         "text-[#0066cc]",
  "MarketWatch":  "text-[#00b050]",
  "Yahoo Finance":"text-[#6001d2]",
  "Finnhub":      "text-[#1db954]",
  "Google Finance":"text-zinc-400",
  "TheMarker":    "text-[#e8c547]",
  "Calcalist":    "text-[#e8473f]",
  "Globes":       "text-[#2e86ab]",
};

function NewsCard({ item }: { item: NewsItem }) {
  const color = SOURCE_COLORS[item.source] ?? "text-zinc-400";
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 p-4 bg-[#201f22] hover:bg-[#2a2a2c] border border-zinc-800/50 rounded-xl transition-all duration-200"
    >
      {item.image && (
        <div className="shrink-0 w-20 h-16 rounded-lg overflow-hidden bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt=""
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>
            {item.source}
          </span>
          {item.lang === "he" && (
            <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">עברית</span>
          )}
          {item.date && (
            <span className="text-[10px] text-zinc-600 ml-auto shrink-0">{timeAgo(item.date)}</span>
          )}
        </div>
        <p
          className="text-sm text-zinc-100 font-semibold leading-snug group-hover:text-white transition-colors line-clamp-2"
          dir={item.lang === "he" ? "rtl" : "ltr"}
        >
          {item.title}
        </p>
        {item.summary && (
          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mt-0.5"
            dir={item.lang === "he" ? "rtl" : "ltr"}>
            {item.summary}
          </p>
        )}
      </div>
    </a>
  );
}

function SkeletonCard() {
  return (
    <div className="flex gap-4 p-4 bg-[#201f22] border border-zinc-800/50 rounded-xl animate-pulse">
      <div className="shrink-0 w-20 h-16 rounded-lg bg-zinc-800" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-zinc-800 rounded w-24" />
        <div className="h-4 bg-zinc-800 rounded w-full" />
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-800 rounded w-full" />
      </div>
    </div>
  );
}

export default function NewsClient() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/market-news");
      if (!res.ok) return;
      const data = await res.json();
      setNews(data.news ?? []);
      setLastUpdated(new Date());
    } catch { /* non-critical */ } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(id);
  }, [load]);

  const filtered = news.filter((item) => {
    if (filter === "en" && item.lang !== "en") return false;
    if (filter === "he" && item.lang !== "he") return false;
    if (search) {
      const q = search.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.source.toLowerCase().includes(q);
    }
    return true;
  });

  const sources = Array.from(new Set(news.map((n) => n.source)));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Market News</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {lastUpdated ? `Updated ${timeAgo(lastUpdated.toISOString())}` : "Loading…"}
            {" · "}{filtered.length} articles
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-lg transition-all"
        >
          <span className="material-symbols-outlined text-[14px]">refresh</span>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search news..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[#0e0e10] border border-zinc-700/40 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
        />
        <div className="flex items-center bg-[#0e0e10] p-1 rounded-lg border border-zinc-700/40">
          {(["all", "en", "he"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs font-bold rounded transition-all ${
                filter === f ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {f === "all" ? "All" : f === "en" ? "English" : "עברית"}
            </button>
          ))}
        </div>
      </div>

      {/* Source chips */}
      {!isLoading && sources.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sources.map((src) => (
            <span key={src} className="text-[10px] font-semibold px-2.5 py-1 bg-zinc-800/60 text-zinc-400 rounded-full border border-zinc-700/40">
              {src}
            </span>
          ))}
        </div>
      )}

      {/* News list */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.length === 0
          ? (
            <div className="text-center py-20 text-zinc-500 space-y-2">
              <span className="material-symbols-outlined text-4xl opacity-30 block">article</span>
              <p>No news found.</p>
            </div>
          )
          : filtered.map((item) => <NewsCard key={item.id} item={item} />)
        }
      </div>
    </div>
  );
}
