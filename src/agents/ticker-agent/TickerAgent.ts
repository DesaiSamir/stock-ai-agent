import type { StockData, AgentConfig } from "../../types/agent";
import { EventEmitter } from "events";

interface TickerAgentConfig extends Omit<AgentConfig, "config"> {
  config: {
    symbols: string[];
    updateInterval: number;
  };
}

export class TickerAgent extends EventEmitter {
  private config: TickerAgentConfig;
  private symbols: string[];
  private updateInterval: number;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(config: TickerAgentConfig) {
    super();
    this.config = config;
    this.symbols = config.config.symbols;
    this.updateInterval = config.config.updateInterval;
  }

  async start(): Promise<void> {
    console.log("Starting Ticker Agent...");
    this.config.status = "ACTIVE";
    this.config.lastUpdated = new Date();

    // Start the monitoring loop
    this.monitoringInterval = setInterval(
      () => this.monitorPrices(),
      this.updateInterval,
    );

    // Initial monitoring
    await this.monitorPrices();
  }

  async stop(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.config.status = "INACTIVE";
  }

  private async monitorPrices(): Promise<void> {
    try {
      const stockUpdates = await Promise.all(
        this.symbols.map((symbol) => this.fetchStockPrice(symbol)),
      );

      // Emit updates for each stock
      stockUpdates.forEach((stock: StockData | null) => {
        if (stock) {
          this.emit("stockUpdate", stock);
        }
      });

      this.config.lastUpdated = new Date();
    } catch (error) {
      console.error("Error monitoring stock prices:", error);
      this.config.status = "ERROR";
      this.emit("error", error);
    }
  }

  private async fetchStockPrice(symbol: string): Promise<StockData | null> {
    try {
      // TODO: Implement actual stock price fetching logic
      // This is a placeholder implementation
      const mockPrice = Math.random() * 1000;
      const mockVolume = Math.floor(Math.random() * 1000000);

      return {
        symbol,
        price: mockPrice,
        volume: mockVolume,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  getStatus(): AgentConfig {
    return this.config;
  }
}
