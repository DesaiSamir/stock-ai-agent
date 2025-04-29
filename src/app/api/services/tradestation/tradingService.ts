import { tradestationConfig } from "./config";
import axios from 'axios';

export interface StreamData {
  Close: number;
  DownTicks: number;
  DownVolume: number;
  High: number;
  Low: number;
  Open: number;
  Status: number;
  TimeStamp: string;
  TotalTicks: number;
  TotalVolume: number;
  UnchangedTicks: number;
  UnchangedVolume: number;
  UpTicks: number;
  UpVolume: number;
  OpenInterest: number;
}

type StreamCallback = (data: StreamData) => void;

class TradestationService {
  private websocket: WebSocket | null = null;
  private streamCallbacks: Map<string, StreamCallback> = new Map();

  private parseStreamData(data: string): StreamData | null {
    try {
      return JSON.parse(data) as StreamData;
    } catch (error) {
      console.error('Failed to parse stream data:', error);
      return null;
    }
  }

  async startStream(symbol: string, callback: StreamCallback) {
    if (!this.websocket) {
      // Convert REST URL to WebSocket URL
      const wsUrl = tradestationConfig.baseUrlSim.replace('https://', 'wss://');
      this.websocket = new WebSocket(`${wsUrl}/v2/stream/barchart/${symbol}`);

      this.websocket.onmessage = (event) => {
        const data = this.parseStreamData(event.data);
        if (data) {
          // Call the callback for this symbol if it exists
          const cb = this.streamCallbacks.get(symbol);
          if (cb) {
            cb(data);
          }
        }
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.stopStream(symbol);
      };

      this.websocket.onclose = () => {
        console.log('WebSocket connection closed');
        this.websocket = null;
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (this.streamCallbacks.size > 0) {
            this.startStream(symbol, callback);
          }
        }, 5000);
      };
    }

    // Store the callback for this symbol
    this.streamCallbacks.set(symbol, callback);
  }

  stopStream(symbol: string) {
    this.streamCallbacks.delete(symbol);
    
    // If no more active streams, close the WebSocket
    if (this.streamCallbacks.size === 0 && this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  private parseStreamResponse(data: string): StreamData[] {
    // Split by newline and remove empty lines and 'END' marker
    const lines = data.split('\r\n').filter(line => line && line !== 'END');
    
    // Parse each line as JSON
    return lines.map(line => {
      try {
        return JSON.parse(line) as StreamData;
      } catch (error) {
        console.error('Failed to parse line:', line, error);
        return null;
      }
    }).filter((item): item is StreamData => item !== null);
  }

  async get(url: string, headers: Headers) {
    try {
      const response = await axios.get(tradestationConfig.baseUrlSim + url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': headers.get('Authorization'),
          'Accept': 'application/json'
        }
      });

      // Parse the response if it's a string (streaming data)
      const responseData = typeof response.data === 'string' 
        ? this.parseStreamResponse(response.data)
        : response.data;

      return responseData;
    } catch (error) {
      if (error instanceof Error && 
          ['AUTH_NO_TOKEN', 'AUTH_NO_REFRESH_TOKEN', 'AUTH_REFRESH_FAILED'].includes(error.message)) {
        throw error;
      }
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('AUTH_INVALID');
      }
      console.error('TradeStation API request failed:', error);
      throw error;
    }
  }

  async post(url: string, data: unknown, headers: Headers) {
    try {
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': headers.get('Authorization'),
          'Accept': 'application/json'
        }
      });

      // Parse the response if it's a string (streaming data)
      const responseData = typeof response.data === 'string' 
        ? this.parseStreamResponse(response.data)
        : response.data;

      return responseData;
    } catch (error) {
      if (error instanceof Error && 
          ['AUTH_NO_TOKEN', 'AUTH_NO_REFRESH_TOKEN', 'AUTH_REFRESH_FAILED'].includes(error.message)) {
        throw error;
      }
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error('AUTH_INVALID');
      }
      console.error('TradeStation API request failed:', error);
      throw error;
    }
  }
}

export const tradestationService = new TradestationService(); 