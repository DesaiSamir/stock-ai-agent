import { AgentOrchestrator } from '@/agents/AgentOrchestrator';
import { TradeSignal, TradeExecution, Position } from './agent';
import { AgentStatusDisplay } from './agent-dashboard';
import { Candlestick } from './candlestick';

export interface MonitoringStateEntry {
  isMonitoring: boolean;
  lastChecked: string;
}

export interface AgentMonitoringState {
  // State
  agentStatuses: Record<string, AgentStatusDisplay>;
  latestPrices: Record<string, Candlestick>;
  latestSignals: TradeSignal[];
  recentTrades: TradeExecution[];
  positions: Position[];
  orchestrator: AgentOrchestrator | null;
  monitoringState: Record<string, MonitoringStateEntry>;
  isOrchestratorRunning: boolean;
}

export interface AgentMonitoringActions {
  setOrchestrator: (orchestrator: AgentOrchestrator) => void;
  updateAgentStatuses: () => void;
  addTradeExecution: (trade: TradeExecution) => void;
  updatePrice: (symbol: string, price: Candlestick) => void;
  addSignal: (signal: TradeSignal) => void;
  toggleAgents: () => void;
  isSymbolBeingMonitored: (symbol: string) => boolean;
  setSymbolMonitoring: (symbol: string, isMonitoring: boolean) => void;
  getLastChecked: (symbol: string) => string | null;
  setOrchestratorRunning: (running: boolean) => void;
  clearSignals: () => void;
  clearTrades: () => void;
}

export type AgentMonitoringStore = AgentMonitoringState & AgentMonitoringActions;