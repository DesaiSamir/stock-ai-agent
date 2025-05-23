import { EventEmitter } from "events";
import type { NewsAgentConfig, TradeSignal, AgentConfig, NewsItem } from "../../types/agent";
import axios from "axios";
import { useAgentMonitoringStore } from "@/store/agent-monitoring";
import { useNewsStore } from "@/store/news-store";

interface NewsAPIResponse {
  articles: Array<NewsItem>;
  analyses: Array<{
    keyTopics: string[];
    marketImpact: string;
    tradingSignals: string[];
    confidence: number;
  }>;
  metadata: {
    symbol: string;
    timestamp: string;
    sources: string[];
  };
}

export class NewsAgent extends EventEmitter {
  private config: NewsAgentConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(config: NewsAgentConfig) {
    super();
    this.config = config;
  }

  async start(): Promise<void> {
    console.log("Starting News Agent...");
    this.config.status = "ACTIVE";
    this.config.lastUpdated = new Date();

    // Start the monitoring loop
    this.monitoringInterval = setInterval(
      () => {
        this.monitorNews().catch(error => {
          console.error("Error in news monitoring loop:", error);
          this.config.status = "ERROR";
          this.emit("error", error);
        });
      },
      this.config.config.updateInterval,
    );

    // Initial news check
    await this.monitorNews();
  }

  async stop(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.config.status = "INACTIVE";

    // Clear monitoring state for all symbols
    for (const symbol of this.config.config.symbols) {
      useAgentMonitoringStore.getState().setSymbolMonitoring(symbol, false);
    }
  }

  private async monitorNews(): Promise<void> {
    try {
      for (const symbol of this.config.config.symbols) {
        const store = useAgentMonitoringStore.getState();
        
        // Skip if already being monitored
        if (store.isSymbolBeingMonitored(symbol)) {
          continue;
        }

        // Set monitoring state
        store.setSymbolMonitoring(symbol, true);
        
        try {
          const response = await axios.get<NewsAPIResponse>(`/api/news?symbol=${symbol}`);
          
          // Store news data
          useNewsStore.getState().addNewsData(
            symbol,
            response.data.articles.map(article => ({
              ...article,
              id: `${symbol}-${article.publishedAt}-${article.url}` // Generate unique id
            })),
            response.data.analyses
          );

          // Generate trade signal if significant analysis exists
          const signal = await this.analyzeNewsForSymbol(symbol, response.data);
          if (signal) {
            this.emit("newsSignal", signal);
          }
        } finally {
          // Clear monitoring state regardless of success/failure
          store.setSymbolMonitoring(symbol, false);
        }
      }

      this.config.lastUpdated = new Date();
    } catch (error) {
      console.error("Error monitoring news:", error);
      this.config.status = "ERROR";
      this.emit("error", error);
    }
  }

  private async analyzeNewsForSymbol(symbol: string, data: NewsAPIResponse): Promise<TradeSignal | null> {
    try {
      // Get articles from last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recentArticles = data.articles.filter(
        article => article.publishedAt > twentyFourHoursAgo
      );

      if (recentArticles.length === 0 || !data.analyses) {
        return null;
      }

      // Find the most significant analysis (highest confidence non-stable signal)
      const significantAnalyses = data.analyses
        .filter(analysis => {
          const impactMatch = analysis.marketImpact.match(/(up|down|stable)\s*\((\d+(?:\.\d+)?)%\)\s*(immediate|short-term|long-term)/i);
          return impactMatch && impactMatch[1].toLowerCase() !== 'stable' && analysis.confidence >= 0.7;
        })
        .sort((a, b) => b.confidence - a.confidence);

      if (significantAnalyses.length === 0) {
        return null;
      }

      const bestAnalysis = significantAnalyses[0];
      const impactMatch = bestAnalysis.marketImpact.match(/(up|down|stable)\s*\((\d+(?:\.\d+)?)%\)\s*(immediate|short-term|long-term)/i);
      const [, direction, magnitude, timeframe] = impactMatch || [];

      return {
        symbol,
        action: direction.toLowerCase() === 'up' ? "BUY" : "SELL",
        price: 0, // Price will be set by trading agent
        confidence: bestAnalysis.confidence,
        timestamp: new Date(),
        source: "NEWS",
        analysis: {
          sentiment: bestAnalysis.tradingSignals[0] as 'bullish' | 'bearish' | 'neutral',
          keyEvents: bestAnalysis.keyTopics,
          reasoning: `Market impact: ${bestAnalysis.marketImpact}. Key topics: ${bestAnalysis.keyTopics.join(", ")}`,
          predictedImpact: {
            magnitude: parseFloat(magnitude),
            timeframe: timeframe as 'immediate' | 'short-term' | 'long-term'
          }
        }
      };
    } catch (error) {
      console.error(`Error analyzing news for ${symbol}:`, error);
      return null;
    }
  }

  getStatus(): AgentConfig {
    return this.config;
  }
}
