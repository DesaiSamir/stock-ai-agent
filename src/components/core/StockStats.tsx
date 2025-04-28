'use client';

import React from 'react';
import { Typography, Box } from '@mui/material';
import type { StockData } from '../../types/stock';

interface StockStatsProps {
  stock?: StockData;
}

const formatNumber = (num?: number) => {
  if (num === undefined) return '-';
  return num.toFixed(2);
};

const formatVolume = (num: number) => {
  // Format with commas but no decimal places
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(num);
};

export const StockStats: React.FC<StockStatsProps> = ({ stock }) => {
  if (!stock) {
    return (
      <Box sx={{ height: '40px', display: 'flex', alignItems: 'center', px: 2 }}>
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '40px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      px: 2,
      borderBottom: 1,
      borderColor: 'divider'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" sx={{ mr: 2 }}>{stock.symbol}</Typography>
        <Typography variant="body2" color="text.secondary">
          O {formatNumber(stock.open)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          H {formatNumber(stock.high)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          L {formatNumber(stock.low)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          V {formatVolume(stock.volume)}
        </Typography>
      </Box>
      <Typography 
        variant="h6" 
        color={stock.close >= stock.open ? 'success.main' : 'error.main'}
      >
        {formatNumber(stock.close)}
      </Typography>
    </Box>
  );
}; 