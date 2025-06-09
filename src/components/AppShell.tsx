"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider } from "@/theme/ThemeContext";
import { ThemeToggle } from "@/components/core/ThemeToggle";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { useSessionStore } from "@/store/session";
import { TickerBar } from "@/components/blocks/TickerBar";
import { AgentToolbar } from "@/components/blocks/AgentToolbar";
import { initializeApp } from "@/lib/init";
import { logger } from "@/utils/logger";
import type { AgentTabKey } from "@/constants/sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { connect, isConnected, isConnecting } = useSessionStore();
  const [mounted, setMounted] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentTabKey>("dashboard");

  useEffect(() => {
    setMounted(true);
    try {
      initializeApp();
    } catch (error) {
      logger.error({
        message: 'Failed to initialize app',
        error: new Error(error instanceof Error ? error.message : 'Unknown error')
      });
    }
  }, []);

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
            <ThemeToggle />
          </Toolbar>
        </AppBar>
        <TickerBar />
        <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
          <AgentToolbar onSelectAgent={setActiveAgent} activeAgent={activeAgent} />
          <Box component="main" sx={{ flexGrow: 1, overflow: "hidden" }}>
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};
