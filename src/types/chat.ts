export interface Message {
  id: string;
  content: string;
  role: 'system' | 'user' | 'assistant' | 'developer';
  type: 'text' | 'error' | 'loading' | 'system';
  timestamp: string;
  conversationId: string;
} 