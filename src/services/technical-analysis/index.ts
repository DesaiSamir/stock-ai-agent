import { Candlestick } from "@/types/candlestick";
import { logger } from "@/utils/logger";

export interface TechnicalIndicators {
  sma: {
    sma9: number;
    sma20: number;
    sma50: number;
    sma100: number;
    sma200: number;
  };
  ema: {
    ema9: number;
    ema20: number;
    ema50: number;
  };
  rsi: {
    value: number;
    period: number;
    isOverbought: boolean;
    isOversold: boolean;
  };
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    crossover: 'BULLISH' | 'BEARISH' | 'NONE';
  };
  atr: {
    value: number;
    period: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    percentB: number;
  };
  stochastic: {
    k: number;
    d: number;
    isOverbought: boolean;
    isOversold: boolean;
  };
}

export interface TrendAnalysis {
  primaryTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number; // 0-1
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  priceLocation: {
    aboveMA200: boolean;
    aboveMA50: boolean;
    distanceFromMA200: number; // percentage
    distanceFromMA50: number; // percentage
  };
}

export interface VolumeAnalysis {
  averageVolume: number;
  relativeVolume: number;
  volumeTrend: 'INCREASING' | 'DECREASING' | 'NEUTRAL';
  isHighVolume: boolean;
  volumeSpikes: {
    timestamp: string;
    multiplier: number;
  }[];
}

export class TechnicalAnalysisService {
  private static instance: TechnicalAnalysisService;

  private constructor() {}

  public static getInstance(): TechnicalAnalysisService {
    if (!TechnicalAnalysisService.instance) {
      TechnicalAnalysisService.instance = new TechnicalAnalysisService();
    }
    return TechnicalAnalysisService.instance;
  }

  public calculateAllIndicators(data: Candlestick[]): TechnicalIndicators {
    try {
      return {
        sma: this.calculateAllSMAs(data),
        ema: this.calculateAllEMAs(data),
        rsi: this.calculateRSI(data),
        macd: this.calculateMACD(data),
        atr: this.calculateATR(data),
        bollingerBands: this.calculateBollingerBands(data),
        stochastic: this.calculateStochastic(data)
      };
    } catch (error) {
      logger.error({ message: 'Error calculating technical indicators', error: error as Error });
      throw error;
    }
  }

  public analyzeTrend(data: Candlestick[], indicators: TechnicalIndicators): TrendAnalysis {
    try {
      const currentPrice = data[data.length - 1].close;
      const { support, resistance } = this.findKeyLevels(data);

      return {
        primaryTrend: this.determinePrimaryTrend(data, indicators),
        strength: this.calculateTrendStrength(data, indicators),
        keyLevels: {
          support,
          resistance
        },
        priceLocation: {
          aboveMA200: currentPrice > indicators.sma.sma200,
          aboveMA50: currentPrice > indicators.sma.sma50,
          distanceFromMA200: ((currentPrice - indicators.sma.sma200) / indicators.sma.sma200) * 100,
          distanceFromMA50: ((currentPrice - indicators.sma.sma50) / indicators.sma.sma50) * 100
        }
      };
    } catch (error) {
      logger.error({ message: 'Error analyzing trend', error: error as Error });
      throw error;
    }
  }

  public analyzeVolume(data: Candlestick[]): VolumeAnalysis {
    try {
      const recentVolumes = data.slice(-20).map(d => d.volume);
      const averageVolume = this.calculateAverage(recentVolumes);
      const currentVolume = data[data.length - 1].volume;
      const volumeSpikes = this.findVolumeSpikes(data, averageVolume);

      return {
        averageVolume,
        relativeVolume: currentVolume / averageVolume,
        volumeTrend: this.determineVolumeTrend(data),
        isHighVolume: currentVolume > averageVolume * 1.5,
        volumeSpikes
      };
    } catch (error) {
      logger.error({ message: 'Error analyzing volume', error: error as Error });
      throw error;
    }
  }

