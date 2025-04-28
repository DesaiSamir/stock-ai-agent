import type { AgentStatus } from '../../types/stock';

export const sampleAgentStatus: AgentStatus[] = [
  {
    id: '1',
    name: 'News Agent',
    status: 'active',
    lastUpdate: new Date(),
    message: 'Monitoring news feeds',
  },
  {
    id: '2',
    name: 'Trading Agent',
    status: 'active',
    lastUpdate: new Date(),
    message: 'Analyzing market conditions',
  },
]; 