"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import { AgentOrchestrator } from '@/agents/AgentOrchestrator';
import { TradeSignal, TradeExecution } from '@/types/agent';
import { Candlestick } from '@/types/candlestick';
import { AgentMonitoringStore } from '@/types/store';
import { AgentStatusDisplay } from '@/types/agent-dashboard';

const INITIAL_STATE = {
  agentStatuses: {},
  latestPrices: {},
  latestSignals: [],
  recentTrades: [],
  positions: [],
  orchestrator: null,
  monitoringState: {},
};

export const useAgentMonitoringStore = create(
  persist<AgentMonitoringStore>(
    (set, get) => ({
      ...INITIAL_STATE,

      setOrchestrator: (orchestrator: AgentOrchestrator) => {
        set({ orchestrator });
      },

      updateAgentStatuses: () => {
        const { orchestrator } = get();
        if (!orchestrator) return;

        const rawStatuses = orchestrator.getAgentStatuses();
        console.log('Raw agent statuses:', rawStatuses);
        
        // Transform the raw statuses into the expected format
        const statuses = Object.entries(rawStatuses).reduce((acc, [key, config]) => {
          acc[key] = {
            name: config.name,
            status: config.status,
            lastUpdated: config.lastUpdated
          };
          return acc;
        }, {} as Record<string, AgentStatusDisplay>);
        
        console.log('Transformed agent statuses:', statuses);
        const positions = orchestrator.getPositions();
        
        set({
          agentStatuses: statuses,
          positions: positions
        });
      },

      addTradeExecution: (trade: TradeExecution) => {
        set(state => ({
          recentTrades: [trade, ...state.recentTrades].slice(0, 10)
        }));
        get().updateAgentStatuses();
      },

      updatePrice: (symbol: string, price: Candlestick) => {
        set(state => ({
          latestPrices: {
            ...state.latestPrices,
            [symbol]: price
          }
        }));
      },

      addSignal: (signal: TradeSignal) => {
        set(state => ({
          latestSignals: [signal, ...state.latestSignals].slice(0, 10)
        }));
      },

      toggleAgents: () => {
        const { orchestrator, agentStatuses } = get();
        if (!orchestrator) return;

        const isAnyActive = Object.values(agentStatuses).some(agent => agent.status === 'ACTIVE');
        if (isAnyActive) {
          orchestrator.stop();
        } else {
          orchestrator.start();
        }
      },

      isSymbolBeingMonitored: (symbol: string): boolean => {
        const state = get();
        return state.monitoringState[symbol]?.isMonitoring || false;
      },

      setSymbolMonitoring: (symbol: string, isMonitoring: boolean) => {
        set(state => ({
          monitoringState: {
            ...state.monitoringState,
            [symbol]: {
              isMonitoring,
              lastChecked: new Date().toISOString()
            }
          }
        }));
      },

      getLastChecked: (symbol: string): string | null => {
        const state = get();
        return state.monitoringState[symbol]?.lastChecked || null;
      }
    }),
    {
      name: 'agent-monitoring-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
); 