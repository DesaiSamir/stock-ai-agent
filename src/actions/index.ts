import { handlers } from './handlers/index';
import { ActionRegistry } from './registry';
import { ActionTypes } from '@/constants/actions';

export * from './types';
export * from './registry';
export * from './base';
export * from './handlers/index';
export * from '@/constants/actions';

// Function to register all handlers with the registry
export function registerHandlers(): void {
  const registry = ActionRegistry.getInstance();
  handlers.forEach(handler => registry.registerHandler(handler));
}

// Function to get available actions from the registry
export function getAvailableActions(): Array<{
  type: keyof typeof ActionTypes;
  description: string;
  payloadSchema: unknown;
}> {
  const registry = ActionRegistry.getInstance();
  return registry.getRegisteredTypes().map((type: string) => {
    const handler = registry.getHandler(type);
    return {
      type: type as keyof typeof ActionTypes,
      description: handler?.description || 'No description available',
      payloadSchema: handler?.payloadSchema || {},
    };
  });
} 