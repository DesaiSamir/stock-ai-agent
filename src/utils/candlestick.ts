import type {
  Candlestick,
  CandlestickUtils,
  CandlestickPatterns,
} from "@/types/candlestick";

let isPatternBullish = false;

export const candlestickUtils: CandlestickUtils = {
  bodyLen: (candlestick: Candlestick): number => {
    return Math.abs(candlestick.open - candlestick.close);
  },

  candleLen: (candlestick: Candlestick): number => {
    return Math.abs(candlestick.high - candlestick.low);
  },

  wickLen: (candlestick: Candlestick): number => {
    return candlestick.high - Math.max(candlestick.open, candlestick.close);
  },

  tailLen: (candlestick: Candlestick): number => {
    return Math.min(candlestick.open, candlestick.close) - candlestick.low;
  },

  isAboveAverageCandle: (candlestick: Candlestick): boolean => {
    return candlestickUtils.candleLen(candlestick) > (candlestick.atcr || 0);
  },

  isBullish: (candlestick: Candlestick): boolean => {
    return candlestick.open < candlestick.close;
  },

  isBearish: (candlestick: Candlestick): boolean => {
    return candlestick.open > candlestick.close;
  },

  isHammerLike: (candlestick: Candlestick): boolean => {
    return (
      candlestickUtils.tailLen(candlestick) >
        candlestickUtils.bodyLen(candlestick) * 2 &&
      candlestickUtils.wickLen(candlestick) <
        candlestickUtils.bodyLen(candlestick)
    );
  },

  isInvertedHammerLike: (candlestick: Candlestick): boolean => {
    return (
      candlestickUtils.wickLen(candlestick) >
        candlestickUtils.bodyLen(candlestick) * 2 &&
      candlestickUtils.tailLen(candlestick) <
        candlestickUtils.bodyLen(candlestick)
    );
  },

  isDoji: (candlestick: Candlestick): boolean => {
    return (
      !candlestickUtils.isHammerLike(candlestick) &&
      candlestickUtils.getCandleToBodyPercentValue(candlestick) < 30
    );
  },

  isGap: (lowest: Candlestick, upmost: Candlestick): boolean => {
    return (
      Math.max(lowest.open, lowest.close) < Math.min(upmost.open, upmost.close)
    );
  },

  isGapUp: (previous: Candlestick, current: Candlestick): boolean => {
    return candlestickUtils.isGap(previous, current);
  },

  isGapDown: (previous: Candlestick, current: Candlestick): boolean => {
    return (
      current.open < previous.close &&
      current.close < candlestickUtils.penetrationBodyPercentPrice(previous, 5)
    );
  },

  getCandleToBodyPercentValue: (candlestick: Candlestick): number => {
    return (
      (candlestickUtils.bodyLen(candlestick) * 100) /
      candlestickUtils.candleLen(candlestick)
    );
  },

  getCandlePercentValue: (
    candlestick: Candlestick,
    percent: number,
  ): number => {
    return (candlestickUtils.candleLen(candlestick) * percent) / 100;
  },

  penetrationCandlePercentPrice: (
    candlestick: Candlestick,
    percent: number,
  ): number => {
    const candlePercentPrice = candlestickUtils.getCandlePercentValue(
      candlestick,
      percent,
    );
    return candlestickUtils.isBullish(candlestick)
      ? candlestick.high - candlePercentPrice
      : candlestick.low + candlePercentPrice;
  },

  getBodyPercentValue: (candlestick: Candlestick, percent: number): number => {
    return (candlestickUtils.bodyLen(candlestick) * percent) / 100;
  },

  penetrationBodyPercentPrice: (
    candlestick: Candlestick,
    percent: number,
  ): number => {
    const bodyPercentPrice = candlestickUtils.getBodyPercentValue(
      candlestick,
      percent,
    );
    return candlestickUtils.isBullish(candlestick)
      ? candlestick.close - bodyPercentPrice
      : candlestick.close + bodyPercentPrice;
  },
};

// Helper function to find patterns in array
const findPattern = (
  dataArray: Candlestick[],
  callback: (...args: Candlestick[]) => boolean,
): Candlestick[][] => {
  const upperBound = dataArray.length - callback.length + 1;
  const matches: Candlestick[][] = [];
  const callbackName = callback.name;

  for (let i = 0; i < upperBound; i++) {
    const args: Candlestick[] = [];

    for (let j = 0; j < callback.length; j++) {
      args.push(dataArray[i + j]);
    }

    if (callback(...args)) {
      const lastCandle = dataArray[i + args.length - 1];
      lastCandle.patternType = isPatternBullish ? "bullish" : "bearish";
      lastCandle.pattern =
        (lastCandle.pattern || "") + callbackName.substring(2) + " ";

      dataArray[i].candle = 0;
      lastCandle.candle = 1;

      matches.push(args);
    }
  }

  return matches;
};

