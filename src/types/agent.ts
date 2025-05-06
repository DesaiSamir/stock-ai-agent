import { EventEmitter } from 'events';
import { Candlestick } from './candlestick';

export type AgentStatus = "ACTIVE" | "INACTIVE" | "ERROR";
export type AgentType = "ANALYSIS" | "TRADING" | "NEWS" | "TICKER";

export interface AgentConfig {
  name: string;
  type: AgentType;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  lastUpdated: Date;
  config: {
    symbols: string[];
    updateInterval: number;
    technicalIndicators?: string[];
    fundamentalMetrics?: string[];
    minConfidence?: number;
    maxPositionSize?: number;
    riskLimit?: number;
    newsSources?: string[];
    dataSource?: string;
  };
}

export interface StockData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
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
  action: 'BUY' | 'SELL';
  price: number;
  confidence: number;
  timestamp: Date;
  source: AgentType;
  analysis?: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    keyEvents: string[];
    reasoning: string;
    predictedImpact: {
      magnitude: number;
      timeframe: 'immediate' | 'short-term' | 'long-term';
    };
  };
}

export interface BaseAgentConfig extends AgentConfig {
  config: {
    symbols: string[];
    updateInterval: number;
  };
}

export interface AnalysisAgentConfig extends BaseAgentConfig {
  config: {
    symbols: string[];
    updateInterval: number;
    technicalIndicators: string[];
    fundamentalMetrics: string[];
  };
}

export interface TradingAgentConfig extends BaseAgentConfig {
  config: {
    symbols: string[];
    updateInterval: number;
    minConfidence: number;
    maxPositionSize: number;
    riskLimit: number;
  };
}

export interface NewsAgentConfig extends BaseAgentConfig {
  config: {
    symbols: string[];
    updateInterval: number;
    newsSources: string[];
  };
}

export interface TickerAgentConfig extends BaseAgentConfig {
  config: {
    symbols: string[];
    updateInterval: number;
    dataSource: string;
  };
}

export interface TradeExecution {
  symbol: string;
  action: "BUY" | "SELL";
  quantity: number;
  price: number;
  timestamp: Date;
}

export interface BaseAgent extends EventEmitter {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  getStatus: () => AgentConfig;
}

export interface TradingAgent extends BaseAgent {
  handleTradeSignal: (signal: TradeSignal) => void;
  getPositions: () => Position[];
}

export interface TickerAgent extends BaseAgent {
  on(event: 'priceUpdate', listener: (data: Candlestick) => void): this;
}

export interface AnalysisAgent extends BaseAgent {
  on(event: 'analysisComplete', listener: (signal: TradeSignal) => void): this;
}

export interface NewsAgent extends BaseAgent {
  on(event: 'newsSignal', listener: (signal: TradeSignal) => void): this;
}

export interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnL: number;
}
