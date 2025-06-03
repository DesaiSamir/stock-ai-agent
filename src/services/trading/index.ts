import { ENDPOINTS } from '@/constants/http';
import { httpService } from '../http-client';

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: string;
}

export interface NewsAnalysis {
  sentiment: number;
  confidence: number;
  relevantNews: string[];
}

export interface TradingSignal {
  symbol: string;
  direction: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  reasons: string[];
}

export interface TradeOrder {
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
}

export const tradingService = {
  // Get market data for a symbol
  async getMarketData(symbol: string): Promise<MarketData> {
    return httpService.get<MarketData>(`${ENDPOINTS.TRADING.MARKET_DATA}/${symbol}`);
  },

  // Get news analysis for a symbol
  async getNewsAnalysis(symbol: string): Promise<NewsAnalysis> {
    return httpService.get<NewsAnalysis>(`${ENDPOINTS.TRADING.NEWS_ANALYSIS}/${symbol}`);
  },

  // Get trading signal for a symbol
  async getTradingSignal(symbol: string): Promise<TradingSignal> {
    return httpService.get<TradingSignal>(`${ENDPOINTS.TRADING.SIGNAL}/${symbol}`);
  },

  // Execute a trade
  async executeTrade(order: TradeOrder): Promise<{ status: string; orderId: string }> {
    return httpService.post<{ status: string; orderId: string }>(ENDPOINTS.TRADING.EXECUTE, order);
  },

  // Get active trades
  async getActiveTrades(): Promise<TradeOrder[]> {
    return httpService.get<TradeOrder[]>(ENDPOINTS.TRADING.ACTIVE_TRADES);
  }
}; 