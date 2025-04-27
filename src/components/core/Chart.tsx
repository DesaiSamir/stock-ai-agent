import React from 'react';
import type { StockData } from '../../types/stock';
import { Box } from '@mui/material';

interface ChartProps {
  data: StockData[];
}

export const Chart: React.FC<ChartProps> = ({ data }) => {
  // This is a placeholder. We'll implement the actual chart with a proper charting library
  return (
    <Box 
      className="h-full flex items-center justify-center"
      sx={{ 
        backgroundColor: 'background.paper',
        color: 'text.secondary',
      }}
    >
      Chart will be implemented with a charting library
    </Box>
  );
}; 