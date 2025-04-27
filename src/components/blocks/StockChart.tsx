'use client';

import React from 'react';
import type { StockData } from '../../types/stock';
import { TimeIntervalSelector } from '../core/TimeIntervalSelector';
import { StockStats } from '../core/StockStats';
import { Chart } from '../core/Chart';
import { Box } from '@mui/material';

interface StockChartProps {
  data: StockData[];
}

export const StockChart: React.FC<StockChartProps> = ({ data }) => {
  const latestStock = data[0];

  return (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
      }}
    >
      <StockStats stock={latestStock} />
      
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <Chart data={data} />
      </Box>

      <TimeIntervalSelector />
    </Box>
  );
}; 