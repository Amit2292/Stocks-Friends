"use client";

import { PortfolioPosition } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PortfolioTableProps { positions: PortfolioPosition[]; }

function fmt(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function PnlCell({ value }: { value: number }) {
  const pos = value >= 0;
  return (
    <div className={cn("text-right", pos ? "text-[#4edea3]" : "text-[#ffb2b7]")}>
      <div className="text-sm font-bold">{pos ? "+" : ""}{fmt(value)}</div>
      <div className={cn("text-[10px]", pos ? "text-[#4edea3]/60" : "text-[#ffb2b7]/60")}>
        {pos ? "▲" : "▼"}
      </div>
    </div>
  );
}

export default function PortfolioTable({ positions }: PortfolioTableProps) {
  if (positions.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500">
        <span className="material-symbols-outlined text-4xl mb-3 block opacity-30">pie_chart</span>
        <p>No positions yet. Log your first trade to get started.</p>
      </div>
    );
  }

  const totalInvested    = positions.reduce((s, p) => s + p.total_invested, 0);
  const totalRealized    = positions.reduce((s, p) => s + p.realized_pnl, 0);
  const totalUnrealized  = positions.reduce((s, p) => s + (p.unrealized_pnl ?? 0), 0);
  const hasLive          = positions.some((p) => p.current_price !== undefined);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#201f22] rounded-xl p-5 border-l-4 border-blue-600">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Total Invested</p>
          <p className="text-3xl font-black text-white">{fmt(totalInvested)}</p>
        </div>
        <div className="bg-[#201f22] rounded-xl p-5">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Realized P&L</p>
          <p className={cn("text-3xl font-black", totalRealized >= 0 ? "text-[#4edea3]" : "text-[#ffb2b7]")}>
            {totalRealized >= 0 ? "+" : ""}{fmt(totalRealized)}
          </p>
        </div>
        {hasLive && (
          <div className="bg-[#201f22] rounded-xl p-5">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Unrealized P&L</p>
            <p className={cn("text-3xl font-black", totalUnrealized >= 0 ? "text-[#4edea3]" : "text-[#ffb2b7]")}>
              {totalUnrealized >= 0 ? "+" : ""}{fmt(totalUnrealized)}
            </p>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1c1b1d]/50">
              {["Ticker","Shares","Avg Cost","Current","Invested","Unrealized P&L","Realized P&L","Trades"].map((h) => (
                <th key={h} className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right first:text-left whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {positions.map((pos) => (
              <tr key={pos.ticker} className="hover:bg-zinc-800/20 transition-colors group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-blue-400">
                      {pos.ticker.slice(0, 4)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white font-mono">{pos.ticker}</div>
                      <div className={cn("text-[10px]", pos.net_quantity > 0 ? "text-[#4edea3]" : "text-[#ffb2b7]")}>
                        {pos.net_quantity > 0 ? "LONG" : "SHORT"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-right font-mono text-white">
                  {Number(pos.net_quantity).toFixed(2)}
                </td>
                <td className="px-5 py-4 text-sm text-right font-mono text-zinc-400">
                  {fmt(Number(pos.avg_cost))}
                </td>
                <td className="px-5 py-4 text-sm text-right font-mono text-white">
                  {pos.current_price !== undefined ? fmt(pos.current_price) : <span className="text-zinc-600">—</span>}
                </td>
                <td className="px-5 py-4 text-sm text-right font-mono text-white">
                  {fmt(Number(pos.total_invested))}
                </td>
                <td className="px-5 py-4">
                  {pos.unrealized_pnl !== undefined
                    ? <PnlCell value={pos.unrealized_pnl} />
                    : <span className="text-zinc-600 text-right block">—</span>}
                </td>
                <td className="px-5 py-4"><PnlCell value={Number(pos.realized_pnl)} /></td>
                <td className="px-5 py-4 text-sm text-right text-zinc-500">{pos.trade_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
