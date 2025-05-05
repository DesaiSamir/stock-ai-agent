"use client";

import React, { useState, useCallback, useEffect } from "react";
// import type { TradingSignal, NewsItem, AgentStatus } from "../../types/stock";
import { AgentToolbar } from "../blocks/AgentToolbar";
// import { StockChart } from "../blocks/StockChart";
import { DynamicStockChart } from "../blocks/DynamicStockChart";
import { AgentTabs } from "../blocks/AgentTabs";
import { Box, Divider } from "@mui/material";
import { useMarketDataStore } from "@/store/market-data";

interface StockDashboardProps {
  initialChartHeight?: number;
}

export const StockDashboard: React.FC<StockDashboardProps> = ({
  initialChartHeight = 60,
}) => {
  const [chartHeight, setChartHeight] = useState(initialChartHeight);
  const [isDragging, setIsDragging] = useState(false);
  const [activeAgent, setActiveAgent] = useState<
    "chart" | "dynamic-chart" | "news" | "trading" | "analysis"
  >("dynamic-chart");

  const { setCurrentSymbol, currentSymbol } = useMarketDataStore();

  // Set initial symbol if none is selected
  useEffect(() => {
    if (!currentSymbol) {
      setCurrentSymbol("AAPL");
    }
  }, [currentSymbol, setCurrentSymbol]);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isDragging) {
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseUp]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (typeof window === "undefined") return;
      if (isDragging) {
        const containerHeight = window.innerHeight;
        const newHeight = (e.clientY / containerHeight) * 100;
        setChartHeight(Math.min(Math.max(newHeight, 20), 80));
      }
    },
    [isDragging],
  );

  const renderChartComponent = () => {
    if (!currentSymbol) return null;

    switch (activeAgent) {
      case "chart":
      // return <StockChart symbol={currentSymbol} />;
      case "dynamic-chart":
        return <DynamicStockChart symbol={currentSymbol} />;
      case "news":
      case "trading":
      case "analysis":
        return null;
      default:
        // return <StockChart symbol={currentSymbol} />;
        return null;
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <AgentToolbar onSelectAgent={setActiveAgent} activeAgent={activeAgent} />

      <Box
        sx={{
          flexGrow: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
        onMouseMove={handleMouseMove}
      >
        {/* Chart Area - Dynamic height */}
        <Box
          sx={{
            height: `${chartHeight}%`,
            minHeight: "20%",
            maxHeight: "80%",
            width: "100%",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {renderChartComponent()}
        </Box>

        {/* Draggable Divider */}
        <Divider
          onMouseDown={handleMouseDown}
          sx={{
            cursor: "row-resize",
            height: "4px",
            bgcolor: "divider",
            "&:hover": {
              bgcolor: "primary.main",
              opacity: 0.7,
            },
            ...(isDragging && {
              bgcolor: "primary.main",
              opacity: 0.7,
            }),
          }}
        />

        {/* Agent Tabs - Remaining height */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: "auto",
          }}
        >
          <AgentTabs tradingSignals={[]} newsItems={[]} agentStatus={[]} />
        </Box>
      </Box>
    </Box>
  );
};
