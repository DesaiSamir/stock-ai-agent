import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSystemPrompt } from '@/prompts';
import type { Message, MessageType } from '@/types/chat';

interface ChatState {
  messages: Message[];
  loading: boolean;
  addMessage: (message: Message) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
}

const initialMessages: Message[] = [
  {
    id: '0',
    type: 'text',
    content: getSystemPrompt(),
    role: 'system',
    timestamp: new Date().toISOString(),
    conversationId: '1'
  },
  {
    id: '1',
    type: 'text',
    content: 'Hello! I\'m your AI trading assistant. I can help you analyze market data and make informed trading decisions. What would you like to know?',
    role: 'assistant',
    timestamp: new Date().toISOString(),
    conversationId: '1'
  }
];

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: initialMessages,
      loading: false,
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message]
        })),
      removeMessage: (id) =>
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== id)
        })),
      clearMessages: () =>
        set(() => ({
          messages: initialMessages,
        })),
      setLoading: (loading) =>
        set(() => ({
          loading,
        })),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);

// Re-export the Message type
export type { Message, MessageType }; 