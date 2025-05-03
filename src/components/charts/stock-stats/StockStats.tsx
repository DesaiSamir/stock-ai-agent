"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useMarketDataStore } from "@/store/market-data";
import type { QuoteData } from "@/types/tradestation";

export const StockStats: React.FC = () => {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [symbol, setSymbol] = useState<string>("");

  useEffect(() => {
    // Set initial values
    const store = useMarketDataStore.getState();
    const currentSymbol = store.currentSymbol;
    if (currentSymbol) {
      setSymbol(currentSymbol);
      setQuote(store.getQuote(currentSymbol) || null);
    }

    // Subscribe to changes
    const unsubscribe = useMarketDataStore.subscribe((state) => {
      const newSymbol = state.currentSymbol;
      if (newSymbol) {
        setSymbol(newSymbol);
        setQuote(state.quotes[newSymbol] || null);
      }
    });

    return unsubscribe;
  }, []);

  if (!quote || !symbol) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 2,
        backgroundColor: "background.paper",
        borderRadius: 1,
      }}
    >
      <Typography variant="h6" component="div">
        {symbol}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Last Price: ${quote.Last?.toFixed(2)}
      </Typography>
      <Typography
        variant="body1"
        color={quote.NetChangePct >= 0 ? "success.main" : "error.main"}
      >
        Change: {quote.NetChangePct?.toFixed(2)}%
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Volume: {quote.Volume?.toLocaleString()}
      </Typography>
    </Box>
  );
}; 