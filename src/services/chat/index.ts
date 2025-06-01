import { ENDPOINTS } from '@/constants/http';
import { httpService } from '../http-client';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'developer';
  content: string;
}

export interface ChatResponse {
  reply: string;
  history: ChatMessage[];
  toolsUsed?: unknown[];
  status: string;
}

export const chatService = {
  async sendMessage(messages: ChatMessage[], tools?: unknown[]): Promise<ChatResponse> {
    return httpService.post<ChatResponse>(ENDPOINTS.AI.CHAT, { messages, tools });
  },

  async clearHistory(): Promise<{ status: string; history: ChatMessage[] }> {
    return httpService.post<{ status: string; history: ChatMessage[] }>(ENDPOINTS.AI.CHAT_CLEAR);
  },
}; 