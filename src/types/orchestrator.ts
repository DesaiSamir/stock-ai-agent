export type AgentType = 'ANALYSIS' | 'TRADING' | 'NEWS' | 'RISK';

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: Date;
  indicators?: Record<string, number>;
}

export interface AnalysisResult {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasons: string[];
  timestamp: Date;
}

export interface TradeExecution {
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: Date;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
}

export interface NewsData {
  title: string;
  content: string;
  source: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  timestamp: Date;
}

export interface AgentConfig {
  name: string;
  type: AgentType;
  tools: string[];
  actions: string[];
  execute: (query: Query) => Promise<Response>;
  initialize?: () => Promise<void>;
  stop?: () => Promise<void>;
}

export interface ActionConfig {
  name: string;
  description: string;
  requiredTools?: string[];
  optionalTools?: string[];
  payloadSchema?: Record<string, unknown>;
}

export interface ToolConfig {
  name: string;
  description: string;
  execute: (data: MarketData | NewsData | AnalysisResult) => Promise<AnalysisResult | TradeExecution>;
}

export interface Query {
  type: string;
  payload?: Record<string, unknown>;
}

export interface Response {
  success: boolean;
  data: MarketData | NewsData | AnalysisResult | TradeExecution | null;
  timestamp: Date;
  error?: Error;
}

export interface OrchestratorState {
  isRunning: boolean;
  activeAgents: Map<string, AgentConfig>;
  lastQuery: Query | null;
  lastResponse: Response | null;
  error: Error | null;
}

export interface OrchestratorConfig {
  name: string;
  description: string;
  actions: ActionConfig[];
  tools: string[];
} 