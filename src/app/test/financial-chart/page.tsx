'use client';

import { CandlestickChart } from '@/components/charts/candlestick/CandlestickChart.client';

export default function FinancialChartPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Financial Chart Test</h1>
      <div className="bg-white rounded-lg shadow p-4">
        <CandlestickChart
          symbol="AAPL"
          height={600}
          width={1200}
          useSampleData={true}
        />
      </div>
    </div>
  );
}