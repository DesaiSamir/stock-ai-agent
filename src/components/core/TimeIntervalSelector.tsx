import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

const intervals = ['30s', '1m', '2m', '3m', '5m', '10m', '15m', '30m', '1h', '2h', '4h'];

interface TimeIntervalSelectorProps {
  value?: string;
  onChange?: (interval: string) => void;
}

export const TimeIntervalSelector: React.FC<TimeIntervalSelectorProps> = ({
  value = '1m',
  onChange,
}) => {
  return (
    <div className="h-8 flex items-center px-2 border-t border-gray-800">
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, newValue) => onChange?.(newValue)}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            color: 'text.secondary',
            borderColor: 'transparent',
            '&.Mui-selected': {
              color: 'text.primary',
              backgroundColor: 'action.selected',
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