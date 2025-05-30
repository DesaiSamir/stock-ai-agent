import { EventEmitter } from "events";
import type { 
  AnalysisAgentConfig, 
  TradeSignal, 
  StockData, 
  AgentConfig 
} from "../../types/agent";
import { useMarketDataStore } from '@/store/market-data';

export class AnalysisAgent extends EventEmitter {
  private config: AnalysisAgentConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastAnalysisTime: number = 0;

  constructor(config: AnalysisAgentConfig) {
    super();
    this.config = config;
  }

  async start(): Promise<void> {
    console.log("Starting Analysis Agent...");
    this.config.status = "ACTIVE";
    this.config.lastUpdated = new Date();

    // Start the monitoring loop
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Initial analysis (always run once on start)
    await this.analyzeStocks();

    this.monitoringInterval = setInterval(
      () => this.analyzeStocks(),
      this.config.config.updateInterval,
    );
  }

  async stop(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.config.status = "INACTIVE";
  }

  private async analyzeStocks(): Promise<void> {
    const now = Date.now();
    // Only skip if this is not the first call and called too soon
    if (this.lastAnalysisTime && now - this.lastAnalysisTime < this.config.config.updateInterval - 1000) {
      return;
    }
    this.lastAnalysisTime = now;
    try {
      const analysisResults = await Promise.all(
        this.config.config.symbols.map((symbol) => this.analyzeStock(symbol)),
      );

      // Emit analysis results
      analysisResults.forEach((signal: TradeSignal | null) => {
        if (signal) {
          this.emit("analysisComplete", signal);
        }
      });

      this.config.lastUpdated = new Date();
    } catch (error) {
      console.error("Error analyzing stocks:", error);
      this.config.status = "ERROR";
      this.emit("error", error);
    }
  }

  private async analyzeStock(symbol: string): Promise<TradeSignal | null> {
    try {
      // Get last 30 bars for the symbol
      const bars = useMarketDataStore.getState().barData[symbol] || [];
      const last30Bars = bars.slice(-30);
      if (last30Bars.length < 10) return null; // Not enough data

      // Call the AI endpoint
      const response = await fetch('/api/ai/chart-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, bars: last30Bars }),
      });
      if (!response.ok) throw new Error('AI analysis failed');
      const data = await response.json();

      return {
        symbol,
        action: data.action,
        price: data.price,
        confidence: data.confidence,
        timestamp: new Date(data.timestamp),
        source: 'ANALYSIS',
        analysis: {
          sentiment: data.confidence > 0.7 ? 'bullish' : 'bearish',
          keyEvents: [],
          reasoning: data.reasoning,
          predictedImpact: {
            magnitude: data.confidence,
            timeframe: 'short-term',
          },
        },
      };
    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error);
      return null;
    }
  }

  private async calculateTechnicalIndicators(
    stockData: StockData[],
  ): Promise<Record<string, number>> {
    // TODO: Implement actual technical analysis calculations
    console.log("Calculating technical indicators...", stockData);
    return this.config.config.technicalIndicators.reduce(
      (acc, indicator) => {
        acc[indicator] = Math.random(); // Placeholder values
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private async analyzeFundamentals(
    symbol: string,
  ): Promise<Record<string, number>> {
    // TODO: Implement actual fundamental analysis calculations
    console.log("Analyzing fundamentals...", symbol);
    return this.config.config.fundamentalMetrics.reduce(
      (acc, metric) => {
        acc[metric] = Math.random(); // Placeholder values
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  getStatus(): AgentConfig {
    return this.config;
  }
}
