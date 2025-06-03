import { BaseTool } from '../base';
import type { ActionContext, ActionResult } from '../../types/actions';
import type { ToolType } from '../../types/tools';
import { MarketDataTool } from './market-data';
import { RiskAssessmentService } from '@/services/risk-assessment';
import { logger } from '@/utils/logger';
import type { Candlestick } from '@/types/candlestick';
import type { VolatilityMetrics, TechnicalIndicators, PositionRiskMetrics } from '@/services/risk-assessment';

interface MarketData {
  symbol: string;
  timeframe: string;
  bars: Candlestick[];
  startTime?: string;
  endTime?: string;
}

interface RiskAssessmentPayload {
  symbol: string;
  positionSize: number;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  timeframe: '1d' | '1w' | '1M';
  accountBalance?: number;
}

interface RiskAssessmentResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  riskScore: number;
  maxPositionSize: number;
  recommendedStopLoss: number;
  recommendedTakeProfit: number;
  riskRewardRatio: number;
  potentialLoss: number;
  potentialGain: number;
  volatilityMetrics: {
    historicalVolatility: number;
    averageTrueRange: number;
    priceSwingPercentage: number;
  };
  riskFactors: Array<{
    factor: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    description: string;
    score: number;
  }>;
  technicalAnalysis: {
    trendStrength: number;
    supportLevels: number[];
    resistanceLevels: number[];
    volumeAnalysis: string;
  };
}

export class RiskAssessmentTool extends BaseTool {
  private marketDataTool: MarketDataTool;
  private riskService: RiskAssessmentService;

  constructor() {
    super();
    this.marketDataTool = new MarketDataTool();
    this.riskService = RiskAssessmentService.getInstance();
  }

  public readonly type: ToolType = 'RISK_ASSESSMENT';
  public readonly description = 'Evaluates comprehensive risk analysis for potential trades including market conditions, volatility, news sentiment, and position sizing recommendations';
  public readonly payloadSchema = {
    type: 'object',
    properties: {
      symbol: { type: 'string' },
      positionSize: { type: 'number' },
      entryPrice: { type: 'number' },
      stopLoss: { type: 'number', optional: true },
      takeProfit: { type: 'number', optional: true },
      timeframe: { 
        type: 'string', 
        enum: ['1d', '1w', '1M']
      },
      accountBalance: { type: 'number', optional: true }
    },
    required: ['symbol', 'positionSize', 'entryPrice', 'timeframe']
  };

