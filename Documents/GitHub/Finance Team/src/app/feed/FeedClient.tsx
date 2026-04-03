"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { TradeWithUser } from "@/lib/types";
import FeedCard from "@/components/FeedCard";
import TradeModal from "@/components/TradeModal";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface FeedClientProps { currentUserId: string; }

export default function FeedClient({ currentUserId }: FeedClientProps) {
  const [trades, setTrades]         = useState<TradeWithUser[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickTicker, setQuickTicker] = useState("");
  const [quickPrice, setQuickPrice]   = useState("");
  const [quickType, setQuickType]     = useState<"BUY" | "SELL">("BUY");
  const { toast } = useToast();
  const tickerRef = useRef<HTMLInputElement>(null);

  const fetchTrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/trades");
      if (!res.ok) throw new Error("Failed to load trades");
      const data = await res.json();
      setTrades(data.trades ?? []);
    } catch {
      toast({ title: "Error", description: "Could not load feed.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const handleQuickTrade = () => {
    if (!quickTicker.trim() || !quickPrice.trim()) return;
    setIsModalOpen(true);
  };


  return (
    <div className="flex gap-8 items-start">
      {/* Main feed */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Quick trade input */}
        <div className="bg-[#201f22] border border-zinc-800/50 p-1 rounded-xl shadow-2xl sticky top-0 z-20">
          <div className="flex flex-col md:flex-row gap-2 p-3 bg-[#1c1b1d] rounded-lg">
            <div className="flex flex-1 gap-2">
              <input
                ref={tickerRef}
                className="w-28 bg-[#0e0e10] border border-zinc-700/40 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 uppercase font-mono"
                placeholder="$Ticker"
                value={quickTicker}
                onChange={(e) => setQuickTicker(e.target.value.toUpperCase())}
              />
              <input
                className="flex-1 bg-[#0e0e10] border border-zinc-700/40 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
                placeholder="Price"
                type="number"
                value={quickPrice}
                onChange={(e) => setQuickPrice(e.target.value)}
              />
            </div>
            <div className="flex items-center bg-[#0e0e10] p-1 rounded-md border border-zinc-700/40">
              <button
                onClick={() => setQuickType("BUY")}
                className={cn("px-4 py-1.5 text-[10px] font-black rounded transition-all",
                  quickType === "BUY" ? "bg-[#00a572] text-white" : "text-zinc-500 hover:text-[#4edea3]")}>
                BUY
              </button>
              <button
                onClick={() => setQuickType("SELL")}
                className={cn("px-4 py-1.5 text-[10px] font-black rounded transition-all",
                  quickType === "SELL" ? "bg-[#d22348] text-white" : "text-zinc-500 hover:text-[#ffb2b7]")}>
                SELL
              </button>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all px-6 py-2 rounded-md text-white text-xs font-bold tracking-tight">
              Log Trade
            </button>
          </div>
          <div className="h-8 bg-gradient-to-b from-[#0e0e10] to-transparent pointer-events-none -mt-4" />
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map((i) => <div key={i} className="h-40 rounded-xl bg-zinc-800/40 animate-pulse" />)}
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-20 space-y-3 text-zinc-500">
            <span className="material-symbols-outlined text-4xl opacity-30 block">query_stats</span>
            <p>No trades yet. Be the first to log one!</p>
          </div>
        ) : (
          <div className="space-y-4 pb-20">
            {trades.map((trade) => (
              <FeedCard key={trade.id} trade={trade} isOwnTrade={trade.user_id === currentUserId} />
            ))}
          </div>
        )}
      </div>

      <TradeModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          setIsModalOpen(false);
          setQuickTicker("");
          setQuickPrice("");
          fetchTrades();
          toast({ title: "Trade logged!", description: "Added to the feed." });
        }}
      />
    </div>
  );
}
