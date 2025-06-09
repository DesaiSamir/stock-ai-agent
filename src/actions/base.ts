import type { ActionContext, ActionResult } from '../types/actions';
import type { ActionType } from '@/types/actions';

export abstract class BaseActionHandler {
  public abstract readonly type: ActionType;
  public abstract readonly description: string;
  public abstract readonly payloadSchema: Record<string, unknown>;
  public abstract readonly prompt: string;

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
      metadata: metadata || {},
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
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    };
  }

  protected logAction(context: ActionContext, result: ActionResult): void {
    // TODO: Implement proper logging
    console.log(`[Action: ${this.type}]`, {
      context,
      result,
    });
  }
} 