  private calculateAllSMAs(data: Candlestick[]): TechnicalIndicators['sma'] {
    return {
      sma9: this.calculateSMA(data, 9),
      sma20: this.calculateSMA(data, 20),
      sma50: this.calculateSMA(data, 50),
      sma100: this.calculateSMA(data, 100),
      sma200: this.calculateSMA(data, 200)
    };
  }

  private calculateAllEMAs(data: Candlestick[]): TechnicalIndicators['ema'] {
    return {
      ema9: this.calculateEMA(data, 9),
      ema20: this.calculateEMA(data, 20),
      ema50: this.calculateEMA(data, 50)
    };
  }

  private calculateSMA(data: Candlestick[], period: number): number {
    if (data.length < period) return 0;
    const prices = data.slice(-period).map(d => d.close);
    return this.calculateAverage(prices);
  }

  private calculateEMA(data: Candlestick[], period: number): number {
    if (data.length < period) return 0;
    const prices = data.map(d => d.close);
    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  private calculateRSI(data: Candlestick[]): TechnicalIndicators['rsi'] {
    const period = 14;
    if (data.length < period + 1) {
      return { value: 50, period, isOverbought: false, isOversold: false };
    }

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change >= 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI using Wilder's smoothing method
    for (let i = period + 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change >= 0) {
        avgGain = (avgGain * 13 + change) / period;
        avgLoss = (avgLoss * 13) / period;
      } else {
        avgGain = (avgGain * 13) / period;
        avgLoss = (avgLoss * 13 - change) / period;
      }
    }

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return {
      value: rsi,
      period,
      isOverbought: rsi > 70,
      isOversold: rsi < 30
    };
  }

  private calculateMACD(data: Candlestick[]): TechnicalIndicators['macd'] {
    const ema12 = this.calculateEMA(data, 12);
    const ema26 = this.calculateEMA(data, 26);
    const macdLine = ema12 - ema26;
    const signalLine = this.calculateEMA(data.slice(-9), 9); // 9-day EMA of MACD
    const histogram = macdLine - signalLine;

    let crossover: 'BULLISH' | 'BEARISH' | 'NONE' = 'NONE';
    if (histogram > 0 && histogram > 0) {
      crossover = 'BULLISH';
    } else if (histogram < 0 && histogram < 0) {
      crossover = 'BEARISH';
    }

    return {
      macdLine,
      signalLine,
      histogram,
      crossover
    };
  }

  private calculateATR(data: Candlestick[]): TechnicalIndicators['atr'] {
    const period = 14;
    if (data.length < period) {
      return { value: 0, period };
    }

    const trueRanges: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevClose = data[i - 1].close;
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    const atr = this.calculateAverage(trueRanges.slice(-period));
    return { value: atr, period };
  }

  private calculateBollingerBands(data: Candlestick[]): TechnicalIndicators['bollingerBands'] {
    const period = 20;
    const stdDevMultiplier = 2;
    
    if (data.length < period) {
      return { upper: 0, middle: 0, lower: 0, bandwidth: 0, percentB: 0 };
    }

    const prices = data.slice(-period).map(d => d.close);
    const sma = this.calculateAverage(prices);
    const stdDev = this.calculateStandardDeviation(prices);

    const upper = sma + (stdDev * stdDevMultiplier);
    const lower = sma - (stdDev * stdDevMultiplier);
    const bandwidth = (upper - lower) / sma;
    const currentPrice = data[data.length - 1].close;
    const percentB = (currentPrice - lower) / (upper - lower);

    return {
      upper,
      middle: sma,
      lower,
      bandwidth,
      percentB
    };
  }

  private calculateStochastic(data: Candlestick[]): TechnicalIndicators['stochastic'] {
    const period = 14;
    if (data.length < period) {
      return { k: 50, d: 50, isOverbought: false, isOversold: false };
    }

    const recentData = data.slice(-period);
    const currentClose = recentData[recentData.length - 1].close;
    const lowestLow = Math.min(...recentData.map(d => d.low));
    const highestHigh = Math.max(...recentData.map(d => d.high));

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    const d = this.calculateSMA(data.slice(-3), 3); // 3-day SMA of %K

    return {
      k,
      d,
      isOverbought: k > 80,
      isOversold: k < 20
    };
  }

