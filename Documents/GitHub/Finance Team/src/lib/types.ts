export type TradeType = "BUY" | "SELL";

export const PREDEFINED_TAGS = [
  "Green Energy",
  "Nuclear",
  "Chips",
  "Quantum Computing",
  "AI",
] as const;

export type PredefinedTag = (typeof PREDEFINED_TAGS)[number];

export interface Trade {
  id: string;
  user_id: string;
  ticker: string;
  type: TradeType;
  price: number;
  quantity: number;
  timestamp: string;
  tags: string[];
  notes: string | null;
  created_at: string;
}

export interface TradeWithUser extends Trade {
  user_name: string | null;
  user_image: string | null;
  user_email: string | null;
}

export interface PortfolioPosition {
  ticker: string;
  net_quantity: number;
  avg_cost: number;
  total_invested: number;
  realized_pnl: number;
  trade_count: number;
  // Enriched client-side from Polygon
  current_price?: number;
  unrealized_pnl?: number;
}

export interface MayaAnnouncement {
  id: string;
  title: string;
  company: string;
  date: string;
  url: string;
}

export interface CreateTradeInput {
  ticker: string;
  type: TradeType;
  price: number;
  quantity: number;
  tags: string[];
  notes?: string;
}
