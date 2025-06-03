import { ActionRegistry } from '@/actions/registry';
import { ToolRegistry } from '@/tools/registry';
import { ActionTypes } from '@/constants/actions';
import { ToolType } from '@/types/tools';
import type { Agent, AgentContext, AgentResult, AgentTask } from './types';

export abstract class BaseAgent implements Agent {
  public abstract readonly name: string;
  public abstract readonly description: string;
  public abstract readonly capabilities: Array<keyof typeof ActionTypes | ToolType>;

  constructor(
    protected readonly actionRegistry: ActionRegistry,
    protected readonly toolRegistry: ToolRegistry
  ) {}

  protected createSuccessResult(
    data: unknown,
    nextTasks?: AgentTask[],
    metadata?: Record<string, unknown>
  ): AgentResult {
    return {
      success: true,
      data,
      nextTasks,
      metadata,
    };
  }

  protected createErrorResult(
    error: string,
    metadata?: Record<string, unknown>
  ): AgentResult {
    return {
      success: false,
      error,
      metadata,
    };
  }

  protected async executeTool(
    task: AgentTask,
    context: AgentContext
  ): Promise<AgentResult> {
    try {
      const tool = this.toolRegistry.getTool(task.name as ToolType);
      if (!tool) {
        return this.createErrorResult(`No tool found: ${task.name}`);
      }

      const actionContext = {
        actionId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        messageId: context.messageId,
        conversationId: context.conversationId,
        userId: context.userId,
        metadata: context.metadata
      };

      const result = await tool.execute(task.payload, actionContext);
      return this.createSuccessResult(result.data, undefined, result.metadata);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResult(`Error executing tool: ${errorMessage}`);
    }
  }

  protected async executeAction(
    task: AgentTask,
    context: AgentContext
  ): Promise<AgentResult> {
    try {
      const handler = this.actionRegistry.getHandler(
        task.name as keyof typeof ActionTypes
      );
      if (!handler) {
        return this.createErrorResult(
          `No handler found for action: ${task.name}`
        );
      }

      const actionContext = {
        actionId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        messageId: context.messageId,
        conversationId: context.conversationId,
        userId: context.userId,
        metadata: context.metadata
      };

      const result = await handler.execute(task.payload, actionContext);
      return this.createSuccessResult(result.data, undefined, result.metadata);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResult(`Error executing action: ${errorMessage}`);
    }
  }

  public abstract execute(
    input: string | AgentTask,
    context: AgentContext
  ): Promise<AgentResult>;
} 