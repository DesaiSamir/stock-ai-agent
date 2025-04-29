"use client";

import React from "react";
import { Typography, Box } from "@mui/material";
import type { QuoteData } from "@/types/tradestation";

interface StockStatsProps {
  quote?: QuoteData | null;
  symbol: string;
}

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

export const StockStats: React.FC<StockStatsProps> = ({ quote, symbol }) => {
  if (!quote) {
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
        {formatNumber(quote.Close)}
      </Typography>
    </Box>
  );
};
