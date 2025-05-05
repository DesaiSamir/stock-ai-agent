"use client";

import { useSessionStore } from "@/store/session";
import type {
  BarData,
  BarchartRequest,
  TimeUnit,
  QuoteData,
} from "@/types/tradestation";
import type { Candlestick } from "@/types/candlestick";
import axios from "axios";
import { cookieUtils } from "@/utils/cookies";
import { patternDetector } from "@/services/patternDetector";

export interface StreamPayload {
  symbol: string;
  interval: number;
  unit: TimeUnit;
  isPreMarket?: boolean;
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
    return this.isRegularSessionTime()
      ? API_CALL_TIMEOUT
      : API_CALL_TIMEOUT_OFF_HOURS;
  },

  isRegularSessionTime() {
    const sessionStartTime = new Date(
      new Date().toLocaleDateString() + " 9:30:00 AM",
    );
    const sessionEndTime = new Date(
      new Date().toLocaleDateString() + " 9:00:00 PM",
    );
    const currentTime = new Date();
    return true;
    return (
      currentTime > sessionStartTime &&
      currentTime < sessionEndTime &&
      currentTime.getDay() > 0 &&
      currentTime.getDay() < 6
    );
  },

  async getQuoteData(symbol: string, callback: (data: QuoteData) => void) {
    // If a quote fetch is already in progress, skip this one
    if (this.isQuoteFetching) return;

    try {
      const store = useSessionStore.getState();

      // Validate/refresh tokens before proceeding
      const isValid = await this.validateTokens();
      if (!isValid || !store.accessToken) {
        throw new Error("Failed to validate access token");
      }

      if (this.isRegularSessionTime()) {
        this.isQuoteFetching = true;
        const response = await axios.get(`/api/tradestation/quote`, {
          params: {
            symbols: symbol,
            token: store.accessToken,
          },
        });
        if (
          response.data &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          callback(response.data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch quote data:", error);
      throw error;
    } finally {
      this.isQuoteFetching = false;
    }
  },

  async getQuoteDataRecursive(
    symbol: string,
    callback: (data: QuoteData) => void,
  ) {
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
      console.error("Failed to setup quote polling:", error);
      throw error;
    }
  },

  async getBarChartDataStream(
    payload: StreamPayload,
    callback: (data: Candlestick[]) => void,
  ) {
    // Clear any existing timers
    this.clearBarChartInterval();

    try {
      const store = useSessionStore.getState();

      // Validate/refresh tokens before proceeding
      const isValid = await this.validateTokens();
      if (!isValid || !store.accessToken) {
        throw new Error("Failed to validate access token");
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
              payload.isPreMarket,
            );

            const url = `/v2/stream/barchart/${barchartRequest.symbol}/${barchartRequest.interval}/${barchartRequest.unit}/${barchartRequest.barsBack}/${barchartRequest.lastDate}${barchartRequest.sessionTemplate ? `?SessionTemplate=${barchartRequest.sessionTemplate}` : ""}`;

            const response = await axios.get(`/api/tradestation/barchart`, {
              params: {
                url: url,
                token: store.accessToken,
              },
            });

            if (Array.isArray(response.data)) {
              callback(this.formatBarDataArray(response.data));
            }
          }
        } catch (error) {
          console.error("Failed to fetch bar data:", error);
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
      console.error("Failed to setup barchart polling:", error);
      throw error;
    }
  },

  formatBarDataArray(data: BarData[]): Candlestick[] {
    try {
      // First pass: basic OHLCV data
      const formattedData = data.map((bar) => {
        return this.formatBarDataSingle(bar);
      });

      // Sort by date
      formattedData.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      // Calculate SMA and other technical indicators
      this.calculateMovingAverages(formattedData);

      // Detect patterns
      return patternDetector.detectPattern(formattedData, "Minute");
    } catch (error) {
      console.error("Error formatting bar data:", error);
      return [];
    }
  },

  formatBarDataSingle(barData: BarData): Candlestick {
    const tsRegX = /\d+/g;
    const ts = parseInt(barData.TimeStamp.match(tsRegX)?.[0] || "0");
    const date = new Date(ts);

    return {
      date: date.toISOString(),
      timestamp: barData.TimeStamp,
      open: barData.Open,
      high: barData.High,
      low: barData.Low,
      close: barData.Close,
      price: barData.Close,
      volume: barData.TotalVolume,
      pattern: "",
      patternType: undefined,
      candle: undefined,
    } as Candlestick;
  },

  calculateMovingAverages(data: Candlestick[]): void {
    const sma = 200;
    if (data.length > sma) {
      let mxcr = Math.abs(data[sma - 1].high - data[sma - 1].low);
      let mxbr = Math.abs(data[sma - 1].open - data[sma - 1].close);

      for (let i = sma; i < data.length; i++) {
        const candle = data[i];
        let totalClose = 0;
        let atbr = 0;
        let atcr = 0;
        const startIndex = i - sma;
        const currMxcr = Math.abs(candle.high - candle.low);
        mxcr = currMxcr > mxcr ? currMxcr : mxcr;
        const currMxbr = Math.abs(candle.open - candle.close);
        mxbr = currMxbr > mxbr ? currMxcr : mxbr;

        data.slice(startIndex, i).forEach((d) => {
          atbr += Math.abs(d.open - d.close);
          atcr += Math.abs(d.high - d.low);
          totalClose += d.close;
        });

        const sma200 = totalClose / sma;
        const highPct = ((candle.high - sma200) / sma200) * 100;
        const lowPct = ((candle.low - sma200) / sma200) * 100;

        const averageTrueBodyRange = atbr / sma;
        const averageTrueCandleRange = atcr / sma;

        candle.sma200 = sma200;
        candle.sma200highPct = highPct;
        candle.sma200lowPct = lowPct;
        candle.atbr = averageTrueBodyRange;
        candle.atcr = averageTrueCandleRange;
        candle.mxbr = mxbr;
        candle.mxcr = mxcr;
      }
    }
  },

  handleAuthError(error: Error) {
    if (
      error.message === "AUTH_NO_TOKEN" ||
      error.message === "AUTH_NO_REFRESH_TOKEN" ||
      error.message === "AUTH_REFRESH_FAILED" ||
      error.message === "AUTH_INVALID" ||
      (axios.isAxiosError(error) && error.response?.status === 401)
    ) {
      const store = useSessionStore.getState();
      store.disconnect();
      throw new Error("Session expired. Please log in again.");
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
      const isExpiringSoon =
        !cookies.tokenExpiration ||
        cookies.tokenExpiration - Date.now() < bufferTime;

      if (isExpiringSoon) {
        // If a refresh is already in progress, wait for the existing promise
        if (store.isRefreshingToken && store.refreshPromise) {
          console.log(
            "Token refresh already in progress, waiting for completion",
          );
          try {
            await store.refreshPromise;
            // The store should already be updated by the original refresh call
            return true;
          } catch (error) {
            console.error("Waiting for refresh token failed:", error);
            return false;
          }
        }

        // Create the refresh token promise
        const refreshPromise = fetch("/api/tradestation/token/refresh", {
          method: "POST",
          headers: {
            "Refresh-Token": cookies.refreshToken,
          },
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            console.error("Token refresh failed:", errorData);
            throw new Error(errorData.error || "AUTH_REFRESH_FAILED");
          }
          return response.json();
        });

        // Set the refresh state and promise in the store
        store.setRefreshingToken(true, refreshPromise);

        try {
          const data = await refreshPromise;
          if (!data.access_token || !data.expires_in) {
            console.error("Invalid token refresh response:", data);
            throw new Error("AUTH_INVALID_RESPONSE");
          }

          const tokenExpiration = Date.now() + data.expires_in * 1000;

          // Update cookies
          cookieUtils.setAuthCookies({
            accessToken: data.access_token,
            expiresIn: data.expires_in,
            tokenExpiration: tokenExpiration,
          });

          // Always update store with new token and set connected state
          store.setAccessToken(data.access_token, data.expires_in);
          store.setTokenExpiration(tokenExpiration);
          store.setConnected(true);

          return true;
        } catch (error) {
          console.error("Token refresh failed:", error);
          throw error;
        } finally {
          // Reset the refresh state
          store.setRefreshingToken(false);
        }
      }

      return !isExpiringSoon;
    } catch (error) {
      console.error("Token validation/refresh failed:", error);
      // Only disconnect if it's an auth error
      if (
        error instanceof Error &&
        [
          "AUTH_NO_TOKEN",
          "AUTH_NO_REFRESH_TOKEN",
          "AUTH_REFRESH_FAILED",
          "AUTH_INVALID",
          "AUTH_INVALID_RESPONSE",
        ].includes(error.message)
      ) {
        store.disconnect();
        cookieUtils.clearAuthCookies(); // Also clear cookies on auth error
      }
      return false;
    }
  },

  async send(method: string, url: string, payload?: unknown) {
    const store = useSessionStore.getState();
    if (!store.isConnected) {
      throw new Error("Not connected to TradeStation");
    }

    if (!store.accessToken) {
      throw new Error("No access token available");
    }

    try {
      // Validate tokens before making the request
      const isValid = await this.validateTokens();
      if (!isValid) {
        throw new Error("AUTH_INVALID");
      }

      const response = await axios({
        method,
        url,
        data: payload,
        headers: {
          Authorization: `Bearer ${store.accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        this.handleAuthError(error);
      }
      console.error("API request failed:", error);
      throw error;
    }
  },

  async get<T>(url: string): Promise<T> {
    return this.send("GET", url);
  },

  async post<T>(url: string, payload: unknown): Promise<T> {
    return this.send("POST", url, payload);
  },

  createBarchartRequest(
    symbol: string,
    interval: number,
    unit: TimeUnit,
    isPreMarket = false,
  ): BarchartRequest {
    const lastDate = new Date()
      .toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");

    return {
      symbol,
      interval,
      unit,
      barsBack: 600,
      lastDate,
      ...(isPreMarket && { sessionTemplate: "USEQPreAndPost" }),
    };
  },
};

export default http;