export const candlestickPatterns: CandlestickPatterns = {
  isHammer: (candlestick: Candlestick): boolean => {
    return (
      candlestickUtils.isBullish(candlestick) &&
      candlestickUtils.isHammerLike(candlestick)
    );
  },

  isInvertedHammer: (candlestick: Candlestick): boolean => {
    return (
      candlestickUtils.isBearish(candlestick) &&
      candlestickUtils.isInvertedHammerLike(candlestick)
    );
  },

  isHangingMan: (previous: Candlestick, current: Candlestick): boolean => {
    return (
      candlestickUtils.isBullish(previous) &&
      candlestickUtils.isBearish(current) &&
      candlestickUtils.isGapUp(previous, current) &&
      candlestickUtils.isHammerLike(current)
    );
  },

  isShootingStar: (
    previous: Candlestick,
    middle: Candlestick,
    current: Candlestick,
  ): boolean => {
    return (
      candlestickUtils.isBullish(previous) &&
      candlestickUtils.isBearish(middle) &&
      candlestickUtils.isGapUp(previous, middle) &&
      (candlestickUtils.isInvertedHammerLike(middle) ||
        candlestickUtils.isDoji(middle)) &&
      current.close < middle.close &&
      !candlestickUtils.isDoji(current)
    );
  },

  isMorningStar: (
    previous: Candlestick,
    middle: Candlestick,
    current: Candlestick,
  ): boolean => {
    const currCloseInUpperHalf =
      current.close >=
      candlestickUtils.penetrationBodyPercentPrice(previous, 50);
    return (
      candlestickUtils.isBearish(previous) &&
      candlestickUtils.isBullish(current) &&
      candlestickUtils.isGapDown(previous, middle) &&
      (candlestickUtils.isHammerLike(middle) ||
        candlestickUtils.isDoji(middle)) &&
      current.close > middle.close &&
      middle.high < previous.close &&
      !candlestickUtils.isDoji(current) &&
      currCloseInUpperHalf
    );
  },

  isPotentialMorningStar: (
    previous: Candlestick,
    current: Candlestick,
  ): boolean => {
    return (
      candlestickUtils.isBearish(previous) &&
      candlestickUtils.isGapDown(previous, current) &&
      current.high < previous.close &&
      (candlestickUtils.isHammerLike(current) ||
        candlestickUtils.isDoji(current))
    );
  },

  isBullishEngulfing: (
    previous: Candlestick,
    current: Candlestick,
  ): boolean => {
    return (
      candlestickUtils.isBearish(previous) &&
      candlestickUtils.isBullish(current) &&
      current.open <= previous.close &&
      current.close >= previous.open &&
      current.volume >= previous.volume
    );
  },

  isBearishEngulfing: (
    previous: Candlestick,
    current: Candlestick,
  ): boolean => {
    return (
      candlestickUtils.isBullish(previous) &&
      candlestickUtils.isBearish(current) &&
      current.open >= previous.close &&
      current.close <= previous.open &&
      current.volume >= previous.volume
    );
  },

  isBuySetup: (
    first: Candlestick,
    second: Candlestick,
    third: Candlestick,
    current: Candlestick,
  ): boolean => {
    return (
      candlestickUtils.isBearish(first) &&
      candlestickUtils.isBearish(second) &&
      second.high < first.high &&
      second.low < first.low &&
      candlestickUtils.isBearish(third) &&
      third.high < second.high &&
      third.low < second.low &&
      candlestickUtils.isBullish(current)
    );
  },

  isThreeBarPlayBullish: (
    first: Candlestick,
    previous: Candlestick,
    current: Candlestick,
  ): boolean => {
    return (
      candlestickUtils.isBullish(previous) &&
      candlestickUtils.isAboveAverageCandle(previous) &&
      candlestickUtils.isBearish(first) &&
      current.low >
        candlestickUtils.penetrationCandlePercentPrice(previous, 50) &&
      current.high >
        candlestickUtils.penetrationCandlePercentPrice(previous, 10) &&
      current.high <
        candlestickUtils.penetrationCandlePercentPrice(previous, -5)
    );
  },

  isThreeBarPlayBearish: (
    previous: Candlestick,
    current: Candlestick,
  ): boolean => {
    return (
      candlestickUtils.isBearish(previous) &&
      candlestickUtils.isAboveAverageCandle(previous) &&
      current.high <
        candlestickUtils.penetrationCandlePercentPrice(previous, 50) &&
      current.low <
        candlestickUtils.penetrationCandlePercentPrice(previous, 10) &&
      current.low > candlestickUtils.penetrationCandlePercentPrice(previous, -5)
    );
  },

  isBullishHarami: (previous: Candlestick, current: Candlestick): boolean => {
    const currOpenInLowerHalf =
      current.open <=
      candlestickUtils.penetrationBodyPercentPrice(previous, 40);
    return (
      candlestickUtils.isBearish(previous) &&
      candlestickUtils.isBullish(current) &&
      current.high <= previous.high &&
      current.low >= previous.low &&
      currOpenInLowerHalf
    );
  },

  isBearishHarami: (previous: Candlestick, current: Candlestick): boolean => {
    const currOpenInUpperHalf =
      current.open >=
      candlestickUtils.penetrationBodyPercentPrice(previous, 40);
    const currCloseInLowerHalf =
      current.close <=
      candlestickUtils.penetrationBodyPercentPrice(previous, 40);
    return (
      candlestickUtils.isBullish(previous) &&
      candlestickUtils.isBearish(current) &&
      current.high <= previous.high &&
      current.low >= previous.low &&
      currOpenInUpperHalf &&
      currCloseInLowerHalf
    );
  },

  isBullishKicker: (previous: Candlestick, current: Candlestick): boolean => {
    return (
      candlestickUtils.isBearish(previous) &&
      candlestickUtils.isBullish(current) &&
      candlestickUtils.isGapUp(previous, current)
    );
  },

  isBearishKicker: (previous: Candlestick, current: Candlestick): boolean => {
    return (
      candlestickUtils.isBullish(previous) &&
      candlestickUtils.isBearish(current) &&
      candlestickUtils.isGapDown(previous, current)
    );
  },

  isNear200SMA: (previous: Candlestick, current: Candlestick): boolean => {
    isPatternBullish = true;
    return (
      (Math.abs(current.sma200highPct || 0) < 1 ||
        Math.abs(current.sma200lowPct || 0) < 1) &&
      current.close > (current.sma200 || 0) &&
      current.close > previous.close
    );
  },

  isBullishSqueezeAlert: (
    first: Candlestick,
    second: Candlestick,
    third: Candlestick,
  ): boolean => {
    isPatternBullish = true;
    return (
      candlestickUtils.isBearish(first) &&
      second.low > first.low &&
      second.high < first.high &&
      Math.max(second.open, second.close) <= first.open &&
      Math.min(second.close, second.open) >= first.close &&
      third.low > second.low &&
      third.high < second.high &&
      Math.max(third.open, third.close) <=
        Math.max(second.open, second.close) &&
      Math.min(third.close, third.open) >= Math.min(second.close, second.open)
    );
  },

  isPotentialBullishEngulfing: (
    previous: Candlestick,
    current: Candlestick,
  ): boolean => {
    return (
      candlestickUtils.isBearish(previous) &&
      candlestickUtils.isBullish(current) &&
      current.open <= previous.close &&
      current.close >= previous.open &&
      current.volume < previous.volume
    );
  },
};

