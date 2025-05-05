"use client";

import { create } from "zustand";
import type { QuoteData } from "@/types/tradestation";
import { Candlestick } from "@/types/candlestick";

interface StoredMarketData {
  barData: Record<string, Candlestick[]>;
  quotes: Record<string, QuoteData>;
  lastUpdated: Record<string, number>; // Timestamp of last update for each symbol
  currentSymbol: string | null;
}

const STORAGE_KEY = "market-data";
const DATA_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

const defaultState: StoredMarketData = {
  barData: {},
  quotes: {},
  lastUpdated: {},
  currentSymbol: null,
};

// Helper function to save state to localStorage
const saveToStorage = (state: Partial<StoredMarketData>) => {
  if (typeof window === "undefined") return;

  try {
    const currentData = loadFromStorage();
    const dataToSave = {
      ...currentData,
      ...state,
      lastUpdated: {
        ...currentData.lastUpdated,
        ...(state.lastUpdated || {}),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error("Failed to save market data to storage:", error);
  }
};

// Helper function to load state from localStorage
const loadFromStorage = (): StoredMarketData => {
  if (typeof window === "undefined") return defaultState;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultState;

    const data = JSON.parse(stored) as StoredMarketData;

    // Clean up expired data
    const now = Date.now();
    const cleanedData = {
      ...defaultState,
      ...data,
      barData: { ...data.barData },
      quotes: { ...data.quotes },
      lastUpdated: { ...data.lastUpdated },
    };

    Object.keys(cleanedData.lastUpdated).forEach((symbol) => {
      if (now - cleanedData.lastUpdated[symbol] > DATA_EXPIRY_TIME) {
        delete cleanedData.barData[symbol];
        delete cleanedData.quotes[symbol];
        delete cleanedData.lastUpdated[symbol];
      }
    });

    return cleanedData;
  } catch (error) {
    console.error("Failed to load market data from storage:", error);
    return defaultState;
  }
};

// Load initial state from storage
const initialState = loadFromStorage();

interface MarketDataState extends StoredMarketData {
  updateBarData: (symbol: string, data: Candlestick[]) => void;
  updateQuote: (symbol: string, quote: QuoteData) => void;
  clearSymbolData: (symbol: string) => void;
  clearAllData: () => void;
  getBarData: (symbol: string) => Candlestick[] | null;
  getQuote: (symbol: string) => QuoteData | null;
  isDataFresh: (symbol: string) => boolean;
  setCurrentSymbol: (symbol: string | null) => void;
  getCurrentSymbol: () => string | null;
  dataExpiryTime: number;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

export const useMarketDataStore = create<MarketDataState>((set, get) => ({
  // Initial state
  barData: initialState.barData,
  quotes: initialState.quotes,
  lastUpdated: initialState.lastUpdated,
  currentSymbol: initialState.currentSymbol,
  dataExpiryTime: DATA_EXPIRY_TIME,

  updateBarData: (symbol: string, data: Candlestick[]) => {
    if (!symbol || !Array.isArray(data)) {
      console.error("Invalid data provided to updateBarData:", {
        symbol,
        data,
      });
      return;
    }

    const formattedData = data.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    if (formattedData.length === 0) {
      console.warn("No valid data points after formatting");
      return;
    }

    set((state) => {
      const newState = {
        barData: {
          ...state.barData,
          [symbol]: formattedData,
        },
        lastUpdated: {
          ...state.lastUpdated,
          [symbol]: Date.now(),
        },
      };

      // Save to storage
      saveToStorage(newState);

      return newState;
    });
  },

  updateQuote: (symbol: string, quote: QuoteData) => {
    set((state) => {
      const newState = {
        quotes: {
          ...state.quotes,
          [symbol]: quote,
        },
        lastUpdated: {
          ...state.lastUpdated,
          [symbol]: Date.now(),
        },
      };
      saveToStorage(newState);
      return newState;
    });
  },

  clearSymbolData: (symbol: string) => {
    set((state) => {
      const { barData, quotes, lastUpdated } = state;
      const newBarData = { ...barData };
      const newQuotes = { ...quotes };
      const newLastUpdated = { ...lastUpdated };

      delete newBarData[symbol];
      delete newQuotes[symbol];
      delete newLastUpdated[symbol];

      const newState = {
        barData: newBarData,
        quotes: newQuotes,
        lastUpdated: newLastUpdated,
        currentSymbol:
          state.currentSymbol === symbol ? null : state.currentSymbol,
      };

      saveToStorage(newState);
      return newState;
    });
  },

  clearAllData: () => {
    localStorage.removeItem(STORAGE_KEY);
    set(defaultState);
  },

  getBarData: (symbol: string) => {
    const { barData, lastUpdated } = get();
    if (!barData[symbol] || !isDataFresh(lastUpdated[symbol])) {
      return null;
    }
    return barData[symbol];
  },

  getQuote: (symbol: string) => {
    const { quotes, lastUpdated } = get();
    if (!quotes[symbol] || !isDataFresh(lastUpdated[symbol])) {
      return null;
    }
    return quotes[symbol];
  },

  isDataFresh: (symbol: string) => {
    const lastUpdate = get().lastUpdated[symbol];
    if (!lastUpdate) return false;

    const now = Date.now();
    const age = now - lastUpdate;
    const maxAge = get().dataExpiryTime;

    const hasData = get().barData[symbol]?.length > 0;

    return hasData && age < maxAge;
  },

  setCurrentSymbol: (symbol: string | null) => {
    set(() => {
      const newState = { currentSymbol: symbol };
      saveToStorage(newState);
      return newState;
    });
  },

  getCurrentSymbol: () => get().currentSymbol,

  loadFromStorage: () => {
    try {
      const storedData = loadFromStorage();
      set(storedData);
    } catch (error) {
      console.error("Error loading market data from storage:", error);
      localStorage.removeItem(STORAGE_KEY);
      set(defaultState);
    }
  },

  saveToStorage: () => {
    const state = get();
    saveToStorage({
      barData: state.barData,
      quotes: state.quotes,
      lastUpdated: state.lastUpdated,
      currentSymbol: state.currentSymbol,
    });
  },
}));

// Helper function to check if data is fresh
function isDataFresh(timestamp: number | undefined): boolean {
  if (!timestamp) return false;
  return Date.now() - timestamp <= DATA_EXPIRY_TIME;
}
