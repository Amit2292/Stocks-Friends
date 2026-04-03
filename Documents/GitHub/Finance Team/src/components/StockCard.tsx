"use client";

import { useState } from "react";
import type { StockDetail } from "@/app/api/stock-detail/route";
import Sparkline from "@/components/Sparkline";
import { cn } from "@/lib/utils";

function fmt(n: number, digits = 2): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtVolume(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(v);
}

interface StockCardProps {
  detail: StockDetail;
  onBuy?: () => void;
  onSell?: () => void;
  onClose?: () => void;
}

export default function StockCard({ detail, onBuy, onSell, onClose }: StockCardProps) {
  const positive = detail.change >= 0;
  const chartData = detail.chartPoints.map((p) => p.c);

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top bar */}
      <div className={cn(
        "px-6 pt-6 pb-5",
        positive ? "bg-gradient-to-br from-emerald-50 to-white" : "bg-gradient-to-br from-rose-50 to-white"
      )}>
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {detail.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={detail.logoUrl}
                alt={detail.ticker}
                className="w-11 h-11 rounded-xl object-contain bg-white border border-gray-100 p-1 shadow-sm"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm",
                positive ? "bg-emerald-500" : "bg-rose-500"
              )}>
                {detail.ticker.slice(0, 2)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 font-black text-lg tracking-tight leading-none">{detail.ticker}</span>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  detail.isMarketOpen
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-500"
                )}>
                  {detail.isMarketOpen ? "OPEN" : "CLOSED"}
                </span>
              </div>
              <p className="text-gray-500 text-[11px] mt-0.5 leading-tight max-w-[160px] truncate">{detail.name}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Price */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-gray-900 font-black text-4xl tracking-tight leading-none">
              ${fmt(detail.price)}
            </div>
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm font-bold",
              positive ? "text-emerald-600" : "text-rose-500"
            )}>
              <span>{positive ? "▲" : "▼"}</span>
              <span>{positive ? "+" : ""}{fmt(detail.change)}</span>
              <span className="font-semibold text-[12px] opacity-80">
                ({positive ? "+" : ""}{fmt(detail.changePercent)}%)
              </span>
              <span className="font-normal text-[10px] text-gray-400 ml-1">today</span>
            </div>
          </div>
          {chartData.length >= 2 && (
            <div className="opacity-90">
              <Sparkline data={chartData} positive={positive} width={130} height={48} />
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-6 py-4 grid grid-cols-2 gap-3 border-b border-gray-100">
        {[
          { label: "Open",       value: `$${fmt(detail.open)}` },
          { label: "Prev Close", value: `$${fmt(detail.prevClose)}` },
          { label: "High",       value: `$${fmt(detail.high)}` },
          { label: "Low",        value: `$${fmt(detail.low)}` },
          { label: "Volume",     value: fmtVolume(detail.volume) },
          { label: "Exchange",   value: detail.primaryExchange || "—" },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
            <span className="text-gray-800 text-sm font-bold">{value}</span>
          </div>
        ))}
        {detail.marketCap && (
          <div className="flex flex-col gap-0.5 col-span-2">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Market Cap</span>
            <span className="text-gray-800 text-sm font-bold">${fmtVolume(detail.marketCap)}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {detail.description && (
        <div className="px-6 py-3 border-b border-gray-100">
          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">{detail.description}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-6 py-4 flex gap-3">
        <button
          onClick={() => onBuy?.()}
          className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.97] transition-all text-white text-sm font-black tracking-wide shadow-sm"
        >
          BUY
        </button>
        <button
          onClick={() => onSell?.()}
          className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 active:scale-[0.97] transition-all text-white text-sm font-black tracking-wide shadow-sm"
        >
          SELL
        </button>
      </div>
    </div>
  );
}
