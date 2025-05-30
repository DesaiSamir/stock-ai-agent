"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/core/ThemeProvider";
import { ThemeToggle } from "@/components/core/ThemeToggle";
import { AppBar, Toolbar, Typography, Box, Button, TextField } from "@mui/material";

import { useSessionStore } from "@/store/session";
import { useMarketDataStore } from '@/store/market-data';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { connect, isConnected, isConnecting } = useSessionStore();
  const [mounted, setMounted] = useState(false);
  const { currentSymbol, setCurrentSymbol } = useMarketDataStore();
  const [input, setInput] = useState(currentSymbol || '');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setInput(currentSymbol || '');
  }, [currentSymbol]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value.toUpperCase());
  };

  const handleInputBlur = () => {
    if (input) setCurrentSymbol(input);
  };

  // Don't render connection-dependent UI until after hydration
  if (!mounted || typeof window === "undefined") {
    return (
      <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar variant="dense">
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Stock AI Agent
            </Typography>
            <Button variant="contained" color="primary" disabled>
              Loading...
            </Button>
          </Toolbar>
        </AppBar>
        {children}
      </Box>
    );
  }

  return (
    <ThemeProvider>
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          color: "text.primary",
        }}
      >
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar variant="dense">
            <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
              Stock AI Agent
            </Typography>
            <Button
              variant="contained"
              color={isConnected ? "success" : "primary"}
              onClick={connect}
              disabled={isConnecting || isConnected}
              sx={{ mr: 2 }}
            >
              {isConnected
                ? "TradeStation Connected"
                : isConnecting
                  ? "Connecting..."
                  : "Connect TradeStation"}
            </Button>
            <TextField
              label="Symbol"
              value={input}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={e => {
                if (e.key === 'Enter') handleInputBlur();
              }}
              size="small"
              sx={{ mr: 2, minWidth: 100 }}
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <ThemeToggle />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, overflow: "hidden" }}>
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
};
