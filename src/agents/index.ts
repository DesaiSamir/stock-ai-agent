import { ActionRegistry } from '@/actions/registry';
import { ToolRegistry } from '@/tools/registry';
import { ActionTypes } from '@/constants/actions';
import { ToolType } from '@/types/tools';
import type { Agent } from './types';
import { OrchestratorAgent } from './orchestrator';

// Create registry instances
const actionRegistry = ActionRegistry.getInstance();
const toolRegistry = ToolRegistry.getInstance();

// Create agent instances
export const agents: Agent[] = [];

// Initialize agents asynchronously
export async function initializeAgents(): Promise<void> {
  const [
    { AnalysisAgent },
    { TradingAgent },
    { NewsAgent },
    { RiskAgent }
  ] = await Promise.all([
    import('./analysis'),
    import('./trading'),
    import('./news'),
    import('./risk')
  ]);

  agents.push(
    new AnalysisAgent(actionRegistry, toolRegistry),
    new TradingAgent(actionRegistry, toolRegistry),
    new NewsAgent(actionRegistry, toolRegistry),
    new RiskAgent(actionRegistry, toolRegistry)
  );
}

export const orchestratorAgent = new OrchestratorAgent(
  actionRegistry,
  toolRegistry
);

export function registerAllAgents(): void {
  agents.forEach(agent => {
    if (agent.name !== 'OrchestratorAgent') {
      orchestratorAgent.registerAgent(agent);
    }
  });
}

// Function to get available agents
export function getAvailableAgents(): Array<{
  name: string;
  description: string;
  capabilities: Array<keyof typeof ActionTypes | ToolType>;
}> {
  return agents.map((agent: Agent) => ({
    name: agent.name,
    description: agent.description,
    capabilities: agent.capabilities,
  }));
}

export * from './base';
export * from './types';
export * from './orchestrator';
