import { Candlestick } from "@/types/candlestick";

class PatternDetector {
  private static instance: PatternDetector;

  private constructor() {}

  public static getInstance(): PatternDetector {
    if (!PatternDetector.instance) {
      PatternDetector.instance = new PatternDetector();
    }
    return PatternDetector.instance;
  }

  public detectPattern(data: Candlestick[]): Candlestick[] {
    const enrichedData = [...data];
    
    for (let i = 2; i < data.length; i++) {
      const current = data[i];
      const prev = data[i - 1];

      // Detect patterns
      const pattern = this.detectSinglePattern(current, prev);
      if (pattern) {
        enrichedData[i] = {
          ...current,
          ...pattern
        };
      }
    }

    return enrichedData;
  }

  private detectSinglePattern(
    current: Candlestick,
    prev: Candlestick
  ): { pattern: string; patternType: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; candle?: Candlestick['candle'] } | null {
    // Doji
    if (this.isDoji(current)) {
      return {
        pattern: 'Doji',
        patternType: 'NEUTRAL',
        candle: 'DOJI'
      };
    }

    // Hammer
    if (this.isHammer(current)) {
      return {
        pattern: 'Hammer',
        patternType: 'BULLISH',
        candle: 'HAMMER'
      };
    }

    // Shooting Star
    if (this.isShootingStar(current)) {
      return {
        pattern: 'Shooting Star',
        patternType: 'BEARISH',
        candle: 'SHOOTING_STAR'
      };
    }

    // Bullish Engulfing
    if (this.isBullishEngulfing(current, prev)) {
      return {
        pattern: 'Bullish Engulfing',
        patternType: 'BULLISH',
        candle: 'ENGULFING'
      };
    }

    // Bearish Engulfing
    if (this.isBearishEngulfing(current, prev)) {
      return {
        pattern: 'Bearish Engulfing',
        patternType: 'BEARISH',
        candle: 'ENGULFING'
      };
    }

    // Bullish Harami
    if (this.isBullishHarami(current, prev)) {
      return {
        pattern: 'Bullish Harami',
        patternType: 'BULLISH',
        candle: 'HARAMI'
      };
    }

    // Bearish Harami
    if (this.isBearishHarami(current, prev)) {
      return {
        pattern: 'Bearish Harami',
        patternType: 'BEARISH',
        candle: 'HARAMI'
      };
    }

    return null;
  }

  private isDoji(candle: Candlestick): boolean {
    const bodySize = Math.abs(candle.open - candle.close);
    const totalSize = candle.high - candle.low;
    return bodySize / totalSize < 0.1; // Body is less than 10% of total size
  }

  private isHammer(candle: Candlestick): boolean {
    const bodySize = Math.abs(candle.open - candle.close);
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    
    return (
      lowerShadow > bodySize * 2 && // Lower shadow is at least 2x body
      upperShadow < bodySize * 0.5 && // Upper shadow is less than half body
      bodySize > 0 // Not a doji
    );
  }

  private isShootingStar(candle: Candlestick): boolean {
    const bodySize = Math.abs(candle.open - candle.close);
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    
    return (
      upperShadow > bodySize * 2 && // Upper shadow is at least 2x body
      lowerShadow < bodySize * 0.5 && // Lower shadow is less than half body
      bodySize > 0 // Not a doji
    );
  }

  private isBullishEngulfing(current: Candlestick, prev: Candlestick): boolean {
    return (
      current.close > current.open && // Current is bullish
      prev.close < prev.open && // Previous is bearish
      current.open < prev.close && // Opens below previous close
      current.close > prev.open // Closes above previous open
    );
  }

  private isBearishEngulfing(current: Candlestick, prev: Candlestick): boolean {
    return (
      current.close < current.open && // Current is bearish
      prev.close > prev.open && // Previous is bullish
      current.open > prev.close && // Opens above previous close
      current.close < prev.open // Closes below previous open
    );
  }

  private isBullishHarami(current: Candlestick, prev: Candlestick): boolean {
    return (
      current.close > current.open && // Current is bullish
      prev.close < prev.open && // Previous is bearish
      current.open > prev.close && // Opens above previous close
      current.close < prev.open // Closes below previous open
    );
    }

  private isBearishHarami(current: Candlestick, prev: Candlestick): boolean {
    return (
      current.close < current.open && // Current is bearish
      prev.close > prev.open && // Previous is bullish
      current.open < prev.close && // Opens below previous close
      current.close > prev.open // Closes above previous open
    );
  }
}

export const patternDetector = PatternDetector.getInstance();
