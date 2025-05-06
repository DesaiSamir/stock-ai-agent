import React from 'react';
import { Box, Typography } from '@mui/material';
import { AgentCard } from './AgentCard';
import { PriceCardProps } from '@/types/agent-dashboard';

export const PriceCard: React.FC<PriceCardProps> = ({ latestPrices }) => {
  return (
    <AgentCard title="Latest Prices" headerColor="#4caf50">
      {Object.entries(latestPrices).map(([symbol, data]) => (
        <Box
          key={symbol}
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
              {symbol}
            </Typography>
            {/* <Typography variant="subtitle2" color={data.change >= 0 ? 'success.main' : 'error.main'}>
              {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
            </Typography> */}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Open</Typography>
              <Typography variant="body2">{data.open.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">High</Typography>
              <Typography variant="body2">{data.high.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Low</Typography>
              <Typography variant="body2">{data.low.toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Close</Typography>
              <Typography variant="body2">{data.close.toFixed(2)}</Typography>
            </Box>
          </Box>
        </Box>
      ))}
    </AgentCard>
  );
}; 