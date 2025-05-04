"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useMarketDataStore } from "@/store/market-data";
import type { QuoteData } from "@/types/tradestation";

export const StockStats: React.FC = () => {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [symbol, setSymbol] = useState<string>("");

  const formatNumber = (num?: number) => {
    if (num === undefined) return "-";
    return num.toFixed(2);
  };

  const formatVolume = (num?: number) => {
    if (num === undefined) return "-";
    // Format with commas but no decimal places
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
      useGrouping: true,
    }).format(num);
  };

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
    return (
      <Box
        sx={{ height: "40px", display: "flex", alignItems: "center", px: 2 }}
      >
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h6" sx={{ mr: 2 }}>
          {symbol}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          O {formatNumber(quote.Open)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          H {formatNumber(quote.High)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          L {formatNumber(quote.Low)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          V {formatVolume(quote.Volume)}
        </Typography>
      </Box>
      <Typography
        variant="h6"
        color={quote.Close >= quote.Open ? "success.main" : "error.main"}
      >
        ${formatNumber(quote.Close)}
      </Typography>
    </Box>
  );
};
