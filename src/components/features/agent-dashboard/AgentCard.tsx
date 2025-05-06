import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { AgentCardProps } from '@/types/agent-dashboard';

export const AgentCard: React.FC<AgentCardProps> = ({ title, children, headerColor = '#1976d2' }) => {
  return (
    <Card sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        bgcolor: headerColor,
        p: 1,
        color: 'white'
      }}>
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
          {title}
        </Typography>
      </Box>
      <CardContent sx={{ 
        flex: 1,
        p: '8px !important',
        overflow: 'auto',
        minHeight: 0
      }}>
        {children}
      </CardContent>
    </Card>
  );
}; 