'use client';

import React from 'react';
import { StockDashboard } from '../components/sections/StockDashboard';
import { generateStockData } from '../data/utils/generateStockData';
import {
  sampleTradingSignals,
  sampleNewsItems,
  sampleAgentStatus,
  defaultStockConfig,
} from '../data/samples';

export default function Home() {
  // Generate initial sample data using the default config
  const sampleData = generateStockData(defaultStockConfig);

  return (
    <main className="min-h-screen bg-gray-50">
      <StockDashboard
        stockData={sampleData}
        tradingSignals={sampleTradingSignals}
        newsItems={sampleNewsItems}
        agentStatus={sampleAgentStatus}
      />
    </main>
  );
}
