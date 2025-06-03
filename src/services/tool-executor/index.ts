import { ToolRegistry } from '@/tools';
import type { ActionContext, ActionResult } from '@/types/actions';
import type { ToolType } from '@/types/tools';
import { logger } from '@/utils/logger';

export class ToolExecutor {
  private static instance: ToolExecutor;
  private toolRegistry: ToolRegistry;

  private constructor() {
    this.toolRegistry = ToolRegistry.getInstance();
  }

  public static getInstance(): ToolExecutor {
    if (!ToolExecutor.instance) {
      ToolExecutor.instance = new ToolExecutor();
    }
    return ToolExecutor.instance;
  }

  public validateToolRequest(toolName: string): ToolType {
    const tool = this.toolRegistry.getTool(toolName as ToolType);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    
    // Each tool has its own validation logic
    return toolName as ToolType;
  }

  public async execute(
    toolType: ToolType,
    payload: Record<string, unknown>,
    context: ActionContext
  ): Promise<ActionResult> {
    try {
      const tool = this.toolRegistry.getTool(toolType);
      if (!tool) {
        throw new Error(`Tool ${toolType} not found`);
      }

      logger.info({
        toolType,
        message: 'Executing tool',
        payload
      });

      const result = await tool.execute(payload, context);

      logger.info({
        toolType,
        message: 'Tool execution completed',
        success: result.success
      });

      return result;
    } catch (error) {
      logger.error({
        toolType,
        message: 'Tool execution failed',
        error: error as Error,
        payload
      });

      throw error;
    }
  }

  public getAvailableTools() {
    return this.toolRegistry.getAvailableTools();
  }
}

export const toolExecutor = ToolExecutor.getInstance(); 