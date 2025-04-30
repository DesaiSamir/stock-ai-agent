"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { TimeInterval, StockData } from "../../types/stock";
import { TimeIntervalSelector } from "../core/TimeIntervalSelector";
import { StockStats } from "../core/StockStats";
import dynamic from "next/dynamic";
import { Box } from "@mui/material";
import { useStockData } from "../../hooks/useStockData";
import { useMarketDataStore } from "@/store/market-data";
import type { QuoteData } from "@/types/tradestation";

interface StockChartProps {
  symbol: string;
}

const Chart = dynamic(() => import("../core/Chart"), { ssr: false });

export const StockChart: React.FC<StockChartProps> = ({ symbol }) => {
  const [interval, setInterval] = useState<TimeInterval>("1m");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Store data in local state with proper types
  const [barData, setBarData] = useState<StockData[]>([]);
  const [quote, setQuote] = useState<QuoteData | null>(null);

  // Access store in effect
  useEffect(() => {
    // Set initial values
    setBarData(useMarketDataStore.getState().barData[symbol] || []);
    setQuote(useMarketDataStore.getState().quotes[symbol] || null);

    // Subscribe to changes
    const unsubscribe = useMarketDataStore.subscribe((state) => {
      setBarData(state.barData[symbol] || []);
      setQuote(state.quotes[symbol] || null);
    });

    return unsubscribe;
  }, [symbol]);

  // Setup data fetching
  const { isLoading, error } = useStockData({
    symbol,
    interval,
  });

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
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
  }, [updateDimensions]);

  const handleIntervalChange = useCallback((newInterval: TimeInterval) => {
    setInterval(newInterval);
  }, []);

  if (isLoading) {
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
            // Ensure chart takes full width
            width: "100% !important",
            height: "100% !important",
          },
        }}
      >
        {barData.length > 0 && (
          <Chart
            data={barData}
            width={dimensions.width}
            height={dimensions.height}
            ratio={1}
          />
        )}
      </Box>

      <TimeIntervalSelector value={interval} onChange={handleIntervalChange} />
    </Box>
  );
};
