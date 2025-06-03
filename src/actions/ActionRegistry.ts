import type { ActionConfig, Query } from '../types/orchestrator';

export class ActionRegistry {
  private actions: Map<string, ActionConfig>;

  constructor() {
    this.actions = new Map();
  }

  register(name: string, action: ActionConfig): void {
    if (this.actions.has(name)) {
      throw new Error(`Action ${name} is already registered`);
    }
    this.actions.set(name, action);
  }

  getAction(name: string): ActionConfig | undefined {
    return this.actions.get(name);
  }

  getActionForQuery(query: Query): ActionConfig | undefined {
    // Find the first action that matches the query type
    return Array.from(this.actions.values()).find(
      action => action.name.toLowerCase() === query.type.toLowerCase()
    );
  }

  getAllActions(): ActionConfig[] {
    return Array.from(this.actions.values());
  }

  unregister(name: string): void {
    this.actions.delete(name);
  }
} 