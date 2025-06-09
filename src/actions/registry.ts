import type { ActionType } from '@/types/actions';
import { BaseActionHandler } from './base';

export class ActionRegistry {
  private static instance: ActionRegistry;
  private handlers: Map<ActionType, BaseActionHandler> = new Map();

  private constructor() {}

  public static getInstance(): ActionRegistry {
    if (!ActionRegistry.instance) {
      ActionRegistry.instance = new ActionRegistry();
    }
    return ActionRegistry.instance;
  }

  public register(handler: BaseActionHandler): void {
    this.handlers.set(handler.type, handler);
  }

  public getHandler(type: ActionType): BaseActionHandler | undefined {
    return this.handlers.get(type);
  }

  public getAllHandlers(): BaseActionHandler[] {
    return Array.from(this.handlers.values());
  }

  public getAvailableActions(): Array<{
    type: ActionType;
    description: string;
    payloadSchema: Record<string, unknown>;
    prompt: string;
  }> {
    return this.getAllHandlers().map(handler => ({
      type: handler.type,
      description: handler.description,
      payloadSchema: handler.payloadSchema,
      prompt: handler.prompt
    }));
  }
} 