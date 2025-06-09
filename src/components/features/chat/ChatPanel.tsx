import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { ChatService } from '@/services/chat';
import ChatHeader from '@/components/features/chat/ChatHeader';
import { ChatInput } from '@/components/features/chat/ChatInput';
import { ChatMessageList } from '@/components/features/chat/ChatMessageList';
import { useChatStore, Message } from '@/store/chat';
import { ChatErrorBoundary } from './ChatErrorBoundary';

export const ChatPanel: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatHistoryRef = useRef<HTMLDivElement>(null!);
  const { messages, addMessage, clearMessages, setLoading: setStoreLoading } = useChatStore();
  const chatServiceRef = useRef<ChatService | null>(null);

  // Initialize chat service
  useEffect(() => {
    chatServiceRef.current = ChatService.getInstance();
    return () => {
      // Cleanup
      clearMessages();
    };
  }, [clearMessages]);

  // Auto-scroll to bottom after each message
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (input: string) => {
    if (!input.trim() || !chatServiceRef.current) return;
    
    setLoading(true);
    setStoreLoading(true);

    try {
      await chatServiceRef.current.processUserMessage(input);
      setInput('');
    } catch (error) {
      console.error('Failed to process message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'error',
        content: 'Sorry, I encountered an error while processing your message.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        conversationId: 'default'
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
      setStoreLoading(false);
    }
  };

  const clearHistory = () => {
    clearMessages();
  };

  return (
      <ChatErrorBoundary>
        {/* Left: Chat Window */}
        <Box
          sx={{
            flex: 1,
            maxWidth: { xs: '100%', md: '50%' },
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            borderRadius: 3,
            boxShadow: 1,
            mx: 'auto',
          }}
        >
          <Box sx={{ flexShrink: 0 }}>
            <ChatHeader onClear={clearHistory} loading={loading} />
          </Box>
          <Box 
            sx={{ 
              flex: 1,
              border: 2,
              borderColor: "background.paper",
              minHeight: 0, 
              display: 'flex', 
              p: 2,
              pb: 3
            }}>
            <ChatMessageList messages={messages} chatHistoryRef={chatHistoryRef} />
          </Box>
          <Box sx={{ flexShrink: 0, px: 2, py: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: '0 0 1rem 1rem' }}>
            <ChatInput
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setInput(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(input);
                }
              }}
              onSend={() => handleSubmit(input)}
              isLoading={loading}
            />
          </Box>
        </Box>
      </ChatErrorBoundary>
  );
};

export default ChatPanel; 