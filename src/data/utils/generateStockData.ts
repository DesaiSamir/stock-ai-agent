import { StockData, TimeInterval } from "../../types/stock";

interface GenerateStockDataOptions {
  symbol: string;
  interval: TimeInterval;
  basePrice?: number;
  volatility?: number;
  points?: number;
}

const INTERVAL_TO_MINUTES: Record<TimeInterval, number> = {
  "1m": 1,
  "5m": 5,
  "15m": 15,
  "30m": 30,
  "1h": 60,
  "4h": 240,
  "1d": 1440,
  "1w": 10080,
  "1M": 43200,
};

export interface CandlestickData {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

/**
 * Generates realistic sample stock data based on the given parameters
 * @param options Configuration options for data generation
 * @returns Array of StockData sorted by timestamp (newest first)
 */
export function generateStockData({
  interval = "1m",
  basePrice = 100,
  volatility = 0.02,
  points = 100,
}: GenerateStockDataOptions): StockData[] {
  const data: StockData[] = [];
  const minutesPerInterval = INTERVAL_TO_MINUTES[interval];
  const now = new Date();
  let currentPrice = basePrice;

  // Generate data points from oldest to newest
  for (let i = points - 1; i >= 0; i--) {
    // Calculate timestamp for this point
    const timestamp = new Date(
      now.getTime() - i * minutesPerInterval * 60 * 1000
    );

    // Generate random price movement
    const priceChange =
      Math.round(currentPrice * volatility * (Math.random() * 2 - 1) * 100) /
      100;
    const open = Math.round(currentPrice * 100) / 100;
    const close = Math.round((currentPrice + priceChange) * 100) / 100;
    const high =
      Math.round(
        (Math.max(open, close) + Math.abs(priceChange) * Math.random()) * 100
      ) / 100;
    const low =
      Math.round(
        (Math.min(open, close) - Math.abs(priceChange) * Math.random()) * 100
      ) / 100;

    // Update current price for next iteration
    currentPrice = close;

    // Generate realistic volume
    const baseVolume = Math.floor(100000 + Math.random() * 900000);
    const volumeSpike = Math.random() < 0.1 ? Math.random() * 5 + 2 : 1; // 10% chance of volume spike
    const volume = Math.floor(baseVolume * volumeSpike);

    data.push({
      date: timestamp.toISOString(),
      open,
      high,
      low,
      close,
      volume,
    } as StockData);
  }

  return data;
}
