"use client";

import React from 'react';
import { Box, Typography } from '@mui/material';
import { AgentCard } from './AgentCard';
import { useMarketDataStore } from '@/store/market-data';

export const PriceCard: React.FC = () => {
  const { quotes, currentSymbol } = useMarketDataStore();
  const priceData = currentSymbol ? quotes[currentSymbol] : undefined;

  return (
    <AgentCard title="Latest Prices" headerColor="#4caf50">
      {priceData ? (
        <Box
          key={currentSymbol}
          sx={{
            p: 1,
            mb: 0.5,
            borderRadius: 1,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:last-child': { mb: 0 }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {currentSymbol}
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Bid</Typography>
              <Typography variant="body2">{priceData.Bid?.toFixed(2) ?? '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Ask</Typography>
              <Typography variant="body2">{priceData.Ask?.toFixed(2) ?? '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Last</Typography>
              <Typography variant="body2">{priceData.Last?.toFixed(2) ?? '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Open</Typography>
              <Typography variant="body2">{priceData.Open?.toFixed(2) ?? '-'}</Typography>
            </Box>
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">No price data available.</Typography>
      )}
    </AgentCard>
  );
}; 