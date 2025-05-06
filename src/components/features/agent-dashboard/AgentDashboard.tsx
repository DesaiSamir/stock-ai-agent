import React from 'react';
import { Box } from '@mui/material';
import { AgentOrchestrator } from '@/agents/AgentOrchestrator';
import { useAgentMonitoringStore } from '@/store/agent-monitoring';
import { useAgentOrchestrator } from '@/hooks/useAgentOrchestrator';
import { StatusCard } from './StatusCard';
import { PriceCard } from './PriceCard';
import { SignalsCard } from './SignalsCard';
import { TradesCard } from './TradesCard';

interface AgentDashboardProps {
  orchestrator: AgentOrchestrator;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ orchestrator }) => {
  // Setup orchestrator listeners
  useAgentOrchestrator(orchestrator);

  // Get state from store
  const {
    agentStatuses,
    latestPrices,
    latestSignals,
    recentTrades,
    toggleAgents
  } = useAgentMonitoringStore();

  return (
    <Box sx={{ 
      height: '100%',
      maxHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      p: 1,
      pb: 3,
      gap: 1
    }}>
      {/* Status Card */}
      <Box sx={{ flexShrink: 0 }}>
        <StatusCard
          agentStatuses={agentStatuses}
          onStartStop={toggleAgents}
        />
      </Box>

      {/* Main Grid Container */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1.5,
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        pb: 4
      }}>
        <PriceCard latestPrices={latestPrices} />
        <SignalsCard latestSignals={latestSignals} />
        <TradesCard recentTrades={recentTrades} />
      </Box>
    </Box>
  );
};