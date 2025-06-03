import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { ChatMessage as ChatMessageComponent } from '@/components/features/chat/ChatMessage';
import { Message } from '@/store/chat';

interface ChatMessageListProps {
  messages: Message[];
  chatHistoryRef?: React.RefObject<HTMLDivElement>;
}

export function ChatMessageList({ messages, chatHistoryRef }: ChatMessageListProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const refToUse = chatHistoryRef || internalRef;

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      if (refToUse.current) {
        refToUse.current.scrollTop = refToUse.current.scrollHeight;
      }
    }, 0);
  }, [messages, refToUse]);

  // Only show user/assistant messages
  const filteredMessages = messages.filter(
    (m) => m.role === 'user' || m.role === 'assistant'
  );

  return (
    <div
      ref={refToUse}
      className="flex-1 flex flex-col overflow-y-auto p-4"
      style={{ scrollbarGutter: 'stable' }}
    >
      <Box display="flex" flexDirection="column" gap={4}>
        {filteredMessages.map((message, index) => (
          <Box key={index}>
            <ChatMessageComponent
              role={message.role as 'user' | 'assistant'}
              content={message.content}
              isLoading={(message as unknown as { isLoading?: boolean }).isLoading}
              isIntermediate={message.isIntermediate}
            />
          </Box>
        ))}
      </Box>
    </div>
  );
} 