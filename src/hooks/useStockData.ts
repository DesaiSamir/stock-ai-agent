"use client";

import { useState, useEffect } from "react";
import { useMarketDataStore } from "@/store/market-data";
import {
  generateSampleBarData,
  generateSampleQuote,
  updateSampleBarData,
} from "@/data/utils/sampleDataUtils";
import { http } from "@/utils/http";
import type { StreamPayload } from "@/utils/http";
import type { QuoteData } from "@/types/tradestation";
import { useSessionStore } from "@/store/session";
import { Candlestick } from "@/types/candlestick";

interface UseStockDataOptions {
  isPreMarket?: boolean;
  useSampleData?: boolean;
}

export function useStockData({
  isPreMarket = false,
  useSampleData = false,
}: UseStockDataOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateBarData, updateQuote } = useMarketDataStore();
  const { isConnected } = useSessionStore();
  const { currentInterval, currentSymbol } = useMarketDataStore();

  // Barchart data effect
  useEffect(() => {
    if (!isConnected || useSampleData) {
      // Generate sample data when not connected or when useSampleData is true
      const formattedData = generateSampleBarData();
      updateBarData(currentSymbol, formattedData);
      setIsLoading(false);

      // Set up interval for updates
      const updateInterval = setInterval(() => {
        const store = useMarketDataStore.getState();
        const currentData = store.getBarData(currentSymbol) || [];
        const updatedData = updateSampleBarData(currentData);
        updateBarData(currentSymbol, updatedData);
      }, 1000); // Update every second for smoother updates

      return () => clearInterval(updateInterval);
    }

    setIsLoading(true);
    setError(null);

    const payload: StreamPayload = {
      symbol: currentSymbol,
      interval: currentInterval.value || 1,
      unit: currentInterval.unit || "Minute",
      isPreMarket,
    };

    // Handler for barchart data
    const handleBarData = (barData: Candlestick[]) => {
      updateBarData(currentSymbol, barData);
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
            err instanceof Error ? err.message : "Failed to fetch bar data",
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
    currentSymbol,
    currentInterval.interval,
    isPreMarket,
    isConnected,
    updateBarData,
    useSampleData,
    currentInterval,
  ]);

  // Quote data polling
  useEffect(() => {
    if (!isConnected || useSampleData) {
      // Generate sample quote data
      const sampleQuote = generateSampleQuote(currentSymbol);
      updateQuote(currentSymbol, sampleQuote);
      return;
    }

    setError(null);

    const handleQuoteData = (quoteData: QuoteData) => {
      if (!quoteData) return;
      
      updateQuote(currentSymbol, quoteData);
    };

    let mounted = true;

    // Start quote polling
    http
      .getQuoteDataRecursive(currentSymbol, handleQuoteData)
      .then(() => {
        if (mounted) {
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Failed to start quote polling:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to start quote polling",
          );
        }
      });

    // Cleanup
    return () => {
      mounted = false;
      http.clearQuoteInterval();
    };
  }, [currentSymbol, isConnected, updateQuote, useSampleData]);

  return {
    isLoading,
    error,
  };
}
