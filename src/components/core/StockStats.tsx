import React from 'react';
import type { StockData } from '../../types/stock';
import { Typography, Box } from '@mui/material';

interface StockStatsProps {
  stock: StockData;
}

export const StockStats: React.FC<StockStatsProps> = ({ stock }) => {
  return (
    <Box 
      className="h-8 flex items-center px-4 border-b border-gray-800"
      sx={{ backgroundColor: 'background.paper' }}
    >
      <div className="flex items-center space-x-4">
        <Typography variant="caption" color="text.secondary">
          O {stock.price.toFixed(2)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          H {stock.price.toFixed(2)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          L {stock.price.toFixed(2)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          C {stock.price.toFixed(2)}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Vol {stock.volume.toLocaleString()}
        </Typography>
      </div>
    </Box>
  );
}; 