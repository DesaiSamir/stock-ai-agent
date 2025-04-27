'use client';

import React from 'react';
import { StockDashboard } from '../components/sections/StockDashboard';
import { useStockData } from '../services/stockService';

export default function Home() {
  const { stockData, tradingSignals, newsItems, agentStatus, isLoading, error } = useStockData();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <StockDashboard
        stockData={stockData}
        tradingSignals={tradingSignals}
        newsItems={newsItems}
        agentStatus={agentStatus}
      />
    </main>
  );
}
