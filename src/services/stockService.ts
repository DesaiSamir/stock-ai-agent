import { useState, useEffect } from 'react';
import { StockData, TradingSignal, NewsItem, AgentStatus } from '../types/stock';

interface StockDataState {
  stockData: StockData[];
  tradingSignals: TradingSignal[];
  newsItems: NewsItem[];
  agentStatus: AgentStatus[];
  isLoading: boolean;
  error: Error | null;
}

export function useStockData() {
  const [state, setState] = useState<StockDataState>({
    stockData: [],
    tradingSignals: [],
    newsItems: [],
    agentStatus: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // TODO: Replace with actual API calls
        const mockData: Omit<StockDataState, 'isLoading' | 'error'> = {
          stockData: [
            {
              symbol: 'AAPL',
              price: 150.25,
              volume: 1000000,
              timestamp: new Date(),
              change: 2.5,
              changePercent: 1.67,
            },
          ],
          tradingSignals: [
            {
              symbol: 'AAPL',
              type: 'BUY' as const,
              confidence: 0.85,
              price: 150.25,
              timestamp: new Date(),
              reason: 'Strong upward trend detected',
            },
          ],
          newsItems: [
            {
              id: '1',
              title: 'Apple Reports Strong Q4 Earnings',
              content: 'Apple Inc. reported better than expected earnings...',
              source: 'Financial News',
              publishedAt: new Date(),
              sentiment: 0.8,
              relatedStocks: ['AAPL'],
            },
          ],
          agentStatus: [
            {
              name: 'News Agent',
              type: 'NEWS' as const,
              status: 'ACTIVE' as const,
              lastUpdated: new Date(),
            },
          ],
        };

        setState({
          ...mockData,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('An error occurred'),
        }));
      }
    }

    fetchData();
  }, []);

  return state;
} 