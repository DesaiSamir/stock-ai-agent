export interface AgentConfig {
  name: string;
  type: 'NEWS' | 'TICKER' | 'ANALYSIS' | 'TRADING';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  lastUpdated: Date;
  config: Record<string, unknown>;
}

export interface StockData {
  symbol: string;
  price: number;
  volume?: number;
  timestamp: string;
}

export interface NewsItem {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: number;
}

export interface TradeSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  confidence: number;
  timestamp: string;
  reason?: string;
} 