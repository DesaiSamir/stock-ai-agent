'use client';

import React from 'react';
import { ThemeProvider } from '../theme/ThemeContext';
import { ThemeToggle } from './core/ThemeToggle';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <Box 
        sx={{ 
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          color: 'text.primary'
        }}
      >
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar variant="dense">
            <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
              Stock AI Agent
            </Typography>
            <ThemeToggle />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden' }}>
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}; 