'use client';

import { useState, useEffect } from 'react';
import type { StockData, TimeInterval } from '../types/stock';
import { http, type FormattedBarData } from '@/utils/http';
import type { StreamPayload } from '@/utils/http';
import { useTradeStationStore } from '@/store/tradestation';

interface UseStockDataOptions {
  symbol: string;
  interval: TimeInterval;
  isPreMarket?: boolean;
}

export function useStockData({ 
  symbol, 
  interval = '1m',
  isPreMarket = false
}: UseStockDataOptions) {
  const [data, setData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useTradeStationStore();

  useEffect(() => {
    if (!isConnected) {
      setError('Not connected to TradeStation');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Convert interval to TradeStation format
    const unit = interval.endsWith('m') ? 'Minute' : 'Daily';
    const intervalValue = parseInt(interval);
    
    // Create barchart request
    const barchartRequest = http.createBarchartRequest(symbol, intervalValue, unit, isPreMarket);
    const url = `/v2/stream/barchart/${barchartRequest.symbol}/${barchartRequest.interval}/${barchartRequest.unit}/${barchartRequest.barsBack}/${barchartRequest.lastDate}${barchartRequest.sessionTemplate ? `?SessionTemplate=${barchartRequest.sessionTemplate}` : ''}`;
    
    const payload: StreamPayload = {
      method: 'STREAM',
      url
    };

    // Handler for barchart data
    const handleBarData = (barData: FormattedBarData[]) => {
      setData(barData.map(bar => ({
        ...bar,
        symbol
      })));
      setIsLoading(false);
    };

    // Start streaming data
    http.getBarChartData(payload, handleBarData)
      .catch(err => {
        console.error('Failed to fetch bar data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch bar data');
        setIsLoading(false);
      });

    // Cleanup
    return () => {
      http.clearBarChartInterval();
      http.clearQuoteInterval();
    };
  }, [symbol, interval, isPreMarket, isConnected]);

  // Quote data streaming
  useEffect(() => {
    if (!isConnected) return;

    const handleQuoteData = (quote: { Last: number; Volume: number }) => {
      if (!quote) return;

      setData(prevData => {
        if (prevData.length === 0) return prevData;

        const latestCandle = {
          ...prevData[0],
          close: quote.Last,
          high: Math.max(prevData[0].high, quote.Last),
          low: Math.min(prevData[0].low, quote.Last),
          volume: quote.Volume
        };

        return [latestCandle, ...prevData.slice(1)];
      });
    };

    // Start quote streaming
    http.getQuoteDataStream(symbol, handleQuoteData);

    // Cleanup
    return () => {
      http.clearQuoteInterval();
    };
  }, [symbol, isConnected]);

  return {
    data,
    isLoading,
    error
  };
} 