export interface StockData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: Date;
  change: number;
  changePercent: number;
}

export interface TradingSignal {
  symbol: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  timestamp: Date;
  reason: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  publishedAt: Date;
  sentiment: number;
  relatedStocks: string[];
}

export interface AgentStatus {
  name: string;
  type: 'NEWS' | 'TICKER' | 'ANALYSIS' | 'TRADING';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  lastUpdated: Date;
} 