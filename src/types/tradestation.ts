export interface BarStatus {
  bit0: number;
  bit1: number;
  bit2: number;
  bit3: number;
  bit4: number;
  bit5: number;
  bit6: number;
  bit7: number;
  bit8: number;
  bit19: number;
  bit23: number;
  bit24: number;
  bit25: number;
  bit26: number;
  bit27: number;
  bit28: number;
  bit29: number;
}

export interface BarData {
  Close: number;
  DownTicks: number;
  DownVolume: number;
  High: number;
  Low: number;
  Open: number;
  OpenInterest: number;
  Status: BarStatus;
  TimeStamp: string;
  TotalTicks: number;
  TotalVolume: number;
  "UnchangedTicks (Deprecated)": number;
  "UnchangedVolume (Deprecated)": number;
  UpTicks: number;
  UpVolume: number;
}

export type TimeUnit = 'Minute' | 'Daily' | 'Weekly' | 'Monthly';

export interface BarchartRequest {
  symbol: string;
  interval: number;
  unit: TimeUnit;
  barsBack: number;
  lastDate: string;
  sessionTemplate?: 'USEQPreAndPost';
}

// Helper function to format barchart URL
export function formatBarchartUrl(params: BarchartRequest): string {
  const { symbol, interval, unit, barsBack, lastDate, sessionTemplate } = params;
  const baseUrl = `/v2/stream/barchart/${symbol}/${interval}/${unit}/${barsBack}/${lastDate}`;
  return sessionTemplate ? `${baseUrl}?SessionTemplate=${sessionTemplate}` : baseUrl;
}

export interface QuoteData {
  Ask: number;
  AskPriceDisplay: string;
  AskSize: number;
  AssetType: string;
  Bid: number;
  BidPriceDisplay: string;
  BidSize: number;
  Close: number;
  ClosePriceDisplay: string;
  CountryCode: string;
  Currency: string;
  DailyOpenInterest: number;
  DataFeed: string;
  Description: string;
  DisplayType: number;
  Error: string;
  Exchange: string;
  ExpirationDate: string;
  FirstNoticeDate: string;
  FractionalDisplay: boolean;
  Halted: boolean;
  High: number;
  High52Week: number;
  High52WeekPriceDisplay: string;
  High52WeekTimeStamp: string;
  HighPriceDisplay: string;
  IsDelayed: boolean;
  Last: number;
  LastPriceDisplay: string;
  LastSize: number;
  LastTradingDate: string;
  LastVenue: string;
  Low: number;
  Low52Week: number;
  Low52WeekPriceDisplay: string;
  Low52WeekTimeStamp: string;
  LowPriceDisplay: string;
  MaxPrice: number;
  MaxPriceDisplay: string;
  MinMove: number;
  MinPrice: number;
  MinPriceDisplay: string;
  NameExt: string;
  NetChange: number;
  NetChangePct: number;
  Open: number;
  OpenPriceDisplay: string;
  PointValue: number;
  PreviousClose: number;
  PreviousClosePriceDisplay: string;
  PreviousVolume: number;
  Restrictions: string[];
  StrikePrice: number;
  StrikePriceDisplay: string;
  Symbol: string;
  SymbolRoot: string;
  TickSizeTier: number;
  TradeTime: string;
  Underlying: string;
  Volume: number;
  VWAP: number;
  VWAPDisplay: string;
} 