import { EventEmitter } from "events";
import type { NewsAgentConfig, TradeSignal, AgentConfig, NewsItem } from "../../types/agent";
import { useAgentMonitoringStore } from "@/store/agent-monitoring";
import { useNewsStore } from "@/store/news-store";
import { ENDPOINTS } from "@/constants/http";
import { httpService } from "@/services/http-client";

interface NewsAPIResponse {
  articles: Array<NewsItem>;
  analysis: Array<{
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
    // Set default updateInterval to 15 minutes if not provided
    if (!this.config.config.updateInterval || this.config.config.updateInterval < 60000) {
      this.config.config.updateInterval = 15 * 60 * 1000; // 15 minutes
    }
  }

  async start(): Promise<void> {
    console.log("Starting News Agent...");
    this.config.status = "ACTIVE";
    this.config.lastUpdated = new Date();

    // Clear any existing interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Initial news check
    await this.monitorNews();

    // Start the monitoring loop after initial check completes
    this.monitoringInterval = setInterval(
      () => {
        // Only start new monitoring if not already monitoring
        if (!this.config.config.symbols.some(symbol => 
          useAgentMonitoringStore.getState().isSymbolBeingMonitored(symbol)
        )) {
          this.monitorNews().catch(error => {
            console.error("Error in news monitoring loop:", error);
            this.config.status = "ERROR";
            this.emit("error", error);
          });
        }
      },
      this.config.config.updateInterval,
    );
  }

  async stop(): Promise<void> {
    console.log("Stopping News Agent...");
    
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
          const response = await httpService.get<NewsAPIResponse>(`${ENDPOINTS.NEWS.GET_NEWS}?symbol=${symbol}`);
          
          // Store news data
          useNewsStore.getState().addNewsData(
            symbol,
            response.articles.map(article => ({
              ...article,
              id: `${symbol}-${article.publishedAt}-${article.url}` // Generate unique id
            })),
            response.analysis
          );

          // Generate trade signal if significant analysis exists
          const signal = await this.analyzeNewsForSymbol(symbol, response);
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

      if (recentArticles.length === 0 || !data.analysis) {
        return null;
      }

      // Find the most significant analysis (highest confidence non-stable signal)
      const significantAnalyses = data.analysis
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

  // Add this method to allow updating config from orchestrator
  updateConfig(newConfig: Partial<NewsAgentConfig["config"]>) {
    if (newConfig.symbols) {
      this.config.config.symbols = [...newConfig.symbols]; // Replace with new symbols
    }
    if (newConfig.updateInterval) {
      this.config.config.updateInterval = newConfig.updateInterval;
    }
    if (newConfig.newsSources) {
      this.config.config.newsSources = [...newConfig.newsSources];
    }
    // If agent is running, restart monitoring with new config
    if (this.config.status === "ACTIVE") {
      this.stop().then(() => this.start());
    }
  }
}
