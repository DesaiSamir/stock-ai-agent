import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { AgentCard } from './AgentCard';
import { TradesCardProps } from '@/types/agent-dashboard';

export const TradesCard: React.FC<TradesCardProps> = ({ recentTrades }) => {
  return (
    <AgentCard title="Recent Trades" headerColor="#9c27b0">
      {recentTrades.map((trade, index) => (
        <Box
          key={index}
          sx={{
            p: 1,
            mb: 0.5,
            borderRadius: 1,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:last-child': { mb: 0 }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {trade.symbol}
            </Typography>
            <Chip
              label={trade.action}
              color={trade.action === 'BUY' ? 'success' : 'error'}
              size="small"
            />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Shares
              </Typography>
              <Typography variant="body2">
                {trade.quantity}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Price
              </Typography>
              <Typography variant="body2">
                ${trade.price.toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
              <Typography variant="body2">
                ${(trade.quantity * trade.price).toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Time
              </Typography>
              <Typography variant="body2">
                {new Date(trade.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <Typography variant="body2" color={trade.status === 'EXECUTED' ? 'success.main' : 'warning.main'}>
              {trade.status}
            </Typography>
          </Box>
        </Box>
      ))}
    </AgentCard>
  );
}; 