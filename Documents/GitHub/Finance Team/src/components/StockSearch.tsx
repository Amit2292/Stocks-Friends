"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SearchResult } from "@/app/api/stock-search/route";
import type { StockDetail } from "@/app/api/stock-detail/route";
import StockCard from "@/components/StockCard";
import TradeModal from "@/components/TradeModal";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const POPULAR = ["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "TEVA", "CHKP", "WIX"];

export default function StockSearch() {
  const [query, setQuery]               = useState("");
  const [results, setResults]           = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching]   = useState(false);
  const [selected, setSelected]         = useState<StockDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError]   = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalType, setModalType]       = useState<"BUY" | "SELL">("BUY");
  const inputRef  = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Fetch search results
  useEffect(() => {
    if (debouncedQuery.length < 1) { setResults([]); return; }
    let cancelled = false;
    setIsSearching(true);
    fetch(`/api/stock-search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) { setResults(data.results ?? []); setShowDropdown(true); } })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setIsSearching(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadDetail = useCallback(async (ticker: string) => {
    setShowDropdown(false);
    setQuery(ticker);
    setIsLoadingDetail(true);
    setDetailError(null);
    setSelected(null);
    try {
      const res = await fetch(`/api/stock-detail?ticker=${ticker}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSelected(data.detail);
    } catch (e) {
      setDetailError((e as Error).message || "Failed to load");
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const handleTradeClick = (type: "BUY" | "SELL") => {
    setModalType(type);
    setModalOpen(true);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Search box */}
      <div className="relative">
        <div className="flex items-center gap-3 bg-white rounded-2xl shadow-lg px-4 py-3 border border-gray-100 focus-within:border-blue-400 focus-within:shadow-blue-100 transition-all">
          <span className="material-symbols-outlined text-gray-400 text-[22px] shrink-0">search</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search ticker or company name…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
            className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-base font-semibold focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {isSearching && (
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          {query && !isSearching && (
            <button
              onClick={() => { setQuery(""); setResults([]); setSelected(null); setDetailError(null); inputRef.current?.focus(); }}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && results.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            {results.map((r, i) => (
              <button
                key={r.ticker}
                onClick={() => loadDetail(r.ticker)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors ${i > 0 ? "border-t border-gray-50" : ""}`}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-black shrink-0">
                  {r.ticker.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-black text-sm">{r.ticker}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded-full">{r.type}</span>
                  </div>
                  <p className="text-gray-500 text-xs truncate">{r.name}</p>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{r.primaryExchange}</span>
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {showDropdown && !isSearching && query.length >= 1 && results.length === 0 && (
          <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-6 text-center z-50">
            <span className="material-symbols-outlined text-3xl text-gray-300 block mb-2">search_off</span>
            <p className="text-gray-400 text-sm">No results for &ldquo;{query}&rdquo;</p>
          </div>
        )}
      </div>

      {/* Popular picks */}
      {!selected && !isLoadingDetail && !detailError && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Popular</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map((t) => (
              <button
                key={t}
                onClick={() => loadDetail(t)}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl text-gray-700 text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoadingDetail && <StockCardSkeleton />}

      {/* Error */}
      {detailError && (
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-rose-300 block">error_outline</span>
          <p className="text-gray-500 text-sm">Could not load data for <strong>{query}</strong></p>
          <p className="text-gray-400 text-xs">{detailError}</p>
          <button
            onClick={() => loadDetail(query)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl hover:bg-blue-400 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Stock card */}
      {selected && !isLoadingDetail && (
        <StockCard
          detail={selected}
          onBuy={() => handleTradeClick("BUY")}
          onSell={() => handleTradeClick("SELL")}
          onClose={() => { setSelected(null); setQuery(""); }}
        />
      )}

      {/* Trade modal — pre-filled with selected stock */}
      <TradeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialTicker={selected?.ticker ?? ""}
        initialPrice={selected?.price}
        initialType={modalType}
        onSuccess={() => setModalOpen(false)}
      />
    </div>
  );
}

function StockCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-pulse">
      <div className="bg-gray-50 px-6 pt-6 pb-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gray-200" />
          <div className="space-y-1.5">
            <div className="h-4 w-16 bg-gray-200 rounded-full" />
            <div className="h-3 w-28 bg-gray-100 rounded-full" />
          </div>
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-xl" />
        <div className="h-4 w-24 bg-gray-100 rounded-full" />
      </div>
      <div className="px-6 py-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-2.5 w-12 bg-gray-100 rounded-full" />
            <div className="h-4 w-20 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
      <div className="px-6 py-4 flex gap-3">
        <div className="flex-1 h-12 bg-gray-100 rounded-2xl" />
        <div className="flex-1 h-12 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );
}
