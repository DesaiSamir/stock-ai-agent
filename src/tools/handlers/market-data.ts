import { BaseTool } from '../base';
import type { ActionContext, ActionResult } from '../../types/actions';
import type { ToolType } from '../../types/tools';
import { httpService } from '@/services/http-client';
import { ENDPOINTS } from '@/constants/http';
import type { BarData, TimeUnit } from '@/types/tradestation';
import { Candlestick } from '@/types/candlestick';
import { patternDetector } from '@/services/patternDetector';
import { TechnicalAnalysisService } from '@/services/technical-analysis';
import { formatToEST } from '@/utils/date';

interface MarketData {
  symbol: string;
  timeframe: string;
  bars: Candlestick[];
  startTime?: string;
  endTime?: string;
  technicalAnalysis?: {
    indicators: import('@/services/technical-analysis').TechnicalIndicators;
    trend: import('@/services/technical-analysis').TrendAnalysis;
    volume: import('@/services/technical-analysis').VolumeAnalysis;
  };
}

interface MarketDataPayload {
  symbol: string;
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';
  limit?: number;
  startTime?: string;
  endTime?: string;
}

const timeframeToInterval: Record<string, { interval: number; unit: TimeUnit }> = {
  '1m': { interval: 1, unit: 'Minute' },
  '5m': { interval: 5, unit: 'Minute' },
  '15m': { interval: 15, unit: 'Minute' },
  '1h': { interval: 60, unit: 'Minute' },
  '4h': { interval: 240, unit: 'Minute' },
  '1d': { interval: 1, unit: 'Daily' },
  '1w': { interval: 1, unit: 'Weekly' },
  '1M': { interval: 1, unit: 'Monthly' }
};

export class MarketDataTool extends BaseTool {
  public readonly type: ToolType = 'MARKET_DATA';
  public readonly description = 'Fetches real-time and historical market data for stocks';
  public readonly prompt = `Analyze the market data and provide:

1. Price Action Analysis
- Trend identification and strength
- Key price levels and ranges
- Candlestick patterns
- Price momentum

2. Volume Analysis
- Volume trends and anomalies
- Volume-price relationship
- Accumulation/Distribution
- Volume profile

3. Market Context
- Time-based patterns
- Market phase identification
- Volatility assessment
- Trading activity analysis

4. Trading Implications
- Support/Resistance levels
- Potential reversal points
- Trend continuation signals
- Risk/Reward scenarios`;

  public readonly payloadSchema = {
    type: 'object',
    properties: {
      symbol: { type: 'string', required: true },
      timeframe: { 
        type: 'string', 
        required: true,
        enum: ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'],
        description: 'The timeframe of the data to fetch: m = minute, h = hour, d = day, w = week, M = month.'
      },
      limit: { 
        type: 'number', 
        required: true,
        description: 'Number of bars to return (default: 20, max: 300)',
        minimum: 1,
        maximum: 300
      },
      startTime: { 
        type: 'string', 
        required: false,
        description: 'Start time in ISO format',
        format: 'date-time'
      },
      endTime: { 
        type: 'string', 
        required: false,
        description: 'End time in ISO format',
        format: 'date-time'
      }
    },
    required: ['symbol', 'timeframe', 'limit']
  };

  private validatePayload(payload: Record<string, unknown>): MarketDataPayload {
    if (!payload.symbol || typeof payload.symbol !== 'string') {
      throw new Error('Symbol is required and must be a string');
    }
    if (!payload.timeframe || typeof payload.timeframe !== 'string') {
      throw new Error('Timeframe is required and must be a string');
    }
    if (!['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'].includes(payload.timeframe as string)) {
      throw new Error('Invalid timeframe value');
    }
    if (payload.limit && (typeof payload.limit !== 'number' || payload.limit > 300 || payload.limit < 1)) {
      throw new Error('Limit must be a number between 1 and 300');
    }
    return {
      symbol: payload.symbol as string,
      timeframe: payload.timeframe as MarketDataPayload['timeframe'],
      limit: payload.limit as number | undefined,
      startTime: payload.startTime as string | undefined,
      endTime: payload.endTime as string | undefined
    };
  }

  private async fetchMarketData(payload: MarketDataPayload): Promise<MarketData> {
    try {
      const { interval, unit } = timeframeToInterval[payload.timeframe];
      const barsBack = 600;
      const lastDate = new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }).replace(/\//g, "-");

      const url = `${ENDPOINTS.TRADESTATION.BARCHART}/${payload.symbol}/${interval}/${unit}/${barsBack}/${lastDate}`;
      
      const barData = await httpService.tradestation.post<BarData[]>(ENDPOINTS.TRADESTATION.MARKET_DATA, {
        method: 'GET',
        url
      });

      if (!Array.isArray(barData) || barData.length === 0) {
        throw new Error('No market data available');
      }

      // Convert BarData array to MarketDataBar array
      const bars = this.formatBarDataArray(barData, payload.symbol);

      // Sort bars by timestamp in ascending order
      bars.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate technical indicators
      const technicalAnalysis = await this.calculateTechnicalAnalysis(bars);
      
      return {
        symbol: payload.symbol,
        timeframe: payload.timeframe,
        bars,
        startTime: payload.startTime,
        endTime: payload.endTime,
        technicalAnalysis
      };
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      throw error;
    }
  }

  private formatBarDataArray(data: BarData[], symbol: string): Candlestick[] {
    try {
      // First pass: basic OHLCV data
      const formattedData = data.map((bar) => {
        return this.formatBarDataSingle(bar, symbol);
      });

      // Sort by date
      formattedData.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      // Detect patterns
      return patternDetector.detectPattern(formattedData);
    } catch (error) {
      console.error("Error formatting bar data:", error);
      return [];
    }
  };

  private formatBarDataSingle(barData: BarData, symbol: string): Candlestick {
    const tsRegX = /\d+/g;
    const ts = parseInt(barData.TimeStamp.match(tsRegX)?.[0] || "0");
    const date = new Date(ts);

    return {
      date: formatToEST(date),
      open: barData.Open,
      high: barData.High,
      low: barData.Low,
      close: barData.Close,
      volume: barData.TotalVolume,
      pattern: "",
      patternType: undefined,
      candle: undefined,
      symbol: symbol,
    } as Candlestick;
  }

  private async calculateTechnicalAnalysis(data: Candlestick[]) {
    const technicalAnalysisService = TechnicalAnalysisService.getInstance();
    
    const indicators = technicalAnalysisService.calculateAllIndicators(data);
    const trend = technicalAnalysisService.analyzeTrend(data, indicators);
    const volume = technicalAnalysisService.analyzeVolume(data);

    return {
      indicators,
      trend,
      volume
    };
  }

  async execute(
    payload: Record<string, unknown>,
    context: ActionContext
  ): Promise<ActionResult> {
    try {
      const marketDataPayload = this.validatePayload(payload);
      const marketData = await this.fetchMarketData(marketDataPayload);
      
      const lastXBars = marketData.bars.slice(-(marketDataPayload.limit || 20));

      const result = this.createSuccessResult({
        bars: lastXBars,
        technicalAnalysis: marketData.technicalAnalysis
      }, {
        query: marketDataPayload
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
} 