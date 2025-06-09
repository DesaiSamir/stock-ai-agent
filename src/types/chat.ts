export type MessageType = 'text' | 'error' | 'success' | 'trading-update' | 'tool_result' | 'analysis_result';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  type: MessageType;
  isIntermediate?: boolean;
  timestamp: string;
  conversationId?: string;
} 