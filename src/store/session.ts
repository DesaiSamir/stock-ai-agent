"use client";

import { create } from 'zustand';
import { cookieUtils } from '@/utils/cookies';

export interface UserProfile {
  userid: string;
  [key: string]: unknown;
}

interface StoredSessionState {
  accessToken: string | null;
  refreshToken: string | null;
  userProfile: UserProfile | null;
  isConnected: boolean;
  expiresIn: number | null;
  tokenExpiration: number | null; // timestamp when token expires
}

const STORAGE_KEY = "ts-session";

const defaultState: StoredSessionState = {
  accessToken: null,
  refreshToken: null,
  userProfile: null,
  isConnected: false,
  expiresIn: null,
  tokenExpiration: null
};

// Helper functions for localStorage
const loadFromStorage = (): StoredSessionState => {
  if (typeof window === 'undefined') {
    return defaultState;
  }

  try {
    // First try to load from cookies
    const cookieData = cookieUtils.getAuthCookies();
    if (cookieData.accessToken && cookieData.refreshToken) {
      return {
        ...defaultState,
        ...cookieData,
        isConnected: true
      };
    }

    // Fallback to localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Also set cookies if we found data in localStorage
      cookieUtils.setAuthCookies({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        tokenExpiration: data.tokenExpiration
      });
      return data;
    }
  } catch (error) {
    console.error('Failed to load session state:', error);
  }
  return defaultState;
};

const saveToStorage = (state: StoredSessionState) => {
  if (typeof window === 'undefined') return;

  try {
    // Save to both localStorage and cookies
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    cookieUtils.setAuthCookies({
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      expiresIn: state.expiresIn,
      tokenExpiration: state.tokenExpiration
    });
  } catch (error) {
    console.error('Failed to save session state:', error);
  }
};

const clearStorage = () => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    cookieUtils.clearAuthCookies();
  } catch (error) {
    console.error('Failed to clear session state:', error);
  }
};

// Load initial state from storage
const initialState = loadFromStorage();

interface SessionState extends StoredSessionState {
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  setAccessToken: (token: string, expiresIn: number) => void;
  setRefreshToken: (token: string) => void;
  setTokenExpiration: (expiration: number) => void;
  setError: (error: string | null) => void;
  isTokenExpired: () => boolean;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  // Initial state
  isConnected: initialState?.isConnected ?? false,
  isConnecting: false,
  error: null,
  accessToken: initialState?.accessToken ?? null,
  refreshToken: initialState?.refreshToken ?? null,
  userProfile: initialState?.userProfile ?? null,
  expiresIn: initialState?.expiresIn ?? null,
  tokenExpiration: initialState?.tokenExpiration ?? null,

  // Actions
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

      let isHandlingAuth = false; // Flag to prevent multiple handlers

      // Listen for messages from popup
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data?.type === 'TRADESTATION_AUTH_SUCCESS' && !isHandlingAuth) {
          isHandlingAuth = true; // Set flag to prevent multiple handling
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
          
          if (popup) {
            popup.close(); // Close the popup after successful auth
          }
        }

        if (event.data?.type === 'TRADESTATION_AUTH_ERROR' && !isHandlingAuth) {
          isHandlingAuth = true; // Set flag to prevent multiple handling
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
          
          if (popup) {
            popup.close(); // Close the popup after error
          }
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
      tokenExpiration: null
    });
  },

  setAccessToken: (token, expiresIn) => {
    const tokenExpiration = Date.now() + expiresIn * 1000;
    const newState = { ...get(), accessToken: token, tokenExpiration };
    set(newState);
    saveToStorage(newState);
  },

  setRefreshToken: (token) => {
    const newState = { ...get(), refreshToken: token };
    set(newState);
    saveToStorage(newState);
  },
  
  setTokenExpiration: (expiration) => {
    const newState = { ...get(), tokenExpiration: expiration };
    set(newState);
    saveToStorage(newState);
  },
  
  setError: (error) => set({ error }),

  isTokenExpired: () => {
    const state = get();
    if (!state.tokenExpiration) return true;
    
    // Add a 30-second buffer to ensure we refresh before actual expiration
    const bufferTime = 30 * 1000; // 30 seconds in milliseconds
    return Date.now() + bufferTime >= state.tokenExpiration;
  }
}));

// Helper function for popup window
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