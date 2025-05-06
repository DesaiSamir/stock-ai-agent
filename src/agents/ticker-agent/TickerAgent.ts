import { EventEmitter } from "events";
import type { TickerAgentConfig, StockData, AgentConfig } from "../../types/agent";

export class TickerAgent extends EventEmitter {
  private config: TickerAgentConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(config: TickerAgentConfig) {
    super();
    this.config = config;
  }

  async start(): Promise<void> {
    console.log("Starting Ticker Agent...");
    this.config.status = "ACTIVE";
    this.config.lastUpdated = new Date();

    // Start the monitoring loop
    this.monitoringInterval = setInterval(
      () => this.monitorPrices(),
      this.config.config.updateInterval,
    );

    // Initial price check
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
      const priceUpdates = await Promise.all(
        this.config.config.symbols.map((symbol) => this.fetchPrice(symbol)),
      );

      // Emit price updates
      priceUpdates.forEach((stockData: StockData | null) => {
        if (stockData) {
          this.emit("priceUpdate", stockData);
        }
      });

      this.config.lastUpdated = new Date();
    } catch (error) {
      console.error("Error monitoring prices:", error);
      this.config.status = "ERROR";
      this.emit("error", error);
    }
  }

  private async fetchPrice(symbol: string): Promise<StockData | null> {
    try {
      // TODO: Implement actual price fetching from the configured data source
      // This is a placeholder implementation
      const mockPrice = Math.random() * 1000;
      const mockVolume = Math.floor(Math.random() * 1000000);

      return {
        symbol,
        price: mockPrice,
        volume: mockVolume,
        timestamp: new Date().toISOString(),
        open: mockPrice * 0.99,
        high: mockPrice * 1.02,
        low: mockPrice * 0.98,
        close: mockPrice,
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
