import { useState, useEffect } from 'react';
import { AgentOrchestrator } from '@/agents/AgentOrchestrator';
import { TradeSignal, TradeExecution } from '@/types/agent';
import { AgentStatusDisplay, Position } from '@/types/agent-dashboard';
import { Candlestick } from '@/types/candlestick';
import { useMarketDataStore } from '@/store/market-data';

export function useAgentMonitoring(orchestrator: AgentOrchestrator) {
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatusDisplay>>({});
  const [latestPrices, setLatestPrices] = useState<Record<string, Candlestick>>({});
  const [latestSignals, setLatestSignals] = useState<TradeSignal[]>([]);
  const [recentTrades, setRecentTrades] = useState<TradeExecution[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  
  const { currentSymbol } = useMarketDataStore();

  useEffect(() => {
    const updateAgentStatuses = () => {
      const statuses = orchestrator.getAgentStatuses();
      setAgentStatuses(statuses);
      setPositions([]);
    };

    const handleOrchestratorStarted = () => {
      console.log('Orchestrator started');
      updateAgentStatuses();
    };

    const handleOrchestratorStopped = () => {
      console.log('Orchestrator stopped');
      updateAgentStatuses();
    };

    const handleOrchestratorError = (error: Error) => {
      console.error('Orchestrator error:', error);
      updateAgentStatuses();
    };

    const handleTradeExecution = (trade: TradeExecution) => {
      setRecentTrades(prev => [trade, ...prev].slice(0, 10));
      updateAgentStatuses();
    };

    const handlePriceUpdate = (stockData: Candlestick) => {
      setLatestPrices(prev => ({
        ...prev,
        [currentSymbol || '']: stockData
      }));
    };

    const handleAnalysisSignal = (signal: TradeSignal) => {
      setLatestSignals(prev => [signal, ...prev].slice(0, 10));
    };

    const handleNewsSignal = (signal: TradeSignal) => {
      setLatestSignals(prev => [signal, ...prev].slice(0, 10));
    };

    // Subscribe to events
    orchestrator.on('started', handleOrchestratorStarted);
    orchestrator.on('stopped', handleOrchestratorStopped);
    orchestrator.on('error', handleOrchestratorError);
    orchestrator['tradingAgent'].on('tradeExecuted', handleTradeExecution);
    orchestrator['tickerAgent'].on('priceUpdate', handlePriceUpdate);
    orchestrator['analysisAgent'].on('analysisComplete', handleAnalysisSignal);
    orchestrator['newsAgent'].on('newsSignal', handleNewsSignal);

    // Update agent statuses periodically
    const statusInterval = setInterval(updateAgentStatuses, 1000);

    // Initial status update
    updateAgentStatuses();

    return () => {
      // Cleanup subscriptions
      orchestrator.removeListener('started', handleOrchestratorStarted);
      orchestrator.removeListener('stopped', handleOrchestratorStopped);
      orchestrator.removeListener('error', handleOrchestratorError);
      orchestrator['tradingAgent'].removeListener('tradeExecuted', handleTradeExecution);
      orchestrator['tickerAgent'].removeListener('priceUpdate', handlePriceUpdate);
      orchestrator['analysisAgent'].removeListener('analysisComplete', handleAnalysisSignal);
      orchestrator['newsAgent'].removeListener('newsSignal', handleNewsSignal);
      clearInterval(statusInterval);
    };
  }, [orchestrator, currentSymbol]);

  const toggleAgents = () => {
    const isAnyActive = Object.values(agentStatuses).some(agent => agent.status === 'ACTIVE');
    if (isAnyActive) {
      orchestrator.stop();
    } else {
      orchestrator.start();
    }
  };

  return {
    agentStatuses,
    latestPrices,
    latestSignals,
    recentTrades,
    positions,
    toggleAgents
  };
} 