  async execute(
    payload: Record<string, unknown>,
    context: ActionContext
  ): Promise<ActionResult> {
    try {
      const riskPayload = this.validatePayload(payload);
      
      // Get market data
      const marketDataResult = await this.marketDataTool.execute({
        symbol: riskPayload.symbol,
        timeframe: riskPayload.timeframe,
        limit: 100 // Get enough data for analysis
      }, context);

      if (!marketDataResult.success || !marketDataResult.data) {
        throw new Error('Failed to fetch market data');
      }

      const marketData = marketDataResult.data as MarketData;
      if (!marketData.bars?.length) {
        throw new Error('No market data available');
      }

      // Calculate risk metrics
      const assessment = await this.assessRisk(riskPayload, marketData.bars);
      
      const result = this.createSuccessResult(assessment, {
        query: riskPayload
      });

      this.logTool(context, result);
      return result;
    } catch (error) {
      const errorResult = this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown error occurred',
        { payload }
      );
      this.logTool(context, errorResult);
      return errorResult;
    }
  }

  private validatePayload(payload: Record<string, unknown>): RiskAssessmentPayload {
    if (!payload.symbol || typeof payload.symbol !== 'string') {
      throw new Error('Symbol is required and must be a string');
    }
    if (!payload.positionSize || typeof payload.positionSize !== 'number') {
      throw new Error('Position size is required and must be a number');
    }
    if (!payload.entryPrice || typeof payload.entryPrice !== 'number') {
      throw new Error('Entry price is required and must be a number');
    }
    if (!payload.timeframe || typeof payload.timeframe !== 'string') {
      throw new Error('Timeframe is required and must be a string');
    }
    if (!['1d', '1w', '1M'].includes(payload.timeframe as string)) {
      throw new Error('Invalid timeframe value');
    }
    return payload as unknown as RiskAssessmentPayload;
  }

  private async assessRisk(payload: RiskAssessmentPayload, marketData: Candlestick[]): Promise<RiskAssessmentResult> {
    try {
      // Calculate volatility metrics
      const volatilityMetrics = this.riskService.calculateVolatilityMetrics(marketData);

      // Analyze technical indicators
      const technicalIndicators = this.riskService.analyzeTechnicalIndicators(marketData);

      // Calculate position risk
      const positionRisk = this.riskService.calculatePositionRisk({
        marketData,
        symbol: payload.symbol,
        entryPrice: payload.entryPrice,
        positionSize: payload.positionSize,
        accountBalance: payload.accountBalance,
        stopLoss: payload.stopLoss,
        takeProfit: payload.takeProfit
      });

      // Determine stop loss and take profit levels if not provided
      const stopLoss = payload.stopLoss || Math.min(
        payload.entryPrice * (1 - volatilityMetrics.averageTrueRange),
        ...technicalIndicators.supportLevels.filter(level => level < payload.entryPrice)
      );

      const takeProfit = payload.takeProfit || Math.max(
        payload.entryPrice * (1 + volatilityMetrics.averageTrueRange * 1.5),
        ...technicalIndicators.resistanceLevels.filter(level => level > payload.entryPrice)
      );

      // Calculate risk/reward metrics
      const riskRewardRatio = (takeProfit - payload.entryPrice) / (payload.entryPrice - stopLoss);
      const potentialLoss = (payload.entryPrice - stopLoss) * payload.positionSize;
      const potentialGain = (takeProfit - payload.entryPrice) * payload.positionSize;

      // Aggregate risk factors
      const riskFactors = this.aggregateRiskFactors(
        volatilityMetrics,
        technicalIndicators,
        positionRisk,
        riskRewardRatio
      );

      // Calculate overall risk score
      const riskScore = this.calculateOverallRiskScore(riskFactors);

      return {
        riskLevel: this.determineRiskLevel(riskScore),
        riskScore,
        maxPositionSize: positionRisk.maxPositionSize,
        recommendedStopLoss: stopLoss,
        recommendedTakeProfit: takeProfit,
        riskRewardRatio,
        potentialLoss,
        potentialGain,
        volatilityMetrics,
        riskFactors,
        technicalAnalysis: {
          trendStrength: technicalIndicators.trendStrength,
          supportLevels: technicalIndicators.supportLevels,
          resistanceLevels: technicalIndicators.resistanceLevels,
          volumeAnalysis: technicalIndicators.volumeProfile.trend
        }
      };
    } catch (error) {
      logger.error({ message: 'Error in risk assessment', error: error as Error });
      throw error;
    }
  }

  private aggregateRiskFactors(
    volatility: VolatilityMetrics,
    technical: TechnicalIndicators,
    positionRisk: PositionRiskMetrics,
    riskRewardRatio: number
  ): RiskAssessmentResult['riskFactors'] {
    const factors: RiskAssessmentResult['riskFactors'] = [];

    // Volatility risk
    factors.push({
      factor: 'Market Volatility',
      impact: volatility.historicalVolatility > 0.2 ? 'NEGATIVE' : 
             volatility.historicalVolatility < 0.1 ? 'POSITIVE' : 'NEUTRAL',
      description: `Historical volatility is ${(volatility.historicalVolatility * 100).toFixed(2)}%`,
      score: Math.min(1, volatility.historicalVolatility)
    });

    // Trend risk
    factors.push({
      factor: 'Trend Strength',
      impact: technical.trendStrength > 1.1 ? 'POSITIVE' :
             technical.trendStrength < 0.9 ? 'NEGATIVE' : 'NEUTRAL',
      description: `Market trend strength is ${technical.trendStrength.toFixed(2)}`,
      score: Math.abs(1 - technical.trendStrength)
    });

    // Volume risk
    factors.push({
      factor: 'Volume Profile',
      impact: technical.volumeProfile.trend === 'INCREASING' ? 'POSITIVE' :
             technical.volumeProfile.trend === 'DECREASING' ? 'NEGATIVE' : 'NEUTRAL',
      description: `Volume is ${technical.volumeProfile.trend.toLowerCase()} with ${technical.volumeProfile.volumeChange.toFixed(2)}% change`,
      score: technical.volumeProfile.trend === 'NEUTRAL' ? 0.5 :
             technical.volumeProfile.trend === 'DECREASING' ? 0.7 : 0.3
    });

    // Position size risk
    factors.push({
      factor: 'Position Sizing',
      impact: positionRisk.riskPerTrade > positionRisk.maxPositionSize ? 'NEGATIVE' :
             positionRisk.riskPerTrade < positionRisk.maxPositionSize * 0.5 ? 'POSITIVE' : 'NEUTRAL',
      description: `Position risk is ${((positionRisk.riskPerTrade / positionRisk.maxPositionSize) * 100).toFixed(2)}% of maximum`,
      score: Math.min(1, positionRisk.riskPerTrade / positionRisk.maxPositionSize)
    });

    // Risk/Reward ratio
    factors.push({
      factor: 'Risk/Reward Ratio',
      impact: riskRewardRatio >= 2 ? 'POSITIVE' :
             riskRewardRatio < 1 ? 'NEGATIVE' : 'NEUTRAL',
      description: `Risk/Reward ratio is ${riskRewardRatio.toFixed(2)}`,
      score: riskRewardRatio >= 2 ? 0.3 :
             riskRewardRatio < 1 ? 0.8 : 0.5
    });

    return factors;
  }

  private calculateOverallRiskScore(riskFactors: RiskAssessmentResult['riskFactors']): number {
    // Weight the risk factors
    const weights = {
      'Market Volatility': 0.25,
      'Trend Strength': 0.2,
      'Volume Profile': 0.15,
      'Position Sizing': 0.25,
      'Risk/Reward Ratio': 0.15
    };

    const weightedScore = riskFactors.reduce((score, factor) => {
      const weight = weights[factor.factor as keyof typeof weights] || 0;
      return score + (factor.score * weight);
    }, 0);

    return Math.min(1, weightedScore);
  }

  private determineRiskLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' {
    if (riskScore < 0.3) return 'LOW';
    if (riskScore < 0.6) return 'MEDIUM';
    if (riskScore < 0.8) return 'HIGH';
    return 'EXTREME';
  }
} 