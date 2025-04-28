import { useTradeStationStore } from '@/store/tradestation';
import type { BarData, BarchartRequest, TimeUnit, QuoteData } from '@/types/tradestation';

export interface StreamPayload {
  method: 'STREAM' | 'GET' | 'POST';
  url: string;
}

let barChartTimer: NodeJS.Timeout;
let quoteTimer: NodeJS.Timeout;

export interface FormattedBarData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const http = {
  clearBarChartInterval() {
    clearInterval(barChartTimer);
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
    const quoteData = await this.get(`/api/tradestation/quote/${symbol}`);
    if (quoteData) {
      callback(quoteData[0]);
    }
  },

  async getQuoteDataStream(symbol: string, callback: (data: QuoteData) => void) {
    clearInterval(quoteTimer);
    
    quoteTimer = setInterval(async () => {
      if (this.isRegularSessionTime()) {
        const quoteData = await this.get(`/api/tradestation/quote/${symbol}`);
        if (quoteData) {
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
    const barData = await this.send('POST', '/api/tradestation/barchart', payload);
    if (barData) {
      callback(this.formatBarData(barData));
    }
    this.getBarChartDataStream(payload, callback);
  },

  async getBarChartDataStream(payload: StreamPayload, callback: (data: FormattedBarData[]) => void) {
    clearInterval(barChartTimer);
    
    barChartTimer = setInterval(async () => {
      if (this.isRegularSessionTime()) {
        const barData = await this.send('POST', '/api/tradestation/barchart', payload);
        if (barData) {
          callback(this.formatBarData(barData));
        }
      }
    }, 15000); // 15 second refresh for bar data
  },

  formatBarData(data: BarData[]): FormattedBarData[] {
    return data.map(bar => ({
      date: new Date(bar.TimeStamp),
      open: bar.Open,
      high: bar.High,
      low: bar.Low,
      close: bar.Close,
      volume: bar.TotalVolume,
    }));
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
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${store.accessToken}`
        }
      };

      if (payload) {
        options.body = JSON.stringify(payload);
      }

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error('API request failed');
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },

  async get(url: string) {
    return this.send('GET', url);
  },

  async post(url: string, payload: unknown) {
    return this.send('POST', url, payload);
  }
}; 