import { BaseTool } from '../base';
import type { ActionContext, ActionResult } from '../../types/actions';
import type { ToolType } from '../../types/tools';
import { httpService } from '@/services/http-client';
import { ENDPOINTS } from '@/constants/http';
import type { QuoteData } from '@/types/tradestation';

interface QuoteDataPayload {
  symbol: string;
  extendedHours?: boolean;
}

export class QuoteDataTool extends BaseTool {
  public readonly type: ToolType = 'QUOTE_DATA';
  public readonly description = 'Fetches real-time quote data including price, bid/ask, volume, and other market statistics';
  public readonly prompt = `Analyze the quote data and provide:

1. Price Analysis
- Current price and change
- Bid/Ask spread analysis
- Price relative to day's range
- Trading volume context

2. Market Sentiment
- Order book imbalance (bid vs ask size)
- Volume comparison to average
- Price momentum
- Market depth analysis

3. Trading Implications
- Liquidity assessment
- Execution considerations
- Short-term price pressure
- Potential price direction`;

  public readonly payloadSchema = {
    type: 'object',
    properties: {
      symbol: { 
        type: 'string', 
        required: true,
        description: 'The stock symbol to fetch quote data for'
      },
      extendedHours: {
        type: 'boolean',
        required: false,
        description: 'Whether to include extended hours data',
        default: false
      }
    },
    required: ['symbol']
  };

  private validatePayload(payload: Record<string, unknown>): QuoteDataPayload {
    if (!payload.symbol || typeof payload.symbol !== 'string') {
      throw new Error('Symbol is required and must be a string');
    }

    return {
      symbol: payload.symbol,
      extendedHours: payload.extendedHours as boolean | undefined
    };
  }

  private async fetchQuoteData(payload: QuoteDataPayload): Promise<QuoteData> {
    try {
      const url = `${ENDPOINTS.TRADESTATION.QUOTE}/${payload.symbol}`;
      
      const quoteData = await httpService.tradestation.post<QuoteData>(ENDPOINTS.TRADESTATION.MARKET_DATA, {
        method: 'GET',
        url,
        params: {
          extendedHours: payload.extendedHours
        }
      });

      if (!quoteData) {
        throw new Error('No quote data available');
      }

      return quoteData;
    } catch (error) {
      console.error('Failed to fetch quote data:', error);
      throw error;
    }
  }

  async execute(
    payload: Record<string, unknown>,
    context: ActionContext
  ): Promise<ActionResult> {
    try {
      const quoteDataPayload = this.validatePayload(payload);
      const quoteData = await this.fetchQuoteData(quoteDataPayload);

      const result = this.createSuccessResult(quoteData, {
        query: quoteDataPayload
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