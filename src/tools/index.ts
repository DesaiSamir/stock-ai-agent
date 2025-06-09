import { ToolRegistry } from './registry';
import { TechnicalAnalysisTool } from './handlers/technical-analysis';
import { MarketDataTool } from './handlers/market-data';
import { NewsAnalysisTool } from './handlers/news-analysis';
import { RiskAssessmentTool } from './handlers/risk-assessment';
import { QuoteDataTool } from './handlers/quote-data';
import type { ToolType } from '../types/tools';

export * from './base';
export * from './registry';
export * from './handlers/technical-analysis';
export * from './handlers/market-data';
export * from './handlers/news-analysis';
export * from './handlers/risk-assessment';
export * from './handlers/quote-data';

// Function to register all tools with the registry
export function registerAllTools(): void {
  const registry = ToolRegistry.getInstance();

  // Register all tools
  registry.register(new TechnicalAnalysisTool());
  registry.register(new MarketDataTool());
  registry.register(new NewsAnalysisTool());
  registry.register(new RiskAssessmentTool());
  registry.register(new QuoteDataTool());
  // Add more tool registrations here as they are created
}

// Function to get available tools from the registry
export function getAvailableTools(): Array<{
  type: ToolType;
  description: string;
  payloadSchema: Record<string, unknown>;
  prompt: string;
}> {
  const registry = ToolRegistry.getInstance();
  return registry.getAvailableTools();
} 