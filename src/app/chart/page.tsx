"use client";

import React from "react";
import { Box } from "@mui/material";
import { useMarketDataStore } from "@/store/market-data";
import { DynamicStockChart } from "@/components/blocks/DynamicStockChart";

export default function ChartPage() {
  const { currentSymbol } = useMarketDataStore();

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Box
        sx={{
          flexGrow: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <DynamicStockChart symbol={currentSymbol} />
      </Box>
    </Box>
  );
};
