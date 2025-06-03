export type ToolType = 
  | 'TECHNICAL_ANALYSIS'
  | 'FUNDAMENTAL_ANALYSIS'
  | 'RISK_ASSESSMENT'
  | 'POSITION_SIZING'
  | 'NEWS_ANALYSIS'
  | 'MARKET_DATA';

export interface ToolConfig {
  type: ToolType;
  description: string;
  payloadSchema: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
} 