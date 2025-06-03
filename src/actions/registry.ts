import type { Action, ActionContext, ActionHandler, ActionResult } from './types';
import type { ActionConfig, Query } from '../types/orchestrator';
import { logger } from '@/utils/logger';

export class ActionRegistry {
  private static instance: ActionRegistry;
  private handlers: Map<string, ActionHandler>;
  private configs: Map<string, ActionConfig>;

  private constructor() {
    this.handlers = new Map();
    this.configs = new Map();
  }

  static getInstance(): ActionRegistry {
    if (!ActionRegistry.instance) {
      ActionRegistry.instance = new ActionRegistry();
    }
    return ActionRegistry.instance;
  }

  // Handler registration and execution
  registerHandler(handler: ActionHandler): void {
    if (this.handlers.has(handler.type)) {
      logger.warn(
        {
          actionType: `Handler for action type ${handler.type} already exists, overwriting`
        }
      );
    }
    this.handlers.set(handler.type, handler);
  }

  async execute(action: Action, context: ActionContext): Promise<ActionResult> {
    const handler = this.handlers.get(action.type);

    if (!handler) {
      const error = `No handler registered for action type: ${action.type}`;
      logger.error({ error });
      return {
        success: false,
        error,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      return await handler.execute(action.payload, context);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error({
        actionType: `Error executing action ${action.type}: ${errorMessage}`
      });
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Action configuration management
  registerConfig(name: string, config: ActionConfig): void {
    if (this.configs.has(name)) {
      logger.warn({
        actionType: `Action config ${name} already exists, overwriting`
      });
    }
    this.configs.set(name, config);
  }

  getConfig(name: string): ActionConfig | undefined {
    return this.configs.get(name);
  }

  getConfigForQuery(query: Query): ActionConfig | undefined {
    return Array.from(this.configs.values()).find(
      config => config.name.toLowerCase() === query.type.toLowerCase()
    );
  }

  getAllConfigs(): ActionConfig[] {
    return Array.from(this.configs.values());
  }

  // Utility methods
  getHandler(type: string): ActionHandler | undefined {
    return this.handlers.get(type);
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  unregisterConfig(name: string): void {
    this.configs.delete(name);
  }
} 