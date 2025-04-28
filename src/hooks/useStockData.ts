'use client';

import { useState, useEffect, useRef } from 'react';
import type { StockData, TimeInterval } from '../types/stock';
import { generateStockData } from '../data/utils/generateStockData';

interface UseStockDataOptions {
  symbol: string;
  interval: TimeInterval;
  refreshInterval?: number;
}

interface CurrentCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export function useStockData({ 
  symbol, 
  interval = '1m',
  refreshInterval = 1000 
}: UseStockDataOptions) {
  const [data, setData] = useState<StockData[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const currentCandleRef = useRef<CurrentCandle | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Set hydration flag
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Initialize with mock data
  useEffect(() => {
    // Use a stable timestamp for initial render
    const now = Math.floor(Date.now() / 60000) * 60000; // Round to nearest minute
    const mockData = generateStockData({
      symbol,
      interval,
      points: 100,
      basePrice: 100,
      volatility: 0.02
    });

    setData(mockData);
    
    if (isHydrated) {
      // Initialize current candle
      const latestPrice = mockData[0].close;
      currentCandleRef.current = {
        open: latestPrice,
        high: latestPrice,
        low: latestPrice,
        close: latestPrice,
        volume: 0,
        timestamp: now
      };
      lastUpdateRef.current = now;
    }
  }, [symbol, interval, isHydrated]);

  // Handle real-time updates only after hydration
  useEffect(() => {
    if (!isHydrated) return;

    const updateInterval = setInterval(() => {
      const now = Date.now();
      const currentMinute = Math.floor(now / 60000) * 60000;
      
      if (!currentCandleRef.current) return;

      // Calculate new price with random walk
      const timeDiff = now - lastUpdateRef.current;
      const baseVolatility = 0.003;
      const timeScaledVolatility = baseVolatility * Math.sqrt(timeDiff / 1000); // Scale by square root of seconds
      const change = (Math.random() - 0.5) * 2 * timeScaledVolatility; // Normalize to [-volatility, +volatility]
      const newPrice = currentCandleRef.current.close * (1 + change);
      
      // Update current candle with dampened volume
      currentCandleRef.current = {
        ...currentCandleRef.current,
        high: Math.max(currentCandleRef.current.high, newPrice),
        low: Math.min(currentCandleRef.current.low, newPrice),
        close: newPrice,
        volume: currentCandleRef.current.volume + Math.random() * 100 // Reduced volume changes
      };

      // Check if we need to create a new candle
      if (currentMinute > currentCandleRef.current.timestamp) {
        // Push current candle to history
        setData(prevData => [
          {
            symbol,
            ...currentCandleRef.current!,
            timestamp: new Date(currentCandleRef.current!.timestamp)
          },
          ...prevData
        ]);

        // Start new candle
        currentCandleRef.current = {
          open: newPrice,
          high: newPrice,
          low: newPrice,
          close: newPrice,
          volume: 0,
          timestamp: currentMinute
        };
      }

      lastUpdateRef.current = now;
      
      // Trigger re-render for intra-candle updates
      setData(prevData => [
        {
          symbol,
          ...currentCandleRef.current!,
          timestamp: new Date(currentCandleRef.current!.timestamp)
        },
        ...prevData.slice(1)
      ]);
    }, refreshInterval);

    return () => clearInterval(updateInterval);
  }, [symbol, interval, refreshInterval, isHydrated]);

  return data;
} 