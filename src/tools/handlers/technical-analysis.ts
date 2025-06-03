import { BaseTool } from '../base';
import type { ActionContext, ActionResult } from '../../types/actions';
import type { ToolType } from '../../types/tools';
import { MarketDataTool } from './market-data';
import { TechnicalAnalysisService } from '@/services/technical-analysis';
import { Candlestick } from '@/types/candlestick';
import type { TechnicalIndicators, TrendAnalysis, VolumeAnalysis } from '@/services/technical-analysis';

interface MarketDataResponse {
  bars: Candlestick[];
  technicalAnalysis?: {
    indicators: TechnicalIndicators;
    trend: TrendAnalysis;
    volume: VolumeAnalysis;
  };
}

export class TechnicalAnalysisTool extends BaseTool {
  private marketDataTool: MarketDataTool;
  private technicalAnalysisService: TechnicalAnalysisService;

  constructor() {
    super();
    this.marketDataTool = new MarketDataTool();
    this.technicalAnalysisService = TechnicalAnalysisService.getInstance();
  }

  public readonly type: ToolType = 'TECHNICAL_ANALYSIS';
  public readonly description = 'Performs technical analysis on market data to generate trading signals';
  public readonly payloadSchema = {
    type: 'object',
    properties: {
      symbol: { type: 'string' },
      timeframe: { type: 'string', enum: ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'] },
      limit: { 
        type: 'number',
        description: 'Number of bars to analyze (default: 200)',
        minimum: 50,
        maximum: 500
      }
    },
    required: ['symbol', 'timeframe']
  };

  public async execute(
    payload: Record<string, unknown>,
    context: ActionContext
  ): Promise<ActionResult> {
    try {
      const { symbol, timeframe, limit = 200 } = this.validatePayload(payload);
      
      // Get market data
      const marketData = await this.marketDataTool.execute({
        symbol,
        timeframe,
        limit
      }, context);

      if (!marketData.success || !marketData.data) {
        throw new Error('Failed to fetch market data');
      }

      const data = marketData.data as MarketDataResponse;

      if (!data.bars || !Array.isArray(data.bars)) {
        throw new Error('Invalid market data format');
      }

      // Calculate technical indicators
      const indicators = this.technicalAnalysisService.calculateAllIndicators(data.bars);
      const trend = this.technicalAnalysisService.analyzeTrend(data.bars, indicators);
      const volume = this.technicalAnalysisService.analyzeVolume(data.bars);

      // Generate trading signals
      const signal = this.generateSignal(indicators, trend);
      
      const result = this.createSuccessResult({
        signal,
        technicalAnalysis: {
          indicators,
          trend,
          volume
        }
      }, {
        symbol,
        timeframe,
        limit
      });

      this.logTool(context, result);
      return result;
    } catch (error) {
      const result = this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown error occurred',
        { payload }
      );
      this.logTool(context, result);
      return result;
    }
  }

  private validatePayload(payload: Record<string, unknown>): {
    symbol: string;
    timeframe: string;
    limit?: number;
  } {
    if (!payload.symbol || typeof payload.symbol !== 'string') {
      throw new Error('Symbol is required and must be a string');
    }
    if (!payload.timeframe || typeof payload.timeframe !== 'string') {
      throw new Error('Timeframe is required and must be a string');
    }
    if (!['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'].includes(payload.timeframe)) {
      throw new Error('Invalid timeframe value');
    }
    if (payload.limit && (typeof payload.limit !== 'number' || payload.limit < 50 || payload.limit > 500)) {
      throw new Error('Limit must be a number between 50 and 500');
    }
    return {
      symbol: payload.symbol,
      timeframe: payload.timeframe,
      limit: payload.limit as number | undefined
    };
  }

  private generateSignal(
    indicators: import('@/services/technical-analysis').TechnicalIndicators,
    trend: import('@/services/technical-analysis').TrendAnalysis
  ): {
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasons: string[];
  } {
    const { rsi, macd } = indicators;
    const { primaryTrend, strength, priceLocation } = trend;

    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0.5;
    const reasons: string[] = [];

    // Determine action based on trend and indicators
    if (primaryTrend === 'BULLISH') {
      action = 'BUY';
      confidence = strength;
      reasons.push(`Strong bullish trend with ${(strength * 100).toFixed(1)}% strength`);
      
      if (priceLocation.aboveMA200) {
        reasons.push(`Price is above 200 SMA by ${priceLocation.distanceFromMA200.toFixed(1)}%`);
        confidence += 0.1;
      }
      
      if (macd.crossover === 'BULLISH') {
        reasons.push('MACD shows bullish crossover');
        confidence += 0.1;
      }
      
      if (!rsi.isOverbought) {
        reasons.push('RSI indicates room for upside');
        confidence += 0.1;
      }
    } else if (primaryTrend === 'BEARISH') {
      action = 'SELL';
      confidence = strength;
      reasons.push(`Strong bearish trend with ${(strength * 100).toFixed(1)}% strength`);
      
      if (!priceLocation.aboveMA200) {
        reasons.push(`Price is below 200 SMA by ${Math.abs(priceLocation.distanceFromMA200).toFixed(1)}%`);
        confidence += 0.1;
      }
      
      if (macd.crossover === 'BEARISH') {
        reasons.push('MACD shows bearish crossover');
        confidence += 0.1;
      }
      
      if (!rsi.isOversold) {
        reasons.push('RSI indicates room for downside');
        confidence += 0.1;
      }
    } else {
      reasons.push('No clear trend direction');
      if (rsi.isOverbought) {
        reasons.push('RSI indicates overbought conditions');
      } else if (rsi.isOversold) {
        reasons.push('RSI indicates oversold conditions');
      }
    }

    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);

    return {
      action,
      confidence,
      reasons
    };
  }
} 