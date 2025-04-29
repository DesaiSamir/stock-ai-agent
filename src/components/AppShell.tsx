"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider } from "../theme/ThemeContext";
import { ThemeToggle } from "./core/ThemeToggle";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { useTradeStationStore } from "@/store/tradestation";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { connect, isConnected, isConnecting } = useTradeStationStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render connection-dependent UI until after hydration
  if (!mounted) {
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
        <Box component="main" sx={{ flexGrow: 1, overflow: "hidden" }}>
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
};
