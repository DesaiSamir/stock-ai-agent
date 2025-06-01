import React from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { TimeInterval } from "@/types/stock";
import { useMarketDataStore } from "@/store/market-data";

const intervals: TimeInterval[] = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "1d",
  "1w",
  "1M",
];

export const TimeIntervalSelector: React.FC = () => {
  const { currentInterval, setCurrentInterval } = useMarketDataStore();
  return (
      <ToggleButtonGroup
        value={currentInterval.interval}
        exclusive
        onChange={(_, newValue) => {
          if (newValue !== null) setCurrentInterval(newValue);
        }}
        size="small"
      sx={(theme) => ({
        background: theme.palette.background.paper,
        borderRadius: 1.5,
        boxShadow: 1,
        px: 0.5,
        py: 0,
        minHeight: 40,
        height: 40,
        gap: 0.25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& .MuiToggleButton-root': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.palette.text.secondary,
          border: 'none',
          borderRadius: 1,
          fontWeight: 400,
          fontSize: { xs: '0.8rem', sm: '0.92rem' },
          px: 0.5,
          mx: 0.1,
          minWidth: 28,
          minHeight: 28,
          height: 28,
          lineHeight: 1.1,
          letterSpacing: 0.5,
          transition: 'background 0.2s',
          '&.Mui-selected': {
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.action.selected,
            boxShadow: 2,
            },
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        },
      })}
      className="shadow-sm"
      >
        {intervals.map((interval) => (
        <ToggleButton key={interval} value={interval} disableRipple>
          {interval.toUpperCase()}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
  );
};
