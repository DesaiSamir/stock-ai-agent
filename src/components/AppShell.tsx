"use client";

import React from "react";
import { ThemeProvider } from "../theme/ThemeContext";
import { ThemeToggle } from "./core/ThemeToggle";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { useTradeStationStore } from "@/store/tradestation";
import { http } from "@/utils/http";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { isConnected, connect, setLiveQuotes } = useTradeStationStore();

  React.useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    async function fetchLiveQuotes() {
      // Example: fetch AAPL quote, expand as needed
      const res = await http.get("/api/tradestation/quote?symbols=AAPL");
      const data = await res.json();
      setLiveQuotes({ AAPL: data[0] });
    }
    if (isConnected) {
      fetchLiveQuotes();
      interval = setInterval(fetchLiveQuotes, 5000); // Poll every 5s
    }
    return () => interval && clearInterval(interval);
  }, [isConnected, setLiveQuotes]);

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
              disabled={isConnected}
              sx={{ mr: 2 }}
            >
              {isConnected ? "TradeStation Connected" : "Connect TradeStation"}
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
