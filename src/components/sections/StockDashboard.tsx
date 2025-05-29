"use client";

import React, { useState, useCallback, useEffect } from "react";
// import type { TradingSignal, NewsItem, AgentStatus } from "../../types/stock";
import { AgentToolbar } from "../blocks/AgentToolbar";
// import { StockChart } from "../blocks/StockChart";
import { DynamicStockChart } from "../blocks/DynamicStockChart";
import { AgentTabs } from "../blocks/AgentTabs";
import { Box, Divider } from "@mui/material";
import { useMarketDataStore } from "@/store/market-data";
import { AnalysisDashboard } from "../features/analysis/AnalysisDashboard";
import { AgentDashboard } from "@/components/features/agent-dashboard/AgentDashboard";
import { AgentOrchestrator } from "@/agents/AgentOrchestrator";
import { useAgentMonitoringStore } from "@/store/agent-monitoring";
import type { AgentTabKey } from "@/constants/sidebar";

interface StockDashboardProps {
  initialChartHeight?: number;
}

// Add type declaration for window with orchestrator
declare global {
  interface Window {
    orchestrator?: AgentOrchestrator;
  }
}

export const StockDashboard: React.FC<StockDashboardProps> = ({
  initialChartHeight = 60,
}) => {
  const [chartHeight, setChartHeight] = useState(initialChartHeight);
  const [isDragging, setIsDragging] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentTabKey>("dynamic-chart");

  const { setCurrentSymbol, currentSymbol, barData } = useMarketDataStore();
  const { setOrchestrator: setStoreOrchestrator, isOrchestratorRunning } = useAgentMonitoringStore();

  // Initialize orchestrator
  useEffect(() => {
    let orchestratorInstance: AgentOrchestrator | null = null;

    // Only initialize if not already running
    if (!isOrchestratorRunning) {
      const newOrchestrator = new AgentOrchestrator({
        symbols: ['AAPL'],
        updateInterval: 60000, // 1 minute
        technicalIndicators: ['EMA', 'RSI', 'MACD', 'BB'],
        fundamentalMetrics: ['PE', 'PB', 'ROE', 'DEBT_EQUITY'],
        minConfidence: 0.7,
        maxPositionSize: 100000,
        riskLimit: 0.02,
        newsSources: ['reuters', 'bloomberg', 'wsj'],
        dataSource: 'alpha-vantage',
      });
      
      // Set up store interface
      newOrchestrator.setStore({
        isOrchestratorRunning,
        setOrchestratorRunning: (running: boolean) => {
          // Only update store if state actually changes and it's not from initialization
          if (running !== isOrchestratorRunning) {
            // Don't update orchestrator reference, just the running state
            useAgentMonitoringStore.getState().setOrchestratorRunning(running);
          }
        }
      });

      // Make orchestrator globally available
      window.orchestrator = newOrchestrator;
      orchestratorInstance = newOrchestrator;

      // Initialize store with orchestrator without changing running state
      setStoreOrchestrator(newOrchestrator);
    }

    return () => {
      if (orchestratorInstance) {
        orchestratorInstance.stop().catch(console.error);
        // Clean up global reference
        if (window.orchestrator === orchestratorInstance) {
          delete window.orchestrator;
        }
      }
    };
  }, [isOrchestratorRunning, setStoreOrchestrator]);

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
      case "dynamic-chart":
        return <DynamicStockChart symbol={currentSymbol} />;
      case "news":
      case "trading":
        return null;
      case "analysis":
        return <AnalysisDashboard symbol={currentSymbol} marketData={barData[currentSymbol] || []} />;
      case "dashboard":
        return <AgentDashboard />;
      default:
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

        <Box
          sx={{
            flexGrow: 1,
            overflow: "auto",
            height: `${100 - chartHeight}%`,
            minHeight: "20%",
            maxHeight: "80%",
            pb: 6,
          }}
        >
          <AgentTabs />
        </Box>
      </Box>
    </Box>
  );
};
