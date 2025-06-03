import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSystemPrompt } from '@/prompts';

export interface Message {
  id: string;
  type: 'text' | 'error' | 'success' | 'trading-update';
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  conversationId: string;
  isIntermediate?: boolean;
  metadata?: {
    symbol?: string;
    messageType?: string;
    data?: Record<string, unknown>;
  };
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentMessage: Message | null;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  clearMessages: () => void;
}

const initialMessages: Message[] = [
  {
    id: '1',
    type: 'text',
    content: 'Hello! I\'m your AI trading assistant. I can help you analyze market data and make informed trading decisions. What would you like to know?',
    role: 'assistant',
    timestamp: new Date().toISOString(),
    conversationId: '1'
  },
  {
    id: '2',
    type: 'text',
    content: getSystemPrompt(),
    role: 'system',
    timestamp: new Date().toISOString(),
    conversationId: '1'
  }
];

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: initialMessages,
      isLoading: false,
      currentMessage: null,
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
          currentMessage: message
        })),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map(msg => 
            msg.id === id ? { ...msg, ...updates } : msg
          )
        })),
      removeMessage: (id) =>
        set((state) => ({
          messages: state.messages.filter(msg => msg.id !== id)
        })),
      setLoading: (isLoading) =>
        set(() => ({
          isLoading,
        })),
      clearMessages: () =>
        set(() => ({
          messages: initialMessages,
          currentMessage: null
        })),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ messages: state.messages }),
    }
  )
); 