"use client";

import { useState } from "react";
import { TradeWithUser } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface FeedCardProps {
  trade: TradeWithUser;
  isOwnTrade: boolean;
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function StockLogo({ ticker }: { ticker: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-blue-400 border border-zinc-700">
        {ticker.slice(0, 4)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://assets.parqet.com/logos/symbol/${ticker}?format=jpg`}
      alt={ticker}
      className="w-8 h-8 rounded object-contain bg-white border border-zinc-700"
      onError={() => setFailed(true)}
    />
  );
}

const TAG_COLORS: Record<string, string> = {
  "AI":                "bg-violet-900/30 text-violet-400 border-violet-800/30",
  "Chips":             "bg-blue-900/30 text-blue-400 border-blue-800/30",
  "Green Energy":      "bg-lime-900/30 text-lime-400 border-lime-800/30",
  "Nuclear":           "bg-orange-900/30 text-orange-400 border-orange-800/30",
  "Quantum Computing": "bg-cyan-900/30 text-cyan-400 border-cyan-800/30",
};

export default function FeedCard({ trade, isOwnTrade }: FeedCardProps) {
  const isBuy = trade.type === "BUY";
  const totalValue = trade.price * trade.quantity;
  const tags: string[] = Array.isArray(trade.tags) ? trade.tags : [];

  return (
    <div className={cn(
      "group bg-[#201f22] hover:bg-[#2a2a2c] transition-all duration-300 rounded-xl p-5 border border-transparent hover:border-zinc-700/30",
      isOwnTrade && "border-blue-800/20"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700/50 flex items-center justify-center font-bold text-sm text-zinc-300 shrink-0">
            {trade.user_image
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={trade.user_image} alt="" className="w-full h-full object-cover" />
              : trade.user_name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{isOwnTrade ? "You" : (trade.user_name ?? "Anonymous")}</h4>
            <p className="text-[10px] text-zinc-500">{formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-black text-white">${trade.ticker}</span>
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-black tracking-widest",
              isBuy ? "bg-[#00a572]/20 text-[#4edea3]" : "bg-[#d22348]/20 text-[#ffb2b7]")}>
              {trade.type}
            </span>
          </div>
          <div className={cn("text-sm font-mono font-bold", isBuy ? "text-[#6ffbbe]" : "text-[#ffb2b7]")}>
            {formatCurrency(trade.price)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <StockLogo ticker={trade.ticker} />
        <span className="text-sm text-zinc-400">
          {trade.quantity.toLocaleString()} shares · <span className="text-white font-semibold">{formatCurrency(totalValue)}</span>
        </span>
      </div>

      {trade.notes && (
        <p className="text-sm text-zinc-300 leading-relaxed mb-4 italic">&ldquo;{trade.notes}&rdquo;</p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <span key={tag} className={cn("px-2 py-1 rounded text-[10px] font-bold border",
              TAG_COLORS[tag] ?? "bg-zinc-800 text-zinc-400 border-zinc-700")}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-6 text-zinc-600 pt-3 border-t border-zinc-800/50">
        <button className="hover:text-white transition-colors"><span className="material-symbols-outlined text-[18px]">mode_comment</span></button>
        <button className="hover:text-[#4edea3] transition-colors"><span className="material-symbols-outlined text-[18px]">repeat</span></button>
        <button className="hover:text-[#ffb2b7] transition-colors"><span className="material-symbols-outlined text-[18px]">favorite</span></button>
        <button className="hover:text-blue-400 transition-colors ml-auto"><span className="material-symbols-outlined text-[18px]">share</span></button>
      </div>
    </div>
  );
}
