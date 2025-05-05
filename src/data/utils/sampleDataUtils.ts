import { Candlestick } from "@/types/candlestick";
import { TimeInterval } from "../../types/stock";
import { QuoteData } from "../../types/tradestation";
import { generateStockData, CandlestickData } from "./generateStockData";

const INTERVAL_TO_MS: Record<TimeInterval, number> = {
  "1m": 60000,
  "5m": 300000,
  "15m": 900000,
  "30m": 1800000,
  "1h": 3600000,
  "4h": 14400000,
  "1d": 86400000,
  "1w": 604800000,
  "1M": 2592000000,
};

/**
 * Generates sample quote data for a given symbol
 * @param symbol The stock symbol
 * @returns A QuoteData object with realistic sample values
 */
export function generateSampleQuote(symbol: string): QuoteData {
  return {
    Symbol: symbol,
    Ask: 100.05,
    AskPriceDisplay: "100.05",
    AskSize: 100,
    AssetType: "Stock",
    Bid: 99.95,
    BidPriceDisplay: "99.95",
    BidSize: 100,
    Close: 100,
    ClosePriceDisplay: "100.00",
    CountryCode: "US",
    Currency: "USD",
    DailyOpenInterest: 0,
    DataFeed: "Sample",
    Description: "Sample Stock",
    DisplayType: 1,
    Error: "",
    Exchange: "NYSE",
    ExpirationDate: "",
    FirstNoticeDate: "",
    FractionalDisplay: false,
    Halted: false,
    High: 100.5,
    High52Week: 120.0,
    High52WeekPriceDisplay: "120.00",
    High52WeekTimeStamp: new Date().toISOString(),
    HighPriceDisplay: "100.50",
    IsDelayed: false,
    Last: 100,
    LastPriceDisplay: "100.00",
    LastSize: 100,
    LastTradingDate: "",
    LastVenue: "NYSE",
    Low: 99.5,
    Low52Week: 80.0,
    Low52WeekPriceDisplay: "80.00",
    Low52WeekTimeStamp: new Date().toISOString(),
    LowPriceDisplay: "99.50",
    MaxPrice: 200,
    MaxPriceDisplay: "200.00",
    MinMove: 0.01,
    MinPrice: 0,
    MinPriceDisplay: "0.00",
    NameExt: "",
    NetChange: 0.5,
    NetChangePct: 0.5,
    Open: 99.5,
    OpenPriceDisplay: "99.50",
    PointValue: 1,
    PreviousClose: 99.5,
    PreviousClosePriceDisplay: "99.50",
    PreviousVolume: 1000000,
    Restrictions: [],
    StrikePrice: 0,
    StrikePriceDisplay: "0.00",
    SymbolRoot: symbol,
    TickSizeTier: 1,
    TradeTime: new Date().toISOString(),
    Underlying: symbol,
    Volume: 1000000,
    VWAP: 100,
    VWAPDisplay: "100.00",
  };
}

/**
 * Generates sample bar chart data for a given symbol and interval
 * @param symbol The stock symbol
 * @param interval The time interval
 * @returns An array of StockData with realistic sample values
 */
export function generateSampleBarData(
  symbol: string,
  interval: string,
): Candlestick[] {
  const sampleData = generateStockData({
    symbol,
    interval: interval as TimeInterval,
    basePrice: 100,
    volatility: 0.02,
    points: 100,
  });

  return sampleData.map((data) => ({
    ...data,
    symbol,
    price: data.close ?? data.open ?? 0,
  }));
}

export function updateSampleBarData(
  currentData: Candlestick[],
  symbol: string,
  interval: TimeInterval,
): Candlestick[] {
  const lastBar = currentData[currentData.length - 1];
  const now = new Date();
  const volatility = 0.001; // Reduced volatility for smoother intra-candle updates

  if (
    !lastBar ||
    new Date(lastBar.date).getTime() + INTERVAL_TO_MS[interval] <= now.getTime()
  ) {
    // Time for a new bar
    const newBar = generateStockData({
      symbol,
      interval,
      basePrice: lastBar?.close ?? 100,
      volatility: 0.02, // Keep original volatility for new bars
      points: 1,
    })[0];
    return [...currentData, newBar];
  } else {
    // Update current bar with smaller movements
    const currentPrice = lastBar.close ?? 0;
    // Smaller price changes for intra-candle updates
    const priceChange = currentPrice * volatility * (Math.random() * 2 - 1);
    const newClose = Math.round((currentPrice + priceChange) * 100) / 100;

    const updatedBar = {
      ...lastBar,
      high: Math.max(lastBar.high ?? 0, newClose),
      low: Math.min(lastBar.low ?? 0, newClose),
      close: newClose,
    };
    return [...currentData.slice(0, -1), updatedBar];
  }
}

// Re-export the candlestick data types and functions
export type { CandlestickData };
