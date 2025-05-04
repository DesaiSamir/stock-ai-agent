'use client';

import { useSessionStore } from '@/store/session';
import type { BarData, BarchartRequest, TimeUnit, QuoteData } from '@/types/tradestation';
import axios from 'axios';
import type { StreamData } from '@/app/api/services/tradestation/tradingService';
import { cookieUtils } from '@/utils/cookies';

export interface StreamPayload {
  symbol: string;
  interval: number;
  unit: TimeUnit;
  isPreMarket?: boolean;
}

export interface FormattedBarData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const API_CALL_TIMEOUT = 10000;
const API_CALL_TIMEOUT_OFF_HOURS = 30000;

export const http = {
  // Add flags to track if fetches are in progress
  isBarFetching: false,
  isQuoteFetching: false,

  // Add timers for polling
  barChartTimer: undefined as NodeJS.Timeout | undefined,
  quoteTimer: undefined as NodeJS.Timeout | undefined,

  clearBarChartInterval() {
    if (this.barChartTimer) {
      clearInterval(this.barChartTimer);
      this.barChartTimer = undefined;
    }
  },

  clearQuoteInterval() {
    if (this.quoteTimer) {
      clearInterval(this.quoteTimer);
      this.quoteTimer = undefined;
    }
  },

  getRefreshInterval() {
    return this.isRegularSessionTime() ? API_CALL_TIMEOUT : API_CALL_TIMEOUT_OFF_HOURS;
  },

  isRegularSessionTime() {
    const sessionStartTime = new Date(new Date().toLocaleDateString() + " 9:30:00 AM");
    const sessionEndTime = new Date(new Date().toLocaleDateString() + " 4:00:00 PM");
    const currentTime = new Date();
    
    return (currentTime > sessionStartTime && 
            currentTime < sessionEndTime && 
            currentTime.getDay() > 0 && 
            currentTime.getDay() < 6);
  },

  async getQuoteData(symbol: string, callback: (data: QuoteData) => void) {
    // If a quote fetch is already in progress, skip this one
    if (this.isQuoteFetching) return;

    try {
      const store = useSessionStore.getState();
      
      // Validate/refresh tokens before proceeding
      const isValid = await this.validateTokens();
      if (!isValid || !store.accessToken) {
        throw new Error('Failed to validate access token');
      }

      if (this.isRegularSessionTime()) {
        this.isQuoteFetching = true;
        const response = await axios.get(`/api/tradestation/quote`, {
          params: {
            symbols: symbol,
            token: store.accessToken
          }
        });
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          callback(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch quote data:', error);
      throw error;
    } finally {
      this.isQuoteFetching = false;
    }
  },

  async startQuotePolling(symbol: string, callback: (data: QuoteData) => void) {
    // Clear any existing polling
    this.clearQuoteInterval();
    
    try {
      // Initial fetch
      await this.getQuoteData(symbol, callback);

      // Clear any existing timer before setting a new one
      if (this.quoteTimer) {
        clearInterval(this.quoteTimer);
      }

      // Setup polling every second
      this.quoteTimer = setInterval(async () => {
        await this.getQuoteData(symbol, callback);
      }, API_CALL_TIMEOUT);

      // Return a resolved promise to indicate initial data is loaded
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to setup quote polling:', error);
      throw error;
    }
  },

  async getBarChartDataStream(payload: StreamPayload, callback: (data: FormattedBarData[]) => void) {
    // Clear any existing timers
    this.clearBarChartInterval();
    
    try {
      const store = useSessionStore.getState();
      
      // Validate/refresh tokens before proceeding
      const isValid = await this.validateTokens();
      if (!isValid || !store.accessToken) {
        throw new Error('Failed to validate access token');
      }

      // Function to fetch data
      const fetchData = async () => {
        // If a bar fetch is already in progress, skip this one
        if (this.isBarFetching) return;

        try {
          this.isBarFetching = true;
          
          if (this.isRegularSessionTime()) {
            const barchartRequest = this.createBarchartRequest(
              payload.symbol,
              payload.interval,
              payload.unit,
              payload.isPreMarket
            );
            
            const url = `/v2/stream/barchart/${barchartRequest.symbol}/${barchartRequest.interval}/${barchartRequest.unit}/${barchartRequest.barsBack}/${barchartRequest.lastDate}${barchartRequest.sessionTemplate ? `?SessionTemplate=${barchartRequest.sessionTemplate}` : ''}`;
            
            const response = await axios.get(`/api/tradestation/barchart`, {
              params: {
                url: url,
                token: store.accessToken
              }
            });
            
            if (Array.isArray(response.data)) {
              callback(this.formatBarDataArray(response.data));
            }
          }
        } catch (error) {
          console.error('Failed to fetch bar data:', error);
          throw error;
        } finally {
          this.isBarFetching = false;
        }
      };

      // Initial fetch
      await fetchData();

      // Clear any existing timer before setting a new one
      if (this.barChartTimer) {
        clearInterval(this.barChartTimer);
      }

      // Setup polling every second
      this.barChartTimer = setInterval(fetchData, API_CALL_TIMEOUT);

      // Return a resolved promise to indicate initial data is loaded
      return Promise.resolve();

    } catch (error) {
      console.error('Failed to setup barchart polling:', error);
      throw error;
    }
  },

  formatBarDataArray(data: BarData[]): FormattedBarData[] {
    try {
      return data.map(bar => ({
        timestamp: bar.TimeStamp,
        open: bar.Open,
        high: bar.High,
        low: bar.Low,
        close: bar.Close,
        volume: bar.TotalVolume,
      }));
    } catch (error) {
      console.error('Error formatting bar data:', error);
      return [];
    }
  },

  formatBarDataSingle(data: StreamData): FormattedBarData {
    return {
      timestamp: data.TimeStamp,
      open: Number(data.Open),
      high: Number(data.High),
      low: Number(data.Low),
      close: Number(data.Close),
      volume: Number(data.TotalVolume),
    };
  },

  handleAuthError(error: Error) {
    if (error.message === 'AUTH_NO_TOKEN' || 
        error.message === 'AUTH_NO_REFRESH_TOKEN' ||
        error.message === 'AUTH_REFRESH_FAILED' ||
        error.message === 'AUTH_INVALID' ||
        (axios.isAxiosError(error) && error.response?.status === 401)) {
      const store = useSessionStore.getState();
      store.disconnect();
      throw new Error('Session expired. Please log in again.');
    }
    throw error;
  },

  async validateTokens() {
    // Read directly from cookies instead of store
    const cookies = cookieUtils.getAuthCookies();
    const store = useSessionStore.getState();
    
    if (!cookies.refreshToken) {
      return false;
    }

    try {
      // Check if token will expire in the next minute
      const bufferTime = 60 * 1000; // 1 minute in milliseconds
      const isExpiringSoon = !cookies.tokenExpiration || 
                            (cookies.tokenExpiration - Date.now() < bufferTime);

      if (isExpiringSoon) {
        // If a refresh is already in progress, wait for the existing promise
        if (store.isRefreshingToken && store.refreshPromise) {
          console.log('Token refresh already in progress, waiting for completion');
          try {
            await store.refreshPromise;
            // The store should already be updated by the original refresh call
            return true;
          } catch (error) {
            console.error('Waiting for refresh token failed:', error);
            return false;
          }
        }

        // Create the refresh token promise
        const refreshPromise = fetch('/api/tradestation/token/refresh', {
          method: 'POST',
          headers: {
            'Refresh-Token': cookies.refreshToken
          }
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Token refresh failed:', errorData);
            throw new Error(errorData.error || 'AUTH_REFRESH_FAILED');
          }
          return response.json();
        });

        // Set the refresh state and promise in the store
        store.setRefreshingToken(true, refreshPromise);

        try {
          const data = await refreshPromise;
          if (!data.access_token || !data.expires_in) {
            console.error('Invalid token refresh response:', data);
            throw new Error('AUTH_INVALID_RESPONSE');
          }

          const tokenExpiration = Date.now() + (data.expires_in * 1000);
          
          // Update cookies
          cookieUtils.setAuthCookies({
            accessToken: data.access_token,
            expiresIn: data.expires_in,
            tokenExpiration: tokenExpiration
          });

          // Always update store with new token and set connected state
          store.setAccessToken(data.access_token, data.expires_in);
          store.setTokenExpiration(tokenExpiration);
          store.setConnected(true);

          return true;
        } catch (error) {
          console.error('Token refresh failed:', error);
          throw error;
        } finally {
          // Reset the refresh state
          store.setRefreshingToken(false);
        }
      }

      return !isExpiringSoon;
    } catch (error) {
      console.error('Token validation/refresh failed:', error);
      // Only disconnect if it's an auth error
      if (error instanceof Error && 
          ['AUTH_NO_TOKEN', 'AUTH_NO_REFRESH_TOKEN', 'AUTH_REFRESH_FAILED', 'AUTH_INVALID', 'AUTH_INVALID_RESPONSE']
          .includes(error.message)) {
        store.disconnect();
        cookieUtils.clearAuthCookies(); // Also clear cookies on auth error
      }
      return false;
    }
  },

  async send(method: string, url: string, payload?: unknown) {
    const store = useSessionStore.getState();
    if (!store.isConnected) {
      throw new Error('Not connected to TradeStation');
    }

    if (!store.accessToken) {
      throw new Error('No access token available');
    }

    try {
      // Validate tokens before making the request
      const isValid = await this.validateTokens();
      if (!isValid) {
        throw new Error('AUTH_INVALID');
      }

      const response = await axios({
        method,
        url,
        data: payload,
        headers: {
          'Authorization': `Bearer ${store.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        this.handleAuthError(error);
      }
      console.error('API request failed:', error);
      throw error;
    }
  },

  async get<T>(url: string): Promise<T> {
    return this.send('GET', url);
  },

  async post<T>(url: string, payload: unknown): Promise<T> {
    return this.send('POST', url, payload);
  },

  /**
   * Formats TradeStation BarData into a simplified structure for charting
   * @param data - Raw BarData from TradeStation API
   * @returns FormattedBarData with essential OHLCV information
   */
  formatBarData: (data: BarData): FormattedBarData => ({
    timestamp: data.TimeStamp,
    open: data.Open,
    high: data.High,
    low: data.Low,
    close: data.Close,
    volume: data.TotalVolume
  }),

  createBarchartRequest(symbol: string, interval: number, unit: TimeUnit, isPreMarket = false): BarchartRequest {
    const lastDate = new Date().toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    }).replace(/\//g, '-');

    return {
      symbol,
      interval,
      unit,
      barsBack: 600,
      lastDate,
      ...(isPreMarket && { sessionTemplate: 'USEQPreAndPost' })
    };
  }
};

export default http;