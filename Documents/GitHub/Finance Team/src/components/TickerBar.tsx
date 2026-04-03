"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { IndexQuote } from "@/app/api/indices/route";

// Major Israeli stocks (listed on US exchanges — Polygon can price these)
const IL_STOCKS = ["TEVA","CHKP","NICE","WIX","MNDY","GLBE","ESLT","TSEM","AMDOCS","ICL"];

interface StockQuote {
  ticker: string;
  price: number;
  changePercent: number;
  change: number;
}

type BarItem =
  | { kind: "index"; data: IndexQuote }
  | { kind: "stock"; data: StockQuote };

export default function TickerBar() {
  const [items, setItems] = useState<BarItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [idxRes, stkRes] = await Promise.all([
          fetch("/api/indices"),
          fetch(`/api/prices?tickers=${IL_STOCKS.join(",")}`),
        ]);
        const idxData = idxRes.ok ? await idxRes.json() : { indices: [] };
        const stkData = stkRes.ok ? await stkRes.json() : { prices: {} };

        const idxItems: BarItem[] = (idxData.indices ?? []).map((d: IndexQuote) => ({ kind: "index", data: d }));
        const stkItems: BarItem[] = IL_STOCKS
          .filter((t) => stkData.prices?.[t])
          .map((t) => ({ kind: "stock", data: { ticker: t, ...stkData.prices[t] } }));

        setItems([...idxItems, ...stkItems]);
      } catch { /* non-critical */ }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  if (items.length === 0) return (
    <div className="w-full bg-black border-b border-zinc-800 h-8 sticky top-0 z-[100]" />
  );

  const display = [...items, ...items];

  return (
    <div className="w-full bg-black border-b border-zinc-800 h-8 flex items-center overflow-hidden shrink-0 sticky top-0 z-[100]">
      <div className="ticker-track flex items-center gap-10 whitespace-nowrap px-4">
        {display.map((item, i) => {
          if (item.kind === "index") {
            const idx = item.data;
            const pos = idx.change >= 0;
            const price = idx.price >= 1000
              ? idx.price.toLocaleString("en-US", { maximumFractionDigits: 0 })
              : idx.price.toFixed(2);
            return (
              <span key={`idx-${idx.symbol}-${i}`} className="inline-flex items-center gap-1.5"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                <span className="text-sm leading-none">{idx.flag}</span>
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{idx.label}</span>
                <span className="text-[10px] font-bold text-white">{price}</span>
                <span className={cn("text-[10px] font-bold", pos ? "text-[#4edea3]" : "text-[#ffb2b7]")}>
                  {pos ? "▲" : "▼"}{Math.abs(idx.changePercent).toFixed(2)}%
                </span>
                <span className="text-zinc-700 text-[10px]">·</span>
              </span>
            );
          } else {
            const s = item.data;
            const pos = s.change >= 0;
            return (
              <span key={`stk-${s.ticker}-${i}`} className="inline-flex items-center gap-1.5"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                <span className="text-[10px] font-bold text-blue-400">🇮🇱</span>
                <span className="text-[10px] font-bold text-white">{s.ticker}</span>
                <span className="text-[10px] font-semibold text-zinc-300">${s.price.toFixed(2)}</span>
                <span className={cn("text-[10px] font-bold", pos ? "text-[#4edea3]" : "text-[#ffb2b7]")}>
                  {pos ? "▲" : "▼"}{Math.abs(s.changePercent).toFixed(2)}%
                </span>
                <span className="text-zinc-700 text-[10px]">·</span>
              </span>
            );
          }
        })}
      </div>
    </div>
  );
}
