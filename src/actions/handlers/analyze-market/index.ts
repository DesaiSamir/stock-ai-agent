import { BaseActionHandler } from '../../base';
import { ActionRegistry } from '../../registry';
import type { ActionContext, ActionResult } from '../../types';
import { ActionTypes } from '@/constants/actions';
import { useChatStore } from '@/store/chat';
import { createTextMessage } from '@/utils/messageCreators';

export class StartMarketAnalysisHandler extends BaseActionHandler {
  readonly type = ActionTypes.START_MARKET_ANALYSIS;
  readonly description = 'Start a new market analysis flow';
  readonly payloadSchema = {};

  async execute(
    _payload: Record<string, unknown>,
    context: ActionContext
  ): Promise<ActionResult> {
    // Call ANALYZE_MARKET with isNewAnalysis: true
    return await ActionRegistry.getInstance().execute(
      {
        type: ActionTypes.ANALYZE_MARKET,
        payload: { isNewAnalysis: true },
      },
      context
    );
  }
}

export class AnalyzeMarketHandler extends BaseActionHandler {
  readonly type = ActionTypes.ANALYZE_MARKET;
  readonly description = 'Analyze market conditions and generate trading signals';
  readonly payloadSchema = {
    symbol: { type: 'string' },
    timeframe: { type: 'string', enum: ['1d', '1w', '1m'] },
    isNewAnalysis: { type: 'boolean' },
    indicators: { 
      type: 'array',
      items: { type: 'string' },
      optional: true
    }
  };

  async execute(
    payload: Record<string, unknown>,
    context: ActionContext
  ): Promise<ActionResult> {
    const { setLoading, addMessage } = useChatStore.getState();
    const isNewAnalysis = payload.isNewAnalysis as boolean;

    // If this is a new analysis, start the flow
    if (isNewAnalysis) {
      addMessage(
        createTextMessage(
          'I can help you analyze market conditions and generate trading signals.'
        )
      );
      addMessage(
        createTextMessage(
          'Please enter a stock symbol to analyze (e.g., AAPL, MSFT, GOOGL).'
        )
      );

      return this.createSuccessResult({});
    }

    // Otherwise, validate the provided symbol and perform analysis
    const symbol = payload.symbol as string;
    if (!symbol) {
      return this.createErrorResult('No symbol provided');
    }

    try {
      setLoading(true);

      // Perform technical analysis
      const technicalAnalysis = await ActionRegistry.getInstance().execute(
        {
          type: ActionTypes.PERFORM_TECHNICAL_ANALYSIS,
          payload: {
            symbol,
            timeframe: payload.timeframe || '1d',
            indicators: payload.indicators || ['SMA20', 'SMA50', 'RSI', 'MACD']
          },
        },
        context
      );

      // Perform news analysis
      const newsAnalysis = await ActionRegistry.getInstance().execute(
        {
          type: ActionTypes.ANALYZE_NEWS,
          payload: {
            symbol,
            timeframe: payload.timeframe || '1d'
          },
        },
        context
      );

      // Return combined results without sending messages
      return {
        success: true,
        data: {
          technicalAnalysis: technicalAnalysis.data,
          newsAnalysis: newsAnalysis.data
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addMessage(
        createTextMessage(`Error performing market analysis: ${errorMessage}`)
      );
      return this.createErrorResult('Error performing market analysis');
    } finally {
      setLoading(false);
    }
  }
}

export const handlers = [
  new StartMarketAnalysisHandler(),
  new AnalyzeMarketHandler(),
]; 