"use client";

import React from "react";
import { StockDashboard } from "../components/sections/StockDashboard";
import {
  sampleTradingSignals,
  sampleNewsItems,
  sampleAgentStatus,
  // defaultStockConfig,
} from "../data/samples";

export default function Home() {

  return (
    <main className="min-h-screen bg-gray-50">
      <StockDashboard
        tradingSignals={sampleTradingSignals}
        newsItems={sampleNewsItems}
        agentStatus={sampleAgentStatus}
      />
    </main>
  );
}
