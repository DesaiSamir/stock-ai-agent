import type { TimeInterval } from "../../types/stock";

export interface StockConfig {
  symbol: string;
  interval: TimeInterval;
  basePrice: number;
  points: number;
}

export const defaultStockConfig: StockConfig = {
  symbol: "AAPL",
  interval: "1m",
  basePrice: 180,
  points: 100,
};
