import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

interface ChatHeaderProps {
  title?: string;
  onClear: () => void;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title = 'AI Chat Assistant',
  onClear,
  loading = false,
  icon
}) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      px: 4,
      py: 1,
      bgcolor: 'background.paper',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      boxShadow: 1,
      borderBottom: 1,
      borderColor: 'divider',
      minHeight: 40,
    }}
  >
    <Box display="flex" alignItems="center" gap={1.5}>
      {icon || <SmartToyIcon sx={{ fontSize: 22, color: 'primary.main' }} />}
      <Box
        component="span"
        sx={{
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: '-0.5px',
          color: 'text.primary',
        }}
      >
        {title}
      </Box>
    </Box>
    <Tooltip title="Clear chat" arrow>
      <span>
        <IconButton onClick={onClear} disabled={loading} size="small" sx={{ color: 'primary.main', ml: 1 }}>
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  </Box>
);

export default ChatHeader; 