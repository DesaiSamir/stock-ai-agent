import { ChartOptions } from "chart.js";
import { TimeInterval } from "@/types/stock";

export interface CandlestickData {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

export interface CandlestickChartProps {
  symbol: string;
  interval?: TimeInterval;
  height?: number;
  width?: number;
  useSampleData?: boolean;
}

export interface ChartComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartRef: React.RefObject<any>;
  options: ChartOptions<"candlestick">;
}
