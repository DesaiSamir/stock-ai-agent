import type { ToolType } from './tools';

export const ActionTypes = {
  // Market Analysis Actions
  GET_MARKET_DATA: 'GET_MARKET_DATA',
  START_MARKET_ANALYSIS: 'START_MARKET_ANALYSIS',
  ANALYZE_MARKET: 'ANALYZE_MARKET',
  PERFORM_TECHNICAL_ANALYSIS: 'PERFORM_TECHNICAL_ANALYSIS',
  ANALYZE_NEWS: 'ANALYZE_NEWS',

  // Trade Execution Actions
  START_TRADE_EXECUTION: 'START_TRADE_EXECUTION',
  EXECUTE_TRADE: 'EXECUTE_TRADE',
  ASSESS_RISK: 'ASSESS_RISK',
  VALIDATE_TRADE: 'VALIDATE_TRADE',
  CONFIRM_TRADE: 'CONFIRM_TRADE',

  // Portfolio Management Actions
  GET_PORTFOLIO: 'GET_PORTFOLIO',
  VIEW_PORTFOLIO: 'VIEW_PORTFOLIO',
  UPDATE_PORTFOLIO: 'UPDATE_PORTFOLIO',
  REBALANCE_PORTFOLIO: 'REBALANCE_PORTFOLIO',
  GET_POSITIONS: 'GET_POSITIONS',
  UPDATE_POSITIONS: 'UPDATE_POSITIONS',

  // Market Data Actions
  GET_HISTORICAL_DATA: 'GET_HISTORICAL_DATA',
  GET_REAL_TIME_DATA: 'GET_REAL_TIME_DATA',
  GET_MARKET_INDICATORS: 'GET_MARKET_INDICATORS',
  GET_MARKET_SENTIMENT: 'GET_MARKET_SENTIMENT',

  // Risk Management Actions
  ASSESS_PORTFOLIO_RISK: 'ASSESS_PORTFOLIO_RISK',
  CALCULATE_POSITION_SIZE: 'CALCULATE_POSITION_SIZE',
  SET_STOP_LOSS: 'SET_STOP_LOSS',
  SET_TAKE_PROFIT: 'SET_TAKE_PROFIT',

  // News and Events Actions
  GET_MARKET_NEWS: 'GET_MARKET_NEWS',
  ANALYZE_NEWS_IMPACT: 'ANALYZE_NEWS_IMPACT',
  GET_ECONOMIC_CALENDAR: 'GET_ECONOMIC_CALENDAR',
  ANALYZE_EVENT_IMPACT: 'ANALYZE_EVENT_IMPACT'
} as const;

export type ActionType = typeof ActionTypes[keyof typeof ActionTypes];

export interface ActionContext {
  requestId: string;
  timestamp: string;
  source: string;
  actionId?: string;
}

export interface ActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface ActionConfig {
  name: string;
  description: string;
  requiredTools: ToolType[];
  optionalTools?: ToolType[];
}

export interface ActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  toolResults?: Record<ToolType, ActionResult>;
  timestamp: string;
}

export interface ActionPayload {
  [key: string]: unknown;
}

export interface ActionHandler {
  handle: (payload: ActionPayload, context: ActionContext) => Promise<ActionResult>;
} 