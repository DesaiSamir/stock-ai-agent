import type { ActionContext, ActionResult } from '../types/actions';
import type { ToolType } from '../types/tools';

export abstract class BaseTool {
  public abstract readonly type: ToolType;
  public abstract readonly description: string;
  public abstract readonly payloadSchema: Record<string, unknown>;

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

  protected logTool(context: ActionContext, result: ActionResult): void {
    // TODO: Implement proper logging
    console.log(`[Tool: ${this.type}]`, {
      context,
      result,
    });
  }

  public abstract execute(
    payload: Record<string, unknown>,
    context: ActionContext
  ): Promise<ActionResult>;
} 