import React from 'react';
import { Box, useTheme } from '@mui/material';
import { handleClipboardCopy } from '@/utils/chat';
import { ReactMarkdownRenderer } from '@/components/ui/markdown/ReactMarkdownRenderer';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
  isIntermediate?: boolean;
}

export function ChatMessage({ role, content, isLoading, isIntermediate }: ChatMessageProps) {
  const isUser = role === 'user';
  const theme = useTheme();
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems={isUser ? 'flex-end' : 'flex-start'}
      mb={2}
      sx={{
        opacity: isIntermediate ? 0.7 : 1,
        transition: 'opacity 0.3s ease'
      }}
    >
      {/* Role label */}
      <Box
        display="flex"
        alignItems="center"
        mb={0.5}
        fontSize={14}
        color={isUser ? 'purple.700' : 'grey.700'}
        fontWeight={500}
        gap={0.5}
      >
        <span>{isUser ? '👤' : '🤖'}</span>
        <span>{isUser ? 'You' : 'Assistant'}</span>
        {isUser && (
          <button
            onClick={() => handleClipboardCopy(content)}
            className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Copy to clipboard"
            style={{ fontSize: 16, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            📋
          </button>
        )}
      </Box>
      {/* Message bubble */}
      <Box
        sx={{
          bgcolor: isUser ? 'purple.100' : theme.palette.background.paper,
          color: isUser ? 'purple.900' : theme.palette.text.primary,
          borderRadius: 4,
          boxShadow: 1,
          px: 1,
          py: 1,
          maxWidth: '90%',
          fontSize: 17,
          fontWeight: 400,
          ml: isUser ? 'auto' : 0,
          mr: isUser ? 0 : 'auto',
          wordBreak: 'break-word',
          fontStyle: isIntermediate ? 'italic' : 'normal',
          borderLeft: isIntermediate ? `4px solid ${theme.palette.primary.main}` : 'none'
        }}
      >
        {isLoading ? (
          <Box display="flex" alignItems="center" gap={1} fontStyle="italic" color="purple.500">
            <Box
              component="span"
              sx={{
                width: 16,
                height: 16,
                border: '2px solid',
                borderColor: 'purple.500',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 1s linear infinite',
              }}
            />
            Processing...
          </Box>
        ) : (
          <ReactMarkdownRenderer content={content} role={role} />
        )}
      </Box>
    </Box>
  );
} 