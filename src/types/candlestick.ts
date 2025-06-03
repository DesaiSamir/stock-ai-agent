export interface Candlestick {
  symbol: string;
  date: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma200?: number;
  sma200highPct?: number;
  sma200lowPct?: number;
  atbr?: number;
  atcr?: number;
  mxbr?: number;
  mxcr?: number;
  pattern?: string;
  patternType?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  candle?: 'DOJI' | 'HAMMER' | 'SHOOTING_STAR' | 'ENGULFING' | 'HARAMI';
  price: number;
  index?: number;
  ema12?: number;
  ema26?: number;
  ema200?: number;
}

export type TimeUnit = "Minute" | "Hour" | "Day" | "Week" | "Month";

export interface CandlestickUtils {
  bodyLen: (candlestick: Candlestick) => number;
  candleLen: (candlestick: Candlestick) => number;
  wickLen: (candlestick: Candlestick) => number;
  tailLen: (candlestick: Candlestick) => number;
  isAboveAverageCandle: (candlestick: Candlestick) => boolean;
  isBullish: (candlestick: Candlestick) => boolean;
  isBearish: (candlestick: Candlestick) => boolean;
  isHammerLike: (candlestick: Candlestick) => boolean;
  isInvertedHammerLike: (candlestick: Candlestick) => boolean;
  isDoji: (candlestick: Candlestick) => boolean;
  isGap: (lowest: Candlestick, upmost: Candlestick) => boolean;
  isGapUp: (previous: Candlestick, current: Candlestick) => boolean;
  isGapDown: (previous: Candlestick, current: Candlestick) => boolean;
  getCandleToBodyPercentValue: (candlestick: Candlestick) => number;
  getCandlePercentValue: (candlestick: Candlestick, percent: number) => number;
  penetrationCandlePercentPrice: (
    candlestick: Candlestick,
    percent: number,
  ) => number;
  getBodyPercentValue: (candlestick: Candlestick, percent: number) => number;
  penetrationBodyPercentPrice: (
    candlestick: Candlestick,
    percent: number,
  ) => number;
}

export interface CandlestickPatterns {
  isHammer: (candlestick: Candlestick) => boolean;
  isInvertedHammer: (candlestick: Candlestick) => boolean;
  isHangingMan: (previous: Candlestick, current: Candlestick) => boolean;
  isShootingStar: (
    previous: Candlestick,
    middle: Candlestick,
    current: Candlestick,
  ) => boolean;
  isMorningStar: (
    previous: Candlestick,
    middle: Candlestick,
    current: Candlestick,
  ) => boolean;
  isPotentialMorningStar: (
    previous: Candlestick,
    current: Candlestick,
  ) => boolean;
  isBullishEngulfing: (previous: Candlestick, current: Candlestick) => boolean;
  isPotentialBullishEngulfing: (
    previous: Candlestick,
    current: Candlestick,
  ) => boolean;
  isBearishEngulfing: (previous: Candlestick, current: Candlestick) => boolean;
  isBuySetup: (
    first: Candlestick,
    second: Candlestick,
    third: Candlestick,
    current: Candlestick,
  ) => boolean;
  isThreeBarPlayBullish: (
    first: Candlestick,
    previous: Candlestick,
    current: Candlestick,
  ) => boolean;
  isThreeBarPlayBearish: (
    previous: Candlestick,
    current: Candlestick,
  ) => boolean;
  isBullishHarami: (previous: Candlestick, current: Candlestick) => boolean;
  isBearishHarami: (previous: Candlestick, current: Candlestick) => boolean;
  isBullishKicker: (previous: Candlestick, current: Candlestick) => boolean;
  isBearishKicker: (previous: Candlestick, current: Candlestick) => boolean;
  isNear200SMA: (previous: Candlestick, current: Candlestick) => boolean;
  isBullishSqueezeAlert: (
    first: Candlestick,
    second: Candlestick,
    third: Candlestick,
  ) => boolean;
}

export interface PatternDetector {
  detectPattern: (candles: Candlestick[], unit: TimeUnit) => Candlestick[];
}
