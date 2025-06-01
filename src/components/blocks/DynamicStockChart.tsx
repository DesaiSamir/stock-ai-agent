"use client";

import React, { useState, useRef, useEffect } from "react";
import { StockStats } from "../charts/stock-stats";
import { Box } from "@mui/material";
import { useStockData } from "../../hooks/useStockData";
import FinancialChart from "@/components/charts/financial-chart/FinancialChart";
import { useMarketDataStore } from "@/store/market-data";
import { Candlestick } from "@/types/candlestick";

interface DynamicStockChartProps {
  symbol: string;
}

export const DynamicStockChart: React.FC<DynamicStockChartProps> = ({
  symbol,
}) => {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle initial mount
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Setup data fetching
  const { isLoading, error } = useStockData({});

  const { getBarData } = useMarketDataStore();

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
  const chartData: Candlestick[] = getBarData(symbol) || [];

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
        {mounted && chartData.length > 0 && (
          <FinancialChart
            data={chartData}
            ratio={1}
            chartText={`${symbol} Stock Chart`}
          />
        )}
      </Box>
    </Box>
  );
};

