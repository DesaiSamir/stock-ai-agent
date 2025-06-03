export interface Message {
  id: string;
  type: 'text' | 'error' | 'success' | 'trading-update';
  content: string;
  timestamp: string;
  role: 'user' | 'assistant' | 'system';
  conversationId: string;
  metadata?: {
    symbol?: string;
    messageType?: string;
    data?: Record<string, unknown>;
  };
}

export function createTextMessage(content: string, conversationId: string = 'default'): Message {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    content,
    role: 'assistant',
    timestamp: new Date().toISOString(),
    conversationId
  };
}

export function createTradingUpdateMessage(
  content: string,
  metadata: {
    symbol: string;
    messageType: 'market-data' | 'news-analysis' | 'trading-signal' | 'portfolio-update';
    data: Record<string, unknown>;
  },
  conversationId: string = 'default'
): Message {
  return {
    id: crypto.randomUUID(),
    type: 'trading-update',
    content,
    role: 'system',
    timestamp: new Date().toISOString(),
    conversationId,
    metadata
  };
}

export function createErrorMessage(content: string, conversationId: string = 'default'): Message {
  return {
    id: crypto.randomUUID(),
    type: 'error',
    content,
    role: 'system',
    timestamp: new Date().toISOString(),
    conversationId
  };
}

export function createSuccessMessage(content: string, conversationId: string = 'default'): Message {
  return {
    id: crypto.randomUUID(),
    type: 'success',
    content,
    role: 'system',
    timestamp: new Date().toISOString(),
    conversationId
  };
} 