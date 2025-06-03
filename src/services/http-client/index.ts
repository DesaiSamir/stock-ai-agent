import axios, { AxiosRequestConfig } from 'axios';
import { useSessionStore } from '@/store/session';
import { cookieUtils } from '@/utils/cookies';
import { ENDPOINTS, HTTP_METHODS } from '@/constants/http';

// Create separate instances for regular and TradeStation clients
const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

const tradestationClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for TradeStation client
tradestationClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await handleAuthError(error);
    }
    return Promise.reject(error);
  }
);

const handleAuthError = async (error: Error) => {
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
};

const validateTokens = async () => {
  const cookies = cookieUtils.getAuthCookies();
  const store = useSessionStore.getState();

  if (!cookies.refreshToken) {
    return false;
  }

  try {
    const bufferTime = 60 * 1000; // 1 minute in milliseconds
    const isExpiringSoon =
      !cookies.tokenExpiration ||
      cookies.tokenExpiration - Date.now() < bufferTime;

    if (isExpiringSoon) {
      if (store.isRefreshingToken && store.refreshPromise) {
        try {
          await store.refreshPromise;
          return true;
        } catch (error) {
          console.error("Waiting for refresh token failed:", error);
          return false;
        }
      }

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

      store.setRefreshingToken(true, refreshPromise);

      try {
        const data = await refreshPromise;
        if (!data.access_token || !data.expires_in) {
          console.error("Invalid token refresh response:", data);
          throw new Error("AUTH_INVALID_RESPONSE");
        }

        const tokenExpiration = Date.now() + data.expires_in * 1000;

        cookieUtils.setAuthCookies({
          accessToken: data.access_token,
          expiresIn: data.expires_in,
          tokenExpiration: tokenExpiration,
        });

        store.setAccessToken(data.access_token, data.expires_in);
        store.setTokenExpiration(tokenExpiration);
        store.setConnected(true);

        return true;
      } catch (error) {
        console.error("Token refresh failed:", error);
        throw error;
      } finally {
        store.setRefreshingToken(false);
      }
    }

    return !isExpiringSoon;
  } catch (error) {
    console.error("Token validation/refresh failed:", error);
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
      cookieUtils.clearAuthCookies();
    }
    return false;
  }
};

const sendTradestation = async <T>(method: string, url: string, payload?: unknown): Promise<T> => {
  const store = useSessionStore.getState();
  if (!store.isConnected) {
    throw new Error("Not connected to TradeStation");
  }

  if (!store.accessToken) {
    throw new Error("No access token available");
  }

  try {
    const isValid = await validateTokens();
    if (!isValid) {
      throw new Error("AUTH_INVALID");
    }

    const updatedStore = useSessionStore.getState();
    if (!updatedStore.accessToken) {
      throw new Error("No access token available");
    }

    const finalUrl = method.toUpperCase() === HTTP_METHODS.GET
      ? `${url}${url.includes('?') ? '&' : '?'}token=${updatedStore.accessToken}`
      : url;

    const config: AxiosRequestConfig = {
      method,
      url: finalUrl,
    };

    if (method.toUpperCase() !== HTTP_METHODS.GET && payload) {
      config.data = {
        token: updatedStore.accessToken,
        ...payload,
      };
    }

    if (method.toUpperCase() === HTTP_METHODS.GET && payload) {
      config.params = payload;
    }

    const response = await tradestationClient(config);
    return response.data?.data || response.data;
  } catch (error) {
    if (error instanceof Error) {
      await handleAuthError(error);
    }
    console.error("API request failed:", error);
    throw error;
  }
};

export const httpService = {
  // Regular HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await httpClient.get<T>(url, config);
    return response.data;
  },

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await httpClient.post<T>(url, data, config);
    return response.data;
  },

  // TradeStation specific methods
  tradestation: {
    async get<T>(url: string): Promise<T> {
      return sendTradestation<T>(HTTP_METHODS.GET, url);
    },

    async post<T>(url: string, payload?: unknown): Promise<T> {
      return sendTradestation<T>(HTTP_METHODS.POST, url, payload);
    },

    async getQuoteData<T>(symbol: string): Promise<T> {
      return sendTradestation<T>(HTTP_METHODS.GET, `${ENDPOINTS.TRADESTATION.QUOTE}/${symbol}`);
    },

    async getBarChartData<T>(url: string): Promise<T> {
      return sendTradestation<T>(HTTP_METHODS.GET, url);
    }
  }
};

export default httpService; 