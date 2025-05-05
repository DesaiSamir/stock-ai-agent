export interface OHLCVData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartContainerProps {
  data: OHLCVData[];
  height: number;
  width: number;
  ratio: number;
}

export interface FinancialChartProps {
  data: OHLCVData[];
  height?: number;
  width?: number;
}

export interface PatternAnnotation {
  pattern: "bullish" | "bearish";
  date: Date;
  price: number;
}

export interface ElderRayData {
  bullPower: number;
  bearPower: number;
}

export type ChartIndicators = {
  ema12: number[];
  ema26: number[];
  ema200: number[];
  sma200: number[];
  elderRay: ElderRayData[];
  patterns: PatternAnnotation[];
};
