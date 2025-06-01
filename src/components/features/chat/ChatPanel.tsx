import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import { chatService, ChatMessage } from '@/services/chat';
import ChatHeader from '@/components/features/chat/ChatHeader';
import { ChatInput } from '@/components/features/chat/ChatInput';
import { ChatMessageList } from '@/components/features/chat/ChatMessageList';

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI trading assistant.';

export const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatHistoryRef = useRef<HTMLDivElement>(null!);

  // Auto-scroll to bottom after each message
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const userMessage: ChatMessage = { role: 'user', content: input };
    try {
      const response = await chatService.sendMessage([...messages, userMessage]);
      setMessages(response.history);
      setInput('');
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    setLoading(true);
    try {
      await chatService.clearHistory();
      setMessages([
        { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
      ]);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        height: '100%',
        width: '100%',
        bgcolor: 'transparent',
        gap: 2,
        p: 1,
      }}
    >
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
          <ChatMessageList messages={messages.slice(1)} chatHistoryRef={chatHistoryRef} />
        </Box>
        <Box sx={{ flexShrink: 0, px: 2, py: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: '0 0 1rem 1rem' }}>
          <ChatInput
            value={input}
            onChange={e => setInput((e as React.ChangeEvent<HTMLTextAreaElement>).target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            onSend={sendMessage}
            isLoading={loading}
          />
        </Box>
      </Box>
      {/* Right: Placeholder for future automation/insights */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          borderRadius: 3,
          boxShadow: 0,
        }}
      >
        <Box color="text.secondary" fontSize={20} fontWeight={500}>
          {/* Placeholder content */}
          <span>Automation & Insights (coming soon)</span>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatPanel; 