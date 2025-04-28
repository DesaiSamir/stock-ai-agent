import { create } from 'zustand';

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

interface TradeStationState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  accessToken: string | null;
  userProfile: UserProfile | null;
  liveQuotes: Record<string, LiveQuote>;
  news: NewsItem[];
  predictions: Prediction[];
  orders: Order[];
  connect: () => Promise<void>;
  disconnect: () => void;
  setAccessToken: (token: string) => void;
  setLiveQuotes: (quotes: Record<string, LiveQuote>) => void;
  setNews: (news: NewsItem[]) => void;
  setPredictions: (predictions: Prediction[]) => void;
  setOrders: (orders: Order[]) => void;
  fetchQuotes: (symbols: string[]) => Promise<void>;
}

export const useTradeStationStore = create<TradeStationState>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  error: null,
  accessToken: null,
  userProfile: null,
  liveQuotes: {},
  news: [],
  predictions: [],
  orders: [],

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
        // Verify origin matches callback URL
        if (event.origin !== window.location.origin) return;
        
        if (event.data?.type === 'TRADESTATION_AUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          
          set({ 
            isConnected: true,
            isConnecting: false,
            error: null,
            accessToken: event.data.accessToken,
            userProfile: event.data.profile
          });
        }

        if (event.data?.type === 'TRADESTATION_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          
          set({
            isConnected: false,
            isConnecting: false,
            error: event.data.error,
            accessToken: null,
            userProfile: null
          });
        }
      };

      window.addEventListener('message', handleMessage);
      
    } catch (error) {
      console.error('Failed to initiate TradeStation login:', error);
      set({ 
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect',
        accessToken: null,
        userProfile: null
      });
    }
  },

  disconnect: () => {
    set({ 
      isConnected: false,
      isConnecting: false,
      error: null,
      accessToken: null,
      userProfile: null,
      liveQuotes: {},
      news: [],
      predictions: [],
      orders: []
    });
  },

  setAccessToken: (token: string) => set({ 
    accessToken: token,
    isConnected: true,
    isConnecting: false,
    error: null
  }),

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