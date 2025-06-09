"use client";

import React from 'react';
import { Card, CardContent, Typography, Box, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export interface AgentCardProps {
  title: string;
  children: React.ReactNode;
  headerColor?: string;
  clearActionTitle?: string;
  onClearAction?: () => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ title, children, headerColor = '#1976d2', clearActionTitle, onClearAction }) => {
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
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
          {title}
        </Typography>
        {onClearAction && (
          <Tooltip title={clearActionTitle || 'Clear'}>
            <IconButton size="small" color="inherit" onClick={onClearAction}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
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