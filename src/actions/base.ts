import type { ActionContext, ActionResult } from '../types/actions';
import { logger } from '@/utils/logger';

export abstract class BaseActionHandler {
  public abstract readonly type: string;
  public abstract readonly description: string;
  public abstract readonly payloadSchema: Record<string, unknown>;

  constructor() {}

  abstract execute(
    payload: Record<string, unknown>,
    context: ActionContext
  ): Promise<ActionResult>;

  protected createSuccessResult(
    data: unknown,
    metadata?: Record<string, unknown>
  ): ActionResult {
    return {
      success: true,
      data,
      metadata,
      timestamp: new Date().toISOString(),
    };
  }

  protected createErrorResult(
    error: string,
    metadata?: Record<string, unknown>
  ): ActionResult {
    return {
      success: false,
      error,
      metadata,
      timestamp: new Date().toISOString(),
    };
  }

  protected logAction(context: ActionContext, result: ActionResult): void {
    logger.info({
      actionType: `Action ${this.type} executed`,
      messageId: context.messageId,
      conversationId: context.conversationId,
      success: result.success,
      error: result.error,
      metadata: result.metadata,
    });
  }
} 