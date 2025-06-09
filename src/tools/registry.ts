import type { ToolType } from '../types/tools';
import { BaseTool } from './base';

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<ToolType, BaseTool> = new Map();

  private constructor() {}

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  public register(tool: BaseTool): void {
    this.tools.set(tool.type, tool);
  }

  public getTool(type: ToolType): BaseTool | undefined {
    return this.tools.get(type);
  }

  public getAllTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  public getAvailableTools(): Array<{
    type: ToolType;
    description: string;
    payloadSchema: Record<string, unknown>;
    prompt: string;
  }> {
    return this.getAllTools().map(tool => ({
      type: tool.type,
      description: tool.description,
      payloadSchema: tool.payloadSchema,
      prompt: tool.prompt
    }));
  }
} 