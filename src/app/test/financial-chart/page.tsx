"use client";

import { useStockData } from "@/hooks/useStockData";
import { useMarketDataStore } from "@/store/market-data";
import { useEffect, useState } from "react";
import type { StockData } from "@/types/stock";
import FinancialChart from "@/components/charts/financial-chart/FinancialChart";

interface ChartData extends StockData {
  index?: number;
  ema12?: number;
  ema26?: number;
  ema200?: number;
  sma200?: number;
}

export default function FinancialChartPage() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const { isLoading, error } = useStockData({
    symbol: "AAPL",
    interval: "1m",
    useSampleData: true,
  });

  const { getBarData } = useMarketDataStore();

  useEffect(() => {
    const data = getBarData("AAPL") || [];
    const transformedData = data
      .filter((item) => item.price != null)
      .map((item) => ({
        ...item,
        date: item.date,
        price: item.price,
        volume: item.volume || 0,
        open: item.open || item.price,
        high: item.high || item.price,
        low: item.low || item.price,
        close: item.close || item.price,
        // Add pattern data based on price movement
        patternType:
          item.close && item.open
            ? item.close > item.open
              ? "bullish"
              : "bearish"
            : undefined,
        pattern:
          item.close && item.open
            ? item.close > item.open
              ? "Price increase"
              : "Price decrease"
            : undefined,
      }));
    setChartData(transformedData as ChartData[]);
  }, [getBarData]);

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Financial Chart Test</h1>
      <div className="bg-white rounded-lg shadow p-4">
        {chartData.length > 0 && (
          <FinancialChart
            data={chartData}
            ratio={1}
            chartText="AAPL Stock Chart"
          />
        )}
      </div>
    </div>
  );
}
