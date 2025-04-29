import { useTradeStationStore } from '@/store/tradestation';
import type { BarData, BarchartRequest, TimeUnit, QuoteData } from '@/types/tradestation';
import axios from 'axios';
import { tradestationService } from '@/app/api/services/tradestation/tradingService';
import type { StreamData } from '@/app/api/services/tradestation/tradingService';

export interface StreamPayload {
  method: 'STREAM' | 'GET' | 'POST';
  url: string;
}

const barChartTimer = 1000;
let quoteTimer: NodeJS.Timeout;

export interface FormattedBarData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const http = {
  clearBarChartInterval() {
    if (barChartTimer) {
      clearInterval(barChartTimer);
    }
    // Also stop the WebSocket stream
    const store = useTradeStationStore.getState();
    if (store.currentSymbol) {
      tradestationService.stopStream(store.currentSymbol);
    }
  },

  clearQuoteInterval() {
    clearInterval(quoteTimer);
  },

  getRefreshInterval() {
    return this.isRegularSessionTime() ? 3000 : 10000;
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
    const quoteData = await this.get<QuoteData[]>(`/api/tradestation/quote/${symbol}`);
    if (quoteData && quoteData.length > 0) {
      callback(quoteData[0]);
    }
  },

  async getQuoteDataStream(symbol: string, callback: (data: QuoteData) => void) {
    clearInterval(quoteTimer);
    
    quoteTimer = setInterval(async () => {
      if (this.isRegularSessionTime()) {
        const quoteData = await this.get<QuoteData[]>(`/api/tradestation/quote/${symbol}`);
        if (quoteData && quoteData.length > 0) {
          callback(quoteData[0]);
        }
      }
    }, this.getRefreshInterval());
  },

  createBarchartRequest(symbol: string, interval: number, unit: TimeUnit, isPreMarket = false): BarchartRequest {
    return {
      symbol,
      interval,
      unit,
      barsBack: 600,
      lastDate: new Date().toISOString(),
      ...(isPreMarket && { sessionTemplate: 'USEQPreAndPost' })
    };
  },

  async getBarChartData(payload: StreamPayload, callback: (data: FormattedBarData[]) => void) {
    // Get initial data
    const barData = await this.send('POST', '/api/tradestation/barchart', payload);
    if (barData) {
      callback(this.formatBarDataArray(barData));
    }

    // Start WebSocket stream for real-time updates
    const store = useTradeStationStore.getState();
    if (store.currentSymbol) {
      tradestationService.startStream(store.currentSymbol, (streamData: StreamData) => {
        callback([this.formatBarDataSingle(streamData)]);
      });
    }
  },

  async getBarChartDataStream(payload: StreamPayload, callback: (data: FormattedBarData[]) => void) {
    // Clear any existing streams/timers
    this.clearBarChartInterval();
    
    // Start WebSocket stream
    const store = useTradeStationStore.getState();
    if (store.currentSymbol) {
      tradestationService.startStream(store.currentSymbol, (streamData: StreamData) => {
        callback([this.formatBarDataSingle(streamData)]);
      });
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
      const store = useTradeStationStore.getState();
      store.disconnect();
      throw new Error('Session expired. Please log in again.');
    }
    throw error;
  },

  async validateTokens() {
    const store = useTradeStationStore.getState();
    if (!store.isConnected || !store.accessToken || !store.refreshToken) {
      return false;
    }

    try {
      // Check if token will expire in the next minute
      const bufferTime = 60 * 1000; // 1 minute in milliseconds
      const isExpiringSoon = store.tokenExpiration && 
                            (store.tokenExpiration - Date.now() < bufferTime);

      if (isExpiringSoon) {
        // Use the existing API route that uses authService
        const headers = new Headers({
          'Authorization': `Bearer ${store.accessToken}`,
          'Refresh-Token': store.refreshToken,
          'Token-Expiration': store.tokenExpiration?.toString() || ''
        });

        const response = await fetch('/api/tradestation/token/refresh', {
          method: 'POST',
          headers
        });

        if (!response.ok) {
          throw new Error('AUTH_REFRESH_FAILED');
        }

        const data = await response.json();
        const tokenExpiration = Date.now() + data.expires_in;
        if (data.access_token) {
          store.setAccessToken(
            data.access_token,
            data.expires_in
          );
          store.setTokenExpiration(tokenExpiration);
          return true;
        }
      }

      return !isExpiringSoon;
    } catch (error) {
      console.error('Failed to validate/refresh token:', error);
      store.disconnect();
      return false;
    }
  },

  async send(method: string, url: string, payload?: unknown) {
    const store = useTradeStationStore.getState();
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
  })
};

export default http; 