// Pattern finder functions that use findPattern
export const patternFinders = {
  hammer: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = true;
    return findPattern(dataArray, candlestickPatterns.isHammer);
  },

  invertedHammer: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = false;
    return findPattern(dataArray, candlestickPatterns.isInvertedHammer);
  },

  hangingMan: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = false;
    return findPattern(dataArray, candlestickPatterns.isHangingMan);
  },

  shootingStar: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = false;
    return findPattern(dataArray, candlestickPatterns.isShootingStar);
  },

  morningStar: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = true;
    return findPattern(dataArray, candlestickPatterns.isMorningStar);
  },

  potentialMorningStar: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = true;
    return findPattern(dataArray, candlestickPatterns.isPotentialMorningStar);
  },

  bullishEngulfing: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = true;
    return findPattern(dataArray, candlestickPatterns.isBullishEngulfing);
  },

  potentialBullishEngulfing: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = true;
    return findPattern(
      dataArray,
      candlestickPatterns.isPotentialBullishEngulfing,
    );
  },

  bearishEngulfing: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = false;
    return findPattern(dataArray, candlestickPatterns.isBearishEngulfing);
  },

  threeBarPlayBullish: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = true;
    return findPattern(dataArray, candlestickPatterns.isThreeBarPlayBullish);
  },

  threeBarPlayBearish: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = false;
    return findPattern(dataArray, candlestickPatterns.isThreeBarPlayBearish);
  },

  bullishHarami: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = true;
    return findPattern(dataArray, candlestickPatterns.isBullishHarami);
  },

  bearishHarami: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = false;
    return findPattern(dataArray, candlestickPatterns.isBearishHarami);
  },

  buySetup: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = true;
    return findPattern(dataArray, candlestickPatterns.isBuySetup);
  },

  bullishKicker: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = true;
    return findPattern(dataArray, candlestickPatterns.isBullishKicker);
  },

  bearishKicker: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = false;
    return findPattern(dataArray, candlestickPatterns.isBearishKicker);
  },

  near200SMA: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = true;
    return findPattern(dataArray, candlestickPatterns.isNear200SMA);
  },

  bullishSqueezeAlert: (dataArray: Candlestick[]): Candlestick[][] => {
    isPatternBullish = true;
    return findPattern(dataArray, candlestickPatterns.isBullishSqueezeAlert);
  },
};
