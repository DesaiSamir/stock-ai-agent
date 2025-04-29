"use client";

import React, { useState, useCallback } from "react";
import type { TradingSignal, NewsItem, AgentStatus } from "../../types/stock";
import { AgentToolbar } from "../blocks/AgentToolbar";
import { StockChart } from "../blocks/StockChart";
import { AgentTabs } from "../blocks/AgentTabs";
import { Box, Divider } from "@mui/material";

interface StockDashboardProps {
  tradingSignals: TradingSignal[];
  newsItems: NewsItem[];
  agentStatus: AgentStatus[];
}

export const StockDashboard: React.FC<StockDashboardProps> = ({
  tradingSignals,
  newsItems,
  agentStatus,
}) => {
  const [chartHeight, setChartHeight] = useState<number>(66.666);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const container = (e.currentTarget as HTMLElement).parentElement;
      if (!container) return;

      const { top, height } = container.getBoundingClientRect();
      const newChartHeight = ((e.clientY - top) / height) * 100;

      // Limit the chart height between 20% and 80%
      const limitedHeight = Math.min(Math.max(newChartHeight, 20), 80);
      setChartHeight(limitedHeight);
      e.preventDefault();
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener(
        "mousemove",
        handleMouseMove as unknown as (e: MouseEvent) => void
      );
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener(
        "mousemove",
        handleMouseMove as unknown as (e: MouseEvent) => void
      );
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <AgentToolbar />

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
          <StockChart symbol="AAPL" />
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
            height: `${100 - chartHeight}%`,
            minHeight: "20%",
            maxHeight: "80%",
            width: "100%",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <AgentTabs
            tradingSignals={tradingSignals}
            newsItems={newsItems}
            agentStatus={agentStatus}
          />
        </Box>
      </Box>
    </Box>
  );
};
