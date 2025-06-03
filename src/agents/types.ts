import { ActionTypes } from '@/constants/actions';
import { ToolType } from '@/types/tools';
import { Message } from '@/utils/messageCreators';

export interface AgentContext {
  conversationId: string;
  messageId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  history?: Message[];
}

export interface AgentTask {
  type: 'action' | 'tool';
  name: keyof typeof ActionTypes | ToolType;
  payload: Record<string, unknown>;
  priority: number;
  dependencies?: string[]; // IDs of tasks this task depends on
}

export interface AgentResult {
  success: boolean;
  data?: unknown;
  error?: string;
  nextTasks?: AgentTask[];
  metadata?: Record<string, unknown>;
}

export interface Agent {
  name: string;
  description: string;
  capabilities: Array<keyof typeof ActionTypes | ToolType>;
  execute: (
    input: string | AgentTask,
    context: AgentContext
  ) => Promise<AgentResult>;
}

export interface OrchestratorAgentInterface extends Agent {
  delegate: (task: AgentTask, context: AgentContext) => Promise<AgentResult>;
  getAvailableAgents: () => Agent[];
  registerAgent: (agent: Agent) => void;
} 