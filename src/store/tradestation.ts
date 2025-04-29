"use client";

import { create } from 'zustand';

const STORAGE_KEY = 'tradestation_store';

interface StoredState {
  accessToken: string | null;
  refreshToken: string | null;
  userProfile: UserProfile | null;
  isConnected: boolean;
  expiresIn: number | null;
  tokenExpiration: number | null; // timestamp when token expires
}

const defaultState: StoredState = {
  accessToken: null,
  refreshToken: null,
  userProfile: null,
  isConnected: false,
  expiresIn: null,
  tokenExpiration: null
};

// Helper functions for localStorage
const loadFromStorage = (): StoredState => {
  if (typeof window === 'undefined') {
    return defaultState;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load TradeStation state from storage:', error);
  }
  return defaultState;
};

const saveToStorage = (state: StoredState) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save TradeStation state to storage:', error);
  }
};

const clearStorage = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear TradeStation state from storage:', error);
  }
};

// Load initial state from storage
const initialState = loadFromStorage();

interface WindowFeatures {
  width?: number;
  height?: number;
  left?: number;
  top?: number;
}

function openPopupWindow(url: string, title: string, features: WindowFeatures = {}) {
  const { width = 600, height = 700 } = features;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  
  return window.open(
    url,
    title,
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
  );
}

export interface LiveQuote {
  symbol: string;
  price: number;
  [key: string]: unknown;
}

export interface NewsItem {
  id: string;
  title: string;
  [key: string]: unknown;
}

export interface Prediction {
  id: string;
  symbol: string;
  [key: string]: unknown;
}

export interface Order {
  id: string;
  symbol: string;
  [key: string]: unknown;
}

export interface UserProfile {
  userid: string;
  [key: string]: unknown;
}

export interface TradeStationState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  currentSymbol: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  liveQuotes: Record<string, LiveQuote>;
  news: NewsItem[];
  predictions: Prediction[];
  orders: Order[];
  userProfile: UserProfile | null;
  expiresIn: number | null;
  tokenExpiration: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  setAccessToken: (token: string, expiresIn?: number) => void;
  setRefreshToken: (token: string) => void;
  setTokenExpiration: (expiresIn: number) => void;
  isTokenExpired: () => boolean;
  setLiveQuotes: (quotes: Record<string, LiveQuote>) => void;
  setNews: (news: NewsItem[]) => void;
  setPredictions: (predictions: Prediction[]) => void;
  setOrders: (orders: Order[]) => void;
  fetchQuotes: (symbols: string[]) => Promise<void>;
}

export const useTradeStationStore = create<TradeStationState>((set, get) => ({
  isConnected: initialState?.isConnected ?? false,
  isConnecting: false,
  error: null,
  accessToken: initialState?.accessToken ?? null,
  refreshToken: initialState?.refreshToken ?? null,
  userProfile: initialState?.userProfile ?? null,
  liveQuotes: {},
  news: [],
  predictions: [],
  orders: [],
  expiresIn: initialState?.expiresIn ?? null,
  tokenExpiration: initialState?.tokenExpiration ?? null,
  expiresAt: null,
  currentSymbol: null,

  connect: async () => {
    try {
      set({ isConnecting: true, error: null });

      const res = await fetch('/api/tradestation/login');
      if (!res.ok) {
        throw new Error('Failed to initiate login');
      }

      const { loginUrl } = await res.json();
      const popup = openPopupWindow(loginUrl, 'TradeStation Login');
      
      if (!popup) {
        throw new Error('Popup blocked. Please enable popups for this site.');
      }

      // Listen for messages from popup
      const handleMessage = async (event: MessageEvent) => {
        console.log({ data: event.data });
        if (event.origin !== window.location.origin) return;
        
        if (event.data?.type === 'TRADESTATION_AUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          
          const newState = {
            isConnected: true,
            isConnecting: false,
            error: null,
            accessToken: event.data.access_token,
            refreshToken: event.data.refresh_token,
            userProfile: event.data.profile,
            expiresIn: event.data.expires_in,
            tokenExpiration: Date.now() + (event.data.expires_in * 1000)
          };
          
          set(newState);
          
          saveToStorage(newState);
        }

        if (event.data?.type === 'TRADESTATION_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          
          const newState = {
            isConnected: false,
            isConnecting: false,
            error: event.data.error,
            accessToken: null,
            refreshToken: null,
            userProfile: null,
            expiresIn: null,
            tokenExpiration: null
          };
          
          set(newState);
          clearStorage();
        }
      };

      window.addEventListener('message', handleMessage);
      
    } catch (error) {
      console.error('Failed to initiate TradeStation login:', error);
      const newState = {
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect',
        accessToken: null,
        refreshToken: null,
        userProfile: null,
        expiresIn: null,
        tokenExpiration: null
      };
      
      set(newState);
      clearStorage();
    }
  },

  disconnect: () => {
    clearStorage();
    set({ 
      isConnected: false,
      isConnecting: false,
      error: null,
      accessToken: null,
      refreshToken: null,
      userProfile: null,
      expiresIn: null,
      tokenExpiration: null,
      liveQuotes: {},
      news: [],
      predictions: [],
      orders: []
    });
  },

  setAccessToken: (token: string, expiresIn?: number) => {
    const state = get();
    const newState = { 
      accessToken: token,
      refreshToken: state.refreshToken,
      userProfile: state.userProfile,
      isConnected: true,
      isConnecting: false,
      error: null,
      expiresIn: expiresIn ?? state.expiresIn,
      tokenExpiration: expiresIn ? Date.now() + (expiresIn * 1000) : state.tokenExpiration
    };
    
    set(newState);
    saveToStorage({
      accessToken: token,
      refreshToken: state.refreshToken,
      userProfile: state.userProfile,
      isConnected: true,
      expiresIn: newState.expiresIn,
      tokenExpiration: newState.tokenExpiration
    });
  },

  setRefreshToken: (token: string) => {
    const newState = {
      refreshToken: token,
      isConnected: true,
      isConnecting: false,
      error: null
    };
    
    set(newState);
    saveToStorage({
      ...get(),
      refreshToken: token,
      isConnected: true
    });
  },

  setTokenExpiration: (expiresIn: number) => {
    const state = get();
    const tokenExpiration = Date.now() + (expiresIn * 1000);
    
    set({ expiresIn, tokenExpiration });
    saveToStorage({
      ...state,
      expiresIn,
      tokenExpiration
    });
  },

  isTokenExpired: () => {
    const state = get();
    if (!state.tokenExpiration) return true;
    
    // Add a 30-second buffer to ensure we refresh before actual expiration
    const bufferTime = 30 * 1000; // 30 seconds in milliseconds
    return Date.now() + bufferTime >= state.tokenExpiration;
  },

  setLiveQuotes: (quotes: Record<string, LiveQuote>) => set({ liveQuotes: quotes }),
  setNews: (news: NewsItem[]) => set({ news }),
  setPredictions: (predictions: Prediction[]) => set({ predictions }),
  setOrders: (orders: Order[]) => set({ orders }),

  fetchQuotes: async (symbols: string[]) => {
    const state = get();
    if (!state.isConnected) {
      throw new Error('Not connected to TradeStation');
    }

    try {
      const response = await fetch(`/api/tradestation/quote?symbols=${symbols.join(',')}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch quotes');
      }

      const data = await response.json();
      const quotes: Record<string, LiveQuote> = {};
      data.forEach((quote: LiveQuote) => {
        quotes[quote.symbol] = quote;
      });

      set({ liveQuotes: quotes });
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch quotes' });
    }
  }
})); 