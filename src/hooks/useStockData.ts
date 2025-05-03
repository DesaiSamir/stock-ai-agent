"use client";

import { useState, useEffect } from "react";
import { useMarketDataStore } from "@/store/market-data";
import { TimeInterval } from "@/types/stock";
import {
  generateSampleBarData,
  generateSampleQuote,
  updateSampleBarData,
} from "@/data/utils/sampleDataUtils";
import { http } from "@/utils/http";
import type { FormattedBarData, StreamPayload } from "@/utils/http";
import type { QuoteData } from "@/types/tradestation";
import { useSessionStore } from "@/store/session";

interface UseStockDataOptions {
  symbol: string;
  interval: TimeInterval;
  isPreMarket?: boolean;
  useSampleData?: boolean;
}

export function useStockData({
  symbol,
  interval = "1m",
  isPreMarket = false,
  useSampleData = false,
}: UseStockDataOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateBarData, updateQuote } = useMarketDataStore();
  const { isConnected } = useSessionStore();

  // Barchart data effect
  useEffect(() => {
    if (!isConnected || useSampleData) {
      // Generate sample data when not connected or when useSampleData is true
      const formattedData = generateSampleBarData(symbol, interval);
      updateBarData(symbol, formattedData);
      setIsLoading(false);

      // Set up interval for updates
      const updateInterval = setInterval(() => {
        const store = useMarketDataStore.getState();
        const currentData = store.getBarData(symbol) || [];
        const updatedData = updateSampleBarData(currentData, symbol, interval);
        updateBarData(symbol, updatedData);
      }, 1000); // Update every second for smoother updates

      return () => clearInterval(updateInterval);
    }

    setIsLoading(true);
    setError(null);

    // Convert interval to TradeStation format
    const unit = interval.endsWith("m") ? "Minute" : "Daily";
    const intervalValue = parseInt(interval);

    const payload: StreamPayload = {
      symbol,
      interval: intervalValue,
      unit,
      isPreMarket,
    };

    // Handler for barchart data
    const handleBarData = (barData: FormattedBarData[]) => {
      const formattedData = barData.map((bar) => {
        // Extract timestamp number from "/Date(1234567890000)/" format
        const timestamp = parseInt(bar.timestamp.replace(/[^0-9]/g, ""));
        return {
          ...bar,
          symbol,
          date: new Date(timestamp).toISOString(),
          price: bar.close,
        };
      });
      updateBarData(symbol, formattedData);
      setIsLoading(false);
    };

    let mounted = true;

    // Start streaming data
    http
      .getBarChartDataStream(payload, handleBarData)
      .then(() => {
        if (mounted) {
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Failed to fetch bar data:", err);
          setError(
            err instanceof Error ? err.message : "Failed to fetch bar data"
          );
          setIsLoading(false);
        }
      });

    // Cleanup
    return () => {
      mounted = false;
      http.clearBarChartInterval();
    };
  }, [
    symbol,
    interval,
    isPreMarket,
    isConnected,
    updateBarData,
    useSampleData,
  ]);

  // Quote data polling
  useEffect(() => {
    if (!isConnected || useSampleData) {
      // Generate sample quote data
      const sampleQuote = generateSampleQuote(symbol);
      updateQuote(symbol, sampleQuote);
      return;
    }

    setError(null);

    const handleQuoteData = (quoteData: QuoteData) => {
      if (!quoteData) return;

      // Only update if we have a timestamp and it's current
      if (quoteData.TradeTime) {
        const quoteTime = new Date(quoteData.TradeTime).getTime();
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000;

        // Skip if quote is older than 5 minutes
        if (quoteTime < fiveMinutesAgo) {
          return;
        }
      }

      updateQuote(symbol, quoteData);
    };

    let mounted = true;

    // Start quote polling
    http
      .startQuotePolling(symbol, handleQuoteData)
      .then(() => {
        if (mounted) {
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Failed to start quote polling:", err);
          setError(
            err instanceof Error ? err.message : "Failed to start quote polling"
          );
        }
      });

    // Cleanup
    return () => {
      mounted = false;
      http.clearQuoteInterval();
    };
  }, [symbol, isConnected, updateQuote, useSampleData]);

  return {
    isLoading,
    error,
  };
}
