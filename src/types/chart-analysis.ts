import { Candlestick } from "./candlestick";
import { TechnicalIndicators, TrendAnalysis, VolumeAnalysis } from "@/services/technical-analysis";

export interface ChartAnalysisRequest {
  symbol: string;
  timeframe?: string;
  tradeType?: string;
  bars: Candlestick[];
  technicalAnalysis?: {
    indicators: TechnicalIndicators;
    trend: TrendAnalysis;
    volume: VolumeAnalysis;
  };
  newsAnalysis: {
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: number;
    articles: Array<{
      title: string;
      source: string;
      url: string;
      sentiment: number;
      timestamp: string;
    }>;
    summary: string;
    keyTopics?: string[];
    marketImpact?: {
      direction: 'up' | 'down' | 'stable';
      magnitude: number;
      timeframe: 'immediate' | 'short-term' | 'long-term';
    };
  };
  marketData?: {
    symbol: string;
    price: number;
    volume: number;
    timestamp: string;
  };
}

export interface ChartAnalysisResponse {
  action: "BUY" | "SELL" | "NEUTRAL";
  confidence: number;
  reasoning: string;
  entry?: number;
  stop?: number;
  target?: number;
  optionsPlay?: string;
  riskReward?: number;
  probabilityOfProfit?: number;
  rawResponse?: string;
} 