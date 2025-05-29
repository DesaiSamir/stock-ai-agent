import { AgentStatus, TradeSignal, TradeExecution } from './agent';
import { Candlestick } from './candlestick';

export interface Position {
  symbol: string;
  shares: number;
  averagePrice: number;
  totalCost: number;
}

export interface AgentStatusDisplay {
  name: string;
  status: AgentStatus;
  lastUpdated: Date;
}

export interface AgentCardProps {
  title: string;
  children: React.ReactNode;
  headerColor?: string;
}

export interface PriceCardProps {
  latestPrices: Record<string, Candlestick>;
}

export interface SignalsCardProps {
  latestSignals: TradeSignal[];
}

export interface TradesCardProps {
  recentTrades: TradeExecution[];
}

export interface StatusCardProps {
  agentStatuses: Record<string, AgentStatusDisplay>;
  onStartStop: () => void;
} 