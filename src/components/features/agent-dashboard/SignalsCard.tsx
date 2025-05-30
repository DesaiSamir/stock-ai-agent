import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { AgentCard } from './AgentCard';
import { SignalsCardProps } from '@/types/agent-dashboard';
import { useAgentMonitoringStore } from '@/store/agent-monitoring';

export const SignalsCard: React.FC<SignalsCardProps> = ({ latestSignals }) => {
  const { clearSignals } = useAgentMonitoringStore();
  return (
    <AgentCard
      title="Latest Signals"
      headerColor="#ff9800"
      clearActionTitle="Clear Signals"
      onClearAction={clearSignals}
    >
      {latestSignals.map((signal, index) => (
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
              {signal.symbol}
            </Typography>
            <Chip
              label={signal.action}
              color={signal.action === 'BUY' ? 'success' : 'error'}
              size="small"
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Confidence
              </Typography>
              <Typography variant="body2">
                {(signal.confidence * 100).toFixed(1)}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Source
              </Typography>
              <Typography variant="body2">
                {signal.source}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Time
              </Typography>
              <Typography variant="body2">
                {new Date(signal.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
          </Box>
        </Box>
      ))}
    </AgentCard>
  );
}; 