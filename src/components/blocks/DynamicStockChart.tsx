"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { TimeInterval } from "../../types/stock";
import { TimeIntervalSelector } from "../core/TimeIntervalSelector";
import { StockStats } from "../charts/stock-stats";
import { Box } from "@mui/material";
import { useStockData } from "../../hooks/useStockData";
import { CandlestickChart } from "@/components/charts/candlestick/CandlestickChart.client";

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

  // Handle initial mount
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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
      <StockStats />

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
        {mounted && dimensions.width > 0 && dimensions.height > 0 && (
          <CandlestickChart
            symbol={symbol}
            interval={interval}
            width={dimensions.width}
            height={dimensions.height}
          />
        )}
      </Box>

      <TimeIntervalSelector value={interval} onChange={handleIntervalChange} />
    </Box>
  );
};
