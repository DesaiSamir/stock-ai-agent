"use client";

import React, { useState } from 'react';
import { Box, Button, Chip } from '@mui/material';
import { AgentCard } from './AgentCard';
import { StatusCardProps } from '@/types/agent-dashboard';
import { AgentStatus } from '@/types/agent';

const getStatusColor = (status: AgentStatus): "success" | "default" | "error" => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'INACTIVE':
      return 'default';
    case 'ERROR':
      return 'error';
    default:
      return 'default';
  }
};

export const StatusCard: React.FC<StatusCardProps> = ({ agentStatuses, onStartStop }) => {
  const isAnyActive = Object.values(agentStatuses).some(agent => agent.status === 'ACTIVE');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStartStop = async () => {
    setIsTransitioning(true);
    await onStartStop();
    setTimeout(() => setIsTransitioning(false), 1000); // Reset after 1s or use a better signal
  };

  return (
    <AgentCard title="Agent Status" headerColor="#2196f3">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {Object.entries(agentStatuses).map(([key, agent]) => (
            <Chip
              key={key}
              label={`${agent.name}: ${agent.status}`}
              color={getStatusColor(agent.status)}
              size="small"
            />
          ))}
        </Box>
        <Button
          variant="contained"
          color={isAnyActive ? "error" : "success"}
          size="small"
          onClick={handleStartStop}
          disabled={isTransitioning}
        >
          {isAnyActive ? "Stop Agents" : "Start Agents"}
        </Button>
      </Box>
    </AgentCard>
  );
}; 