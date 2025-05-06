import { useState, useEffect } from 'react';
import { AgentOrchestrator } from '@/agents/AgentOrchestrator';

export function useOrchestrator() {
  const [orchestrator, setOrchestrator] = useState<AgentOrchestrator | null>(null);

  useEffect(() => {
    // Get the orchestrator instance from the window object
    if (window.orchestrator) {
      setOrchestrator(window.orchestrator);
    }
  }, []);

  return orchestrator;
} 