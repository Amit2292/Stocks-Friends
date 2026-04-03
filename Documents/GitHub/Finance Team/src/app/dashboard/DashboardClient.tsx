"use client";

import { useEffect, useState, useRef } from "react";
import { PortfolioPosition } from "@/lib/types";
import PortfolioTable from "@/components/PortfolioTable";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, Newspaper } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NewsItem {
  title: string;
  url: string;
  date: string;
  source: string;
}

interface DashboardClientProps {
  userName: string;
}

export default function DashboardClient({ userName }: DashboardClientProps) {
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);

  const [tickerInput, setTickerInput] = useState("");
  const [searchedTicker, setSearchedTicker] = useState("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/portfolio")
      .then((r) => r.json())
      .then(async (d) => {
        const positions: PortfolioPosition[] = d.positions ?? [];
        if (positions.length === 0) {
          setPositions(positions);
          return;
        }

        // Fetch live prices for all tickers
        const tickers = positions.map((p) => p.ticker).join(",");
        try {
          const priceRes = await fetch(`/api/prices?tickers=${tickers}`);
          const priceData = await priceRes.json();
          const prices: Record<string, { price: number; change: number; changePercent: number }> = priceData.prices ?? {};

          const enriched = positions.map((p) => {
            const quote = prices[p.ticker];
            if (!quote || p.net_quantity <= 0) return p;
            const unrealizedPnl = (quote.price - p.avg_cost) * p.net_quantity;
            return { ...p, current_price: quote.price, unrealized_pnl: unrealizedPnl };
          });
          setPositions(enriched);
        } catch {
          // If prices fail, still show portfolio without live prices
          setPositions(positions);
        }
      })
      .finally(() => setLoadingPortfolio(false));
  }, []);

  const fetchNews = async (ticker: string) => {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setSearchedTicker(t);
    setLoadingNews(true);
    try {
      const res = await fetch(`/api/news?ticker=${t}`);
      const data = await res.json();
      setNews(data.news ?? []);
    } finally {
      setLoadingNews(false);
    }
  };

  const handleSearch = () => fetchNews(tickerInput);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Portfolio table — 2/3 width */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{userName}&apos;s Positions</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPortfolio ? (
              <div className="h-48 animate-pulse bg-muted rounded" />
            ) : (
              <PortfolioTable positions={positions} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock news search sidebar */}
      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              Stock News
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search input */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="e.g. NVDA, TEVA, TSLA"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                className="uppercase font-mono"
              />
              <Button
                size="icon"
                onClick={handleSearch}
                disabled={loadingNews || !tickerInput.trim()}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Results */}
            {loadingNews ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 animate-pulse bg-muted rounded" />
                ))}
              </div>
            ) : searchedTicker && news.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No news found for <strong>{searchedTicker}</strong>.
              </p>
            ) : news.length > 0 ? (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                <p className="text-xs text-muted-foreground">
                  Showing news for{" "}
                  <span className="font-mono font-semibold">{searchedTicker}</span>
                </p>
                {news.map((item, i) => {
                  let dateStr = "";
                  try {
                    dateStr = formatDistanceToNow(new Date(item.date), {
                      addSuffix: true,
                    });
                  } catch {
                    dateStr = item.date;
                  }
                  return (
                    <a
                      key={i}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-md border hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2">
                            {item.source && (
                              <Badge variant="secondary" className="text-xs">
                                {item.source}
                              </Badge>
                            )}
                            {dateStr && (
                              <p className="text-xs text-muted-foreground">
                                {dateStr}
                              </p>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground mt-1" />
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Enter a ticker symbol to see the latest news.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
