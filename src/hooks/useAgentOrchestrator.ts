import { useEffect, useState } from 'react';
import { AgentOrchestrator } from '@/agents/AgentOrchestrator';
import { useAgentMonitoringStore } from '@/store/agent-monitoring';

// Extend Window interface to include our global orchestrator
declare global {
  interface Window {
    orchestrator?: AgentOrchestrator;
  }
}

export function useAgentOrchestrator() {
  const [isClient, setIsClient] = useState(false);
  const {
    updateAgentStatuses,
    addTradeExecution,
    updatePrice,
    addSignal,
    isOrchestratorRunning,
    setOrchestratorRunning
  } = useAgentMonitoringStore();

  // Handle client-side only initialization
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Skip if not client-side yet
    if (!isClient) return;

    // Get the orchestrator instance from the window object
    const orchestrator = window.orchestrator;
    if (!orchestrator) return;

    const setupEventListeners = () => {
      // Clear any existing listeners
      orchestrator.removeAllListeners();

      // Setup new listeners
      orchestrator.on('started', () => {
        setOrchestratorRunning(true);
        updateAgentStatuses();
      });

      orchestrator.on('stopped', () => {
        setOrchestratorRunning(false);
        updateAgentStatuses();
      });

      orchestrator.on('error', (error: Error) => {
        console.error('Orchestrator error:', error);
        updateAgentStatuses();
      });

      // Setup agent-specific event handlers
      orchestrator.on('tradeExecuted', addTradeExecution);
      orchestrator.on('priceUpdate', updatePrice);
      orchestrator.on('analysisComplete', addSignal);
      orchestrator.on('newsSignal', addSignal);

      // Initial status update
      updateAgentStatuses();
    };

    // Initialize event listeners
    setupEventListeners();

    // Cleanup
    return () => {
      if (orchestrator) {
        orchestrator.removeAllListeners();
      }
    };
  }, [isClient, updateAgentStatuses, addTradeExecution, updatePrice, addSignal, setOrchestratorRunning]);

  return {
    isRunning: isOrchestratorRunning,
    isInitialized: isClient
  };
} 