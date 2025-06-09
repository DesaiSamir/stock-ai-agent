import { ActionRegistry } from './registry';
import { ExecuteTradeHandler } from './handlers/execute-trade';
import type { ActionType } from '@/types/actions';

export * from './base';
export * from './registry';
export * from './handlers/execute-trade';

// Function to register all actions with the registry
export function registerAllActions(): void {
  const registry = ActionRegistry.getInstance();

  // Register all actions
  registry.register(new ExecuteTradeHandler());
  // Add more action registrations here as they are created
}

// Function to get available actions from the registry
export function getAvailableActions(): Array<{
  type: ActionType;
  description: string;
  payloadSchema: Record<string, unknown>;
  prompt: string;
}> {
  const registry = ActionRegistry.getInstance();
  return registry.getAvailableActions();
} 