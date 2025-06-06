export type TimeInterval =
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "4h"
  | "1d"
  | "1w"
  | "1M";

export interface TradingSignal {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  price: number;
  confidence: number;
  reason: string;
  timestamp: Date;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  sentiment: "positive" | "negative" | "neutral";
  publishedAt: Date;
  symbol: string;
}

export interface AgentStatus {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE" | "ERROR";
  lastUpdate: Date;
  message?: string;
}