  private findKeyLevels(data: Candlestick[]): { support: number[], resistance: number[] } {
    const prices = data.map(d => ({ high: d.high, low: d.low }));
    const supportLevels: number[] = [];
    const resistanceLevels: number[] = [];
    
    // Find local minima/maxima
    for (let i = 2; i < prices.length - 2; i++) {
      // Support level - local minimum
      if (prices[i].low < prices[i-1].low && 
          prices[i].low < prices[i-2].low &&
          prices[i].low < prices[i+1].low && 
          prices[i].low < prices[i+2].low) {
        supportLevels.push(prices[i].low);
      }
      
      // Resistance level - local maximum
      if (prices[i].high > prices[i-1].high && 
          prices[i].high > prices[i-2].high &&
          prices[i].high > prices[i+1].high && 
          prices[i].high > prices[i+2].high) {
        resistanceLevels.push(prices[i].high);
      }
    }
    
    // Remove duplicates and sort
    return {
      support: [...new Set(supportLevels)].sort((a, b) => a - b),
      resistance: [...new Set(resistanceLevels)].sort((a, b) => a - b)
    };
  }

  private determinePrimaryTrend(
    data: Candlestick[],
    indicators: TechnicalIndicators
  ): TrendAnalysis['primaryTrend'] {
    const currentPrice = data[data.length - 1].close;
    const { sma, macd, rsi } = indicators;

    // Strong trend conditions
    const aboveAllSMAs = currentPrice > sma.sma20 && currentPrice > sma.sma50 && currentPrice > sma.sma200;
    const belowAllSMAs = currentPrice < sma.sma20 && currentPrice < sma.sma50 && currentPrice < sma.sma200;

    if (aboveAllSMAs && macd.crossover === 'BULLISH' && !rsi.isOverbought) {
      return 'BULLISH';
    } else if (belowAllSMAs && macd.crossover === 'BEARISH' && !rsi.isOversold) {
      return 'BEARISH';
    }

    return 'NEUTRAL';
  }

  private calculateTrendStrength(
    data: Candlestick[],
    indicators: TechnicalIndicators
  ): number {
    const currentPrice = data[data.length - 1].close;
    const { sma, rsi, macd } = indicators;

    let strength = 0.5; // Base strength

    // Price relative to moving averages
    if (currentPrice > sma.sma200) strength += 0.1;
    if (currentPrice > sma.sma50) strength += 0.1;
    if (currentPrice > sma.sma20) strength += 0.1;

    // RSI
    if (rsi.value > 60) strength += 0.1;
    if (rsi.value < 40) strength -= 0.1;

    // MACD
    if (macd.crossover === 'BULLISH') strength += 0.1;
    if (macd.crossover === 'BEARISH') strength -= 0.1;

    return Math.max(0, Math.min(1, strength));
  }

  private findVolumeSpikes(data: Candlestick[], averageVolume: number): VolumeAnalysis['volumeSpikes'] {
    return data
      .filter(d => d.volume > averageVolume * 2)
      .map(d => ({
        timestamp: d.date,
        multiplier: d.volume / averageVolume
      }))
      .sort((a, b) => b.multiplier - a.multiplier)
      .slice(0, 5); // Return top 5 spikes
  }

  private determineVolumeTrend(data: Candlestick[]): VolumeAnalysis['volumeTrend'] {
    const recentVolumes = data.slice(-5).map(d => d.volume);
    const olderVolumes = data.slice(-10, -5).map(d => d.volume);
    
    const recentAvg = this.calculateAverage(recentVolumes);
    const olderAvg = this.calculateAverage(olderVolumes);
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 10) return 'INCREASING';
    if (change < -10) return 'DECREASING';
    return 'NEUTRAL';
  }

  private calculateAverage(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateStandardDeviation(values: number[]): number {
    const avg = this.calculateAverage(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = this.calculateAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }
} 