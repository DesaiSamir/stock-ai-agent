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
    <div className="h-8 flex items-center px-2 border-t border-gray-800">
      <ToggleButtonGroup
        value={currentInterval.interval}
        exclusive
        onChange={(_, newValue) => {
          if (newValue !== null) setCurrentInterval(newValue);
        }}
        size="small"
        sx={{
          "& .MuiToggleButton-root": {
            color: "text.secondary",
            borderColor: "transparent",
            "&.Mui-selected": {
              color: "text.primary",
              backgroundColor: "action.selected",
            },
          },
        }}
      >
        {intervals.map((interval) => (
          <ToggleButton key={interval} value={interval}>
            {interval}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
};
