import type {
  Candlestick,
  TimeUnit,
  PatternDetector,
} from "@/types/candlestick";
import { patternFinders } from "@/utils/candlestick";

class PatternDetectorService implements PatternDetector {
  detectPattern(candles: Candlestick[], unit: TimeUnit): Candlestick[] {
    // Reset any existing patterns
    candles.forEach((candle) => {
      candle.pattern = "";
      candle.patternType = undefined;
      candle.candle = undefined;
    });

    // Find all patterns
    patternFinders.bullishEngulfing(candles);
    patternFinders.threeBarPlayBullish(candles);
    patternFinders.bullishHarami(candles);
    patternFinders.hangingMan(candles);
    patternFinders.morningStar(candles);
    patternFinders.buySetup(candles);
    patternFinders.bullishSqueezeAlert(candles);

    if (unit !== "Minute") {
      patternFinders.near200SMA(candles);
    }

    return candles;
  }
}

// Export singleton instance
export const patternDetector = new PatternDetectorService();
