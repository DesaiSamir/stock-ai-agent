import React, { useEffect, useState } from "react";
import { Box, TextField } from "@mui/material";
import { useMarketDataStore } from "@/store/market-data";
import { TimeIntervalSelector } from "@/components/blocks/TimeIntervalSelector";

export function TickerBar() {
  const { currentSymbol, setCurrentSymbol } = useMarketDataStore();
  const [input, setInput] = useState(currentSymbol || '');

  useEffect(() => {
    setInput(currentSymbol || '');
  }, [currentSymbol]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value.toUpperCase());
  };

  const handleInputBlur = () => {
    if (input) setCurrentSymbol(input);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, borderBottom: 1, borderColor: 'divider', gap: 2 }}>
      <TextField
        label="Symbol"
        value={input}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={e => {
          if (e.key === 'Enter') handleInputBlur();
        }}
        size="small"
        sx={{ minWidth: 100 }}
        slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
      />
      <TimeIntervalSelector />
      {/* Add more controls here in the future */}
    </Box>
  );
} 