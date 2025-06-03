import type { AgentConfig } from '../types/orchestrator';

export class AgentRegistry {
  private agents: Map<string, AgentConfig>;

  constructor() {
    this.agents = new Map();
  }

  register(name: string, agent: AgentConfig): void {
    if (this.agents.has(name)) {
      throw new Error(`Agent ${name} is already registered`);
    }
    this.agents.set(name, agent);
  }

  getAgent(name: string): AgentConfig {
    const agent = this.agents.get(name);
    if (!agent) {
      throw new Error(`Agent ${name} is not registered`);
    }
    return agent;
  }

  getAllAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  unregister(name: string): void {
    this.agents.delete(name);
  }
} 