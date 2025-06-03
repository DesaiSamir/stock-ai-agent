import type { ToolConfig } from '@/types/orchestrator';

export class ToolRegistry {
  private tools: Map<string, ToolConfig>;

  constructor() {
    this.tools = new Map();
  }

  register(name: string, tool: ToolConfig): void {
    if (this.tools.has(name)) {
      throw new Error(`Tool ${name} is already registered`);
    }
    this.tools.set(name, tool);
  }

  getTool(name: string): ToolConfig {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} is not registered`);
    }
    return tool;
  }

  getAllTools(): ToolConfig[] {
    return Array.from(this.tools.values());
  }

  unregister(name: string): void {
    this.tools.delete(name);
  }
} 