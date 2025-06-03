import { BaseActionHandler } from '@/actions/base';
import { ActionRegistry } from '@/actions/registry';
import type { ActionContext, ActionResult } from '@/types/actions';
import { ActionTypes } from '@/constants/actions';
import { useChatStore } from '@/store/chat';
import { createTextMessage } from '@/utils/messageCreators';

export class StartTradeExecutionHandler extends BaseActionHandler {
  readonly type = ActionTypes.START_TRADE_EXECUTION;
  readonly description = 'Start a new trade execution flow';
  readonly payloadSchema = {};

  async execute(
    _payload: Record<string, unknown>,
    context: ActionContext
  ): Promise<ActionResult> {
    // Call EXECUTE_TRADE with isNewTrade: true
    return await ActionRegistry.getInstance().execute(
      {
        type: ActionTypes.EXECUTE_TRADE,
        payload: { isNewTrade: true },
      },
      context
    );
  }
}

export class ExecuteTradeHandler extends BaseActionHandler {
  readonly type = ActionTypes.EXECUTE_TRADE;
  readonly description = 'Execute a trade based on analysis and risk assessment';
  readonly payloadSchema = {
    symbol: { type: 'string' },
    action: { type: 'string', enum: ['BUY', 'SELL'] },
    quantity: { type: 'number' },
    price: { type: 'number', optional: true },
    isNewTrade: { type: 'boolean' },
    stopLoss: { type: 'number', optional: true },
    takeProfit: { type: 'number', optional: true }
  };

  async execute(
    payload: Record<string, unknown>,
    context: ActionContext
  ): Promise<ActionResult> {
    const { setLoading, addMessage } = useChatStore.getState();
    const isNewTrade = payload.isNewTrade as boolean;

    // If this is a new trade, start the flow
    if (isNewTrade) {
      addMessage(
        createTextMessage(
          'I can help you execute trades based on market analysis.'
        )
      );
      addMessage(
        createTextMessage(
          'Please provide the trade details (symbol, action, quantity).'
        )
      );

      return this.createSuccessResult({});
    }

    // Otherwise, validate the trade details and execute
    const { symbol, action, quantity } = payload;
    if (!symbol || !action || !quantity) {
      return this.createErrorResult('Missing required trade details');
    }

    try {
      setLoading(true);

      // Perform risk assessment
      const riskAssessment = await ActionRegistry.getInstance().execute(
        {
          type: ActionTypes.ASSESS_RISK,
          payload: {
            symbol,
            positionSize: quantity,
            entryPrice: payload.price,
            stopLoss: payload.stopLoss,
            takeProfit: payload.takeProfit
          },
        },
        context
      );

      if (!riskAssessment.success) {
        addMessage(
          createTextMessage(
            'Risk assessment failed. Please review the trade parameters.'
          )
        );
        return this.createErrorResult('Risk assessment failed');
      }

      // Execute the trade
      const tradeResult = await ActionRegistry.getInstance().execute(
        {
          type: ActionTypes.PLACE_TRADE,
          payload: {
            symbol,
            action,
            quantity,
            price: payload.price,
            stopLoss: payload.stopLoss,
            takeProfit: payload.takeProfit
          },
        },
        context
      );

      if (!tradeResult.success) {
        addMessage(
          createTextMessage('Trade execution failed. Please try again.')
        );
        return this.createErrorResult('Trade execution failed');
      }

      // Display results
      addMessage(
        createTextMessage(
          `Trade executed successfully for ${symbol}.`
        )
      );

      return this.createSuccessResult({
        symbol,
        action,
        quantity,
        price: payload.price,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addMessage(
        createTextMessage(`Error executing trade: ${errorMessage}`)
      );
      return this.createErrorResult('Error executing trade');
    } finally {
      setLoading(false);
    }
  }
}

export const handlers = [
  new StartTradeExecutionHandler(),
  new ExecuteTradeHandler(),
]; 