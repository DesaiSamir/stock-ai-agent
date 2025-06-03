import { Candlestick } from "@/types/candlestick";
import { logger } from "@/utils/logger";

export interface VolatilityMetrics {
  historicalVolatility: number;
  averageTrueRange: number;
  priceSwingPercentage: number;
}

export interface TechnicalIndicators {
  trendStrength: number;
  supportLevels: number[];
  resistanceLevels: number[];
  volumeProfile: {
    trend: 'INCREASING' | 'DECREASING' | 'NEUTRAL';
    averageVolume: number;
    volumeChange: number;
  };
}

export interface PositionRiskMetrics {
  maxPositionSize: number;
  riskPerTrade: number;
  suggestedLeverage: number;
  portfolioHeatmap: {
    currentExposure: number;
    sectorExposure: number;
    correlationRisk: number;
  };
}

export interface RiskAssessmentParams {
  marketData: Candlestick[];
  symbol: string;
  entryPrice: number;
  positionSize: number;
  accountBalance?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export class RiskAssessmentService {
  private static instance: RiskAssessmentService;

  private constructor() {}

  public static getInstance(): RiskAssessmentService {
    if (!RiskAssessmentService.instance) {
      RiskAssessmentService.instance = new RiskAssessmentService();
    }
    return RiskAssessmentService.instance;
  }

  public calculateVolatilityMetrics(marketData: Candlestick[]): VolatilityMetrics {
    try {
      // Calculate returns
      const returns = this.calculateReturns(marketData);
      
      // Calculate historical volatility (standard deviation of returns)
      const historicalVolatility = this.calculateStandardDeviation(returns);
      
      // Calculate ATR
      const atr = this.calculateATR(marketData);
      
      // Calculate price swing
      const priceSwing = this.calculatePriceSwing(marketData);

      return {
        historicalVolatility,
        averageTrueRange: atr,
        priceSwingPercentage: priceSwing
      };
    } catch (error) {
      logger.error({ message: 'Error calculating volatility metrics', error: error as Error });
      throw error;
    }
  }

  public analyzeTechnicalIndicators(marketData: Candlestick[]): TechnicalIndicators {
    try {
      // Calculate trend strength using moving averages
      const trendStrength = this.calculateTrendStrength(marketData);
      
      // Find support and resistance levels
      const { supportLevels, resistanceLevels } = this.findPriceLevels(marketData);
      
      // Analyze volume profile
      const volumeProfile = this.analyzeVolume(marketData);

      return {
        trendStrength,
        supportLevels,
        resistanceLevels,
        volumeProfile
      };
    } catch (error) {
      logger.error({ message: 'Error analyzing technical indicators', error: error as Error });
      throw error;
    }
  }

  public calculatePositionRisk(params: RiskAssessmentParams): PositionRiskMetrics {
    try {
      const { marketData, accountBalance } = params;
      
      // Calculate position sizing using Kelly Criterion
      const maxSize = this.calculateMaxPositionSize(marketData, accountBalance);
      
      // Calculate risk per trade
      const riskPerTrade = this.calculateRiskPerTrade(params);
      
      // Determine suggested leverage
      const suggestedLeverage = this.calculateSuggestedLeverage(params);
      
      // Analyze portfolio risk
      const portfolioHeatmap = this.analyzePortfolioRisk(params);

      return {
        maxPositionSize: maxSize,
        riskPerTrade,
        suggestedLeverage,
        portfolioHeatmap
      };
    } catch (error) {
      logger.error({ message: 'Error calculating position risk', error: error as Error });
      throw error;
    }
  }

  private calculateReturns(marketData: Candlestick[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < marketData.length; i++) {
      const prevClose = marketData[i - 1].close;
      const currentClose = marketData[i].close;
      returns.push((currentClose - prevClose) / prevClose);
    }
    return returns;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateATR(marketData: Candlestick[]): number {
    const period = 14; // Standard ATR period
    const trueRanges: number[] = [];
    
    for (let i = 1; i < marketData.length; i++) {
      const high = marketData[i].high;
      const low = marketData[i].low;
      const prevClose = marketData[i - 1].close;
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    // Calculate simple moving average of true ranges
    return trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
  }

  private calculatePriceSwing(marketData: Candlestick[]): number {
    const recentData = marketData.slice(-20); // Look at last 20 periods
    const highs = recentData.map(d => d.high);
    const lows = recentData.map(d => d.low);
    
    const highest = Math.max(...highs);
    const lowest = Math.min(...lows);
    
    return ((highest - lowest) / lowest) * 100;
  }

  private calculateTrendStrength(marketData: Candlestick[]): number {
    // Calculate 20-day and 50-day moving averages
    const ma20 = this.calculateSMA(marketData, 20);
    const ma50 = this.calculateSMA(marketData, 50);
    
    // Trend strength is ratio of current price to moving averages
    const currentPrice = marketData[marketData.length - 1].close;
    const strength = (currentPrice / ma20 + currentPrice / ma50) / 2;
    
    return strength;
  }

  private calculateSMA(marketData: Candlestick[], period: number): number {
    const prices = marketData.slice(-period).map(d => d.close);
    return prices.reduce((sum, price) => sum + price, 0) / period;
  }

  private findPriceLevels(marketData: Candlestick[]): { supportLevels: number[], resistanceLevels: number[] } {
    const prices = marketData.map(d => ({ high: d.high, low: d.low }));
    const supportLevels: number[] = [];
    const resistanceLevels: number[] = [];
    
    // Simple implementation - find local minima/maxima
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
    
    return { 
      supportLevels: [...new Set(supportLevels)].sort((a, b) => a - b),
      resistanceLevels: [...new Set(resistanceLevels)].sort((a, b) => a - b)
    };
  }

  private analyzeVolume(marketData: Candlestick[]): TechnicalIndicators['volumeProfile'] {
    const volumes = marketData.map(d => d.volume);
    const recentVolumes = volumes.slice(-5);
    const historicalVolumes = volumes.slice(-20, -5);
    
    const averageVolume = this.calculateSMA(marketData, 20);
    const recentAvgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
    const historicalAvgVolume = historicalVolumes.reduce((sum, vol) => sum + vol, 0) / historicalVolumes.length;
    
    const volumeChange = ((recentAvgVolume - historicalAvgVolume) / historicalAvgVolume) * 100;
    
    let trend: 'INCREASING' | 'DECREASING' | 'NEUTRAL';
    if (volumeChange > 10) trend = 'INCREASING';
    else if (volumeChange < -10) trend = 'DECREASING';
    else trend = 'NEUTRAL';
    
    return {
      trend,
      averageVolume,
      volumeChange
    };
  }

  private calculateMaxPositionSize(marketData: Candlestick[], accountBalance?: number): number {
    if (!accountBalance) return 0;
    
    // Using Kelly Criterion for position sizing
    const returns = this.calculateReturns(marketData);
    const winRate = returns.filter(r => r > 0).length / returns.length;
    const avgWin = returns.filter(r => r > 0).reduce((sum, r) => sum + r, 0) / returns.filter(r => r > 0).length;
    const avgLoss = Math.abs(returns.filter(r => r < 0).reduce((sum, r) => sum + r, 0) / returns.filter(r => r < 0).length);
    
    const kellyFraction = (winRate / avgLoss) - ((1 - winRate) / avgWin);
    const maxSize = accountBalance * Math.max(0, Math.min(kellyFraction, 0.25)); // Cap at 25%
    
    return maxSize;
  }

  private calculateRiskPerTrade(params: RiskAssessmentParams): number {
    const { entryPrice, stopLoss, positionSize } = params;
    if (!stopLoss) return 0;
    
    return (entryPrice - stopLoss) * positionSize;
  }

  private calculateSuggestedLeverage(params: RiskAssessmentParams): number {
    const volatility = this.calculateVolatilityMetrics(params.marketData);
    
    // Base leverage on volatility - higher volatility = lower leverage
    const baseLeverage = 3; // Max leverage
    const volatilityAdjustment = Math.max(0, 1 - volatility.historicalVolatility);
    
    return Math.max(1, baseLeverage * volatilityAdjustment);
  }

  private analyzePortfolioRisk(params: RiskAssessmentParams): PositionRiskMetrics['portfolioHeatmap'] {
    // TODO: Implement portfolio risk analysis
    // This would typically require portfolio data and sector information
    return {
      currentExposure: params.positionSize / (params.accountBalance || params.positionSize),
      sectorExposure: 0, // Would need sector data
      correlationRisk: 0  // Would need portfolio correlation data
    };
  }
} 