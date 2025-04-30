"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { TimeInterval, StockData } from "../../types/stock";
import { TimeIntervalSelector } from "../core/TimeIntervalSelector";
import { StockStats } from "../core/StockStats";
import { Box } from "@mui/material";
import { useStockData } from "../../hooks/useStockData";
import { useMarketDataStore } from "@/store/market-data";
import type { QuoteData } from "@/types/tradestation";
import { DynamicChart } from "@/components/core/DynamicChart.client";

// Import chart component dynamically with no SSR
// const DynamicChart = dynamic(() => import("../core/DynamicChart.client"), {
//   ssr: false,
// });

interface DynamicStockChartProps {
  symbol: string;
}

export const DynamicStockChart: React.FC<DynamicStockChartProps> = ({
  symbol,
}) => {
  const [interval, setInterval] = useState<TimeInterval>("1m");
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Store data in local state with proper types
  const [barData, setBarData] = useState<StockData[]>([]);
  const [quote, setQuote] = useState<QuoteData | null>(null);

  // Handle initial mount
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Access store in effect
  useEffect(() => {
    if (!mounted) return;

    // Set initial values
    const store = useMarketDataStore.getState();
    const data = store.getBarData(symbol) || [];
    setBarData(data);
    setQuote(store.getQuote(symbol) || null);

    // Subscribe to changes
    const unsubscribe = useMarketDataStore.subscribe((state) => {
      const newData = state.barData[symbol] || [];
      if (newData.length > 0) {
        setBarData(newData);
      }
      setQuote(state.quotes[symbol] || null);
    });

    return unsubscribe;
  }, [symbol, mounted]);

  // Setup data fetching
  const { isLoading, error } = useStockData({
    symbol,
    interval,
  });

  const updateDimensions = useCallback(() => {
    if (!mounted || !containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    setDimensions({ width, height });
  }, [mounted]);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [updateDimensions, mounted]);

  const handleIntervalChange = useCallback((newInterval: TimeInterval) => {
    setInterval(newInterval);
  }, []);

  // Return loading state only after mounting to avoid hydration mismatch
  if (!mounted || typeof window === "undefined") {
    return null;
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          width: "100%",
          minHeight: "400px",
        }}
      >
        Loading...
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          width: "100%",
        }}
      >
        {error}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <StockStats quote={quote} symbol={symbol} />

      <Box
        ref={containerRef}
        sx={{
          flexGrow: 1,
          width: "100%",
          height: "100%",
          minHeight: "400px",
          position: "relative",
          "& > *": {
            width: "100% !important",
            height: "100% !important",
          },
        }}
      >
        {mounted &&
          barData.length > 0 &&
          dimensions.width > 0 &&
          dimensions.height > 0 && (
            <DynamicChart
              data={barData}
              width={dimensions.width}
              height={dimensions.height}
            />
          )}
      </Box>

      <TimeIntervalSelector value={interval} onChange={handleIntervalChange} />
    </Box>
  );
};
