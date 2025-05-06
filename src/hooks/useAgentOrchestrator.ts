import { useEffect } from 'react';
import { AgentOrchestrator } from '@/agents/AgentOrchestrator';
import { useAgentMonitoringStore } from '@/store/agent-monitoring';
import { TradingAgent, TickerAgent, AnalysisAgent, NewsAgent } from '@/types/agent';
import { Candlestick } from '@/types/candlestick';

export function useAgentOrchestrator(orchestrator: AgentOrchestrator) {
  const {
    updateAgentStatuses,
    addTradeExecution,
    updatePrice,
    addSignal
  } = useAgentMonitoringStore();

  useEffect(() => {
    const setupEventListeners = () => {
      orchestrator.on('started', () => {
        console.log('Orchestrator started');
        updateAgentStatuses();
      });

      orchestrator.on('stopped', () => {
        console.log('Orchestrator stopped');
        updateAgentStatuses();
      });

      orchestrator.on('error', (error: Error) => {
        console.error('Orchestrator error:', error);
        updateAgentStatuses();
      });

      // Get agent instances with proper typing
      const tradingAgent = orchestrator['tradingAgent'] as TradingAgent;
      const tickerAgent = orchestrator['tickerAgent'] as TickerAgent;
      const analysisAgent = orchestrator['analysisAgent'] as AnalysisAgent;
      const newsAgent = orchestrator['newsAgent'] as NewsAgent;

      tradingAgent.on('tradeExecuted', addTradeExecution);
      tickerAgent.on('priceUpdate', (data: Candlestick) => updatePrice(data.symbol, data));
      analysisAgent.on('analysisComplete', addSignal);
      newsAgent.on('newsSignal', addSignal);
    };

    // Setup initial state and listeners
    updateAgentStatuses();
    setupEventListeners();

    // Cleanup function
    return () => {
      orchestrator.removeAllListeners();
      orchestrator['tradingAgent'].removeAllListeners();
      orchestrator['tickerAgent'].removeAllListeners();
      orchestrator['analysisAgent'].removeAllListeners();
      orchestrator['newsAgent'].removeAllListeners();
    };
  }, [orchestrator, updateAgentStatuses, addTradeExecution, updatePrice, addSignal]);
} 