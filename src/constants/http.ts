export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
};

export const ENDPOINTS = {
  AI: {
    CHAT: "/api/ai/chat",
    CHAT_CLEAR: "/api/ai/chat/clear",
    CHART_ANALYSIS: "/api/ai/chart-analysis",
    HEALTH: "/api/ai/health",
    MARKET_ANALYSIS: "/api/ai/market-analysis",
    TRADING_STRATEGY: "/api/ai/trading-strategy",
    SENTIMENT: "/api/ai/sentiment",
  },
  NEWS: {
    GET_NEWS: "/api/news",
    FINHUB_NEWS: "/api/news/finhub",
  },
  TRADESTATION: {
    MARKET_DATA: "/api/tradestation/marketdata",
    QUOTE: "/v2/data/quote",
    BARCHART: "/v2/stream/barchart",
    ORDER: "/v2/data/order",
    ACCOUNT: "/v2/data/account",
  },
};