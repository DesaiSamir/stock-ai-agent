export type ToolType = 
  | 'MARKET_DATA'
  | 'TECHNICAL_ANALYSIS'
  | 'RISK_ASSESSMENT'
  | 'NEWS_ANALYSIS'
  | 'QUOTE_DATA';

export interface ToolConfig {
  type: ToolType;
  description: string;
  payloadSchema: Record<string, unknown>;
  prompt: string;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
} 