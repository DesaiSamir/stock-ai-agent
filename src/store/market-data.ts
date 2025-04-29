"use client";

import { create } from 'zustand';
import type { QuoteData } from '@/types/tradestation';
import type { StockData } from '@/types/stock';

interface StoredMarketData {
  barData: Record<string, StockData[]>;
  quotes: Record<string, QuoteData>;
  lastUpdated: Record<string, number>; // Timestamp of last update for each symbol
  currentSymbol: string | null;
}

const STORAGE_KEY = 'market_data';
const DATA_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const defaultState: StoredMarketData = {
  barData: {},
  quotes: {},
  lastUpdated: {},
  currentSymbol: null
};

// Helper functions for localStorage
const loadFromStorage = (): StoredMarketData => {
  if (typeof window === 'undefined') {
    return defaultState;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as StoredMarketData;
      
      // Clean up expired data
      const now = Date.now();
      Object.keys(data.lastUpdated).forEach(symbol => {
        if (now - data.lastUpdated[symbol] > DATA_EXPIRY_TIME) {
          delete data.barData[symbol];
          delete data.quotes[symbol];
          delete data.lastUpdated[symbol];
        }
      });
      
      return data;
    }
  } catch (error) {
    console.error('Failed to load market data from storage:', error);
  }
  return defaultState;
};

const saveToStorage = (state: StoredMarketData) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save market data to storage:', error);
  }
};

// Load initial state from storage
const initialState = loadFromStorage();

interface MarketDataState extends StoredMarketData {
  updateBarData: (symbol: string, data: StockData[]) => void;
  updateQuote: (symbol: string, quote: QuoteData) => void;
  clearSymbolData: (symbol: string) => void;
  clearAllData: () => void;
  getBarData: (symbol: string) => StockData[] | null;
  getQuote: (symbol: string) => QuoteData | null;
  isDataFresh: (symbol: string) => boolean;
  setCurrentSymbol: (symbol: string | null) => void;
  getCurrentSymbol: () => string | null;
}

export const useMarketDataStore = create<MarketDataState>((set, get) => ({
  // Initial state
  barData: initialState.barData,
  quotes: initialState.quotes,
  lastUpdated: initialState.lastUpdated,
  currentSymbol: initialState.currentSymbol,

  // Actions
  updateBarData: (symbol, data) => {
    const newState = {
      ...get(),
      barData: {
        ...get().barData,
        [symbol]: data
      },
      lastUpdated: {
        ...get().lastUpdated,
        [symbol]: Date.now()
      }
    };
    set(newState);
    saveToStorage(newState);
  },

  updateQuote: (symbol, quote) => {
    const newState = {
      ...get(),
      quotes: {
        ...get().quotes,
        [symbol]: quote
      },
      lastUpdated: {
        ...get().lastUpdated,
        [symbol]: Date.now()
      }
    };
    set(newState);
    saveToStorage(newState);
  },

  clearSymbolData: (symbol) => {
    const { barData, quotes, lastUpdated } = get();
    const newBarData = { ...barData };
    const newQuotes = { ...quotes };
    const newLastUpdated = { ...lastUpdated };

    delete newBarData[symbol];
    delete newQuotes[symbol];
    delete newLastUpdated[symbol];

    const newState = {
      ...get(),
      barData: newBarData,
      quotes: newQuotes,
      lastUpdated: newLastUpdated,
      currentSymbol: get().currentSymbol === symbol ? null : get().currentSymbol
    };

    set(newState);
    saveToStorage(newState);
  },

  clearAllData: () => {
    const newState = defaultState;
    set(newState);
    saveToStorage(newState);
  },

  getBarData: (symbol) => {
    const { barData, lastUpdated } = get();
    if (!barData[symbol] || !isDataFresh(lastUpdated[symbol])) {
      return null;
    }
    return barData[symbol];
  },

  getQuote: (symbol) => {
    const { quotes, lastUpdated } = get();
    if (!quotes[symbol] || !isDataFresh(lastUpdated[symbol])) {
      return null;
    }
    return quotes[symbol];
  },

  isDataFresh: (symbol) => {
    const { lastUpdated } = get();
    const lastUpdate = lastUpdated[symbol];
    if (!lastUpdate) return false;
    return Date.now() - lastUpdate <= DATA_EXPIRY_TIME;
  },

  setCurrentSymbol: (symbol) => {
    const newState = {
      ...get(),
      currentSymbol: symbol
    };
    set(newState);
    saveToStorage(newState);
  },

  getCurrentSymbol: () => get().currentSymbol
}));

// Helper function to check if data is fresh
function isDataFresh(timestamp: number | undefined): boolean {
  if (!timestamp) return false;
  return Date.now() - timestamp <= DATA_EXPIRY_TIME;
} 