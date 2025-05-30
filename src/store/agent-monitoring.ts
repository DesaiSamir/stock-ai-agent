"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';
import { AgentOrchestrator } from '@/agents/AgentOrchestrator';
import { TradeSignal, TradeExecution } from '@/types/agent';
import { Candlestick } from '@/types/candlestick';
import { AgentMonitoringStore, AgentMonitoringState } from '@/types/store';
import { AgentStatusDisplay } from '@/types/agent-dashboard';

// Global orchestrator instance
let orchestratorInstance: AgentOrchestrator | null = null;

// Define the persisted state type
type PersistedState = Pick<AgentMonitoringState, 
  'latestPrices' | 
  'latestSignals' | 
  'recentTrades' | 
  'positions' | 
  'monitoringState' |
  'isOrchestratorRunning'
>;

const INITIAL_STATE: AgentMonitoringState = {
  agentStatuses: {},
  latestPrices: {},
  latestSignals: [],
  recentTrades: [],
  positions: [],
  orchestrator: null,
  monitoringState: {},
  isOrchestratorRunning: false,
};

export const useAgentMonitoringStore = create<AgentMonitoringStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setOrchestrator: (orchestrator: AgentOrchestrator) => {
        // Initialize the orchestrator with store interface
        orchestrator.setStore({
          isOrchestratorRunning: get().isOrchestratorRunning,
          setOrchestratorRunning: (running: boolean) => {
            const current = get().isOrchestratorRunning;
            if (current !== running) {
              console.log(`Setting orchestrator running state: ${running}`);
              set({ isOrchestratorRunning: running });
            }
          }
        });
        
        orchestratorInstance = orchestrator;
        set({ orchestrator }); // Don't reset running state when setting new orchestrator
      },

      setOrchestratorRunning: (running: boolean) => {
        const current = get().isOrchestratorRunning;
        if (current !== running) {
          console.log(`Setting orchestrator running state: ${running}`);
          set({ isOrchestratorRunning: running });
        }
      },

      updateAgentStatuses: () => {
        if (!orchestratorInstance) return;

        try {
          const rawStatuses = orchestratorInstance.getAgentStatuses();
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
          const positions = orchestratorInstance.getPositions();
          
          // Only update if we have valid statuses
          if (Object.keys(statuses).length > 0) {
            set({
              agentStatuses: statuses,
              positions: positions
            });
          }
        } catch (error) {
          console.error('Error updating agent statuses:', error);
        }
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

      toggleAgents: async () => {
        if (!orchestratorInstance) return;
        
        try {
          const { isOrchestratorRunning } = get();
          
          if (isOrchestratorRunning) {
            // First update local state to prevent multiple stops
            set({ isOrchestratorRunning: false });
            await orchestratorInstance.stop();
          } else {
            // First update local state to prevent multiple starts
            set({ isOrchestratorRunning: true });
            await orchestratorInstance.start();
          }
          
          // Update statuses after a short delay to ensure agents have settled
          setTimeout(() => {
            get().updateAgentStatuses();
          }, 500);
        } catch (error) {
          console.error('Error toggling agents:', error);
          // Revert state on error
          const { isOrchestratorRunning } = get();
          set({ isOrchestratorRunning: !isOrchestratorRunning });
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
      },

      clearSignals: () => set({ latestSignals: [] }),

      clearTrades: () => set({ recentTrades: [] }),
    }),
    {
      name: 'agent-monitoring-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedState => ({
        latestPrices: state.latestPrices,
        latestSignals: state.latestSignals,
        recentTrades: state.recentTrades,
        positions: state.positions,
        monitoringState: state.monitoringState,
        isOrchestratorRunning: state.isOrchestratorRunning,
      }),
    }
  )
); 