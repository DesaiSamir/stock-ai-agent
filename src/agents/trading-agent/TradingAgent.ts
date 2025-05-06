import { EventEmitter } from "events";
import type { 
  TradeSignal, 
  StockData, 
  TradingAgentConfig, 
  AgentConfig,
  TradeExecution,
  Position
} from "../../types/agent";

export class TradingAgent extends EventEmitter {
  private config: TradingAgentConfig;
  private positions: Map<string, Position> = new Map();
  private cash: number = 0;
  private totalValue: number = 0;

  constructor(config: TradingAgentConfig) {
    super();
    this.config = config;
  }

  async start(): Promise<void> {
    console.log("Starting Trading Agent...");
    this.config.status = "ACTIVE";
    this.config.lastUpdated = new Date();
  }

  async stop(): Promise<void> {
    this.config.status = "INACTIVE";
  }

  async handleTradeSignal(signal: TradeSignal): Promise<void> {
    try {
      if (signal.confidence < this.config.config.minConfidence) {
        console.log(`Ignoring low confidence signal for ${signal.symbol}`);
        return;
      }

      const position = this.positions.get(signal.symbol);

      switch (signal.action) {
        case "BUY":
          await this.executeBuy(signal, position);
          break;
        case "SELL":
          await this.executeSell(signal, position);
          break;
        default:
          console.log(`Unknown action ${signal.action} for ${signal.symbol}`);
      }

      this.config.lastUpdated = new Date();
      this.emit("tradeExecuted", {
        symbol: signal.symbol,
        action: signal.action,
        price: signal.price,
        quantity: position?.quantity || 0,
        timestamp: new Date()
      } as TradeExecution);
    } catch (error) {
      console.error("Error handling trade signal:", error);
      this.config.status = "ERROR";
      this.emit("error", error);
    }
  }

  private async executeBuy(
    signal: TradeSignal,
    existingPosition?: Position,
  ): Promise<void> {
    const availableCash = this.cash;
    const maxPosition = this.config.config.maxPositionSize;
    const currentExposure = existingPosition ? existingPosition.quantity * existingPosition.averagePrice : 0;
    const remainingCapacity = maxPosition - currentExposure;

    if (remainingCapacity <= 0) {
      console.log(`Maximum position size reached for ${signal.symbol}`);
      return;
    }

    const sharesToBuy = Math.floor(
      Math.min(availableCash, remainingCapacity) / signal.price,
    );

    if (sharesToBuy <= 0) {
      console.log(`Insufficient funds to buy ${signal.symbol}`);
      return;
    }

    const totalCost = sharesToBuy * signal.price;
    this.cash -= totalCost;

    if (existingPosition) {
      // Update existing position
      const newQuantity = existingPosition.quantity + sharesToBuy;
      const newAveragePrice = (existingPosition.quantity * existingPosition.averagePrice + totalCost) / newQuantity;
      this.positions.set(signal.symbol, {
        symbol: signal.symbol,
        quantity: newQuantity,
        averagePrice: newAveragePrice,
        currentPrice: signal.price,
        unrealizedPnL: (signal.price - newAveragePrice) * newQuantity
      });
    } else {
      // Create new position
      this.positions.set(signal.symbol, {
        symbol: signal.symbol,
        quantity: sharesToBuy,
        averagePrice: signal.price,
        currentPrice: signal.price,
        unrealizedPnL: 0
      });
    }
  }

  private async executeSell(
    signal: TradeSignal,
    existingPosition?: Position,
  ): Promise<void> {
    if (!existingPosition || existingPosition.quantity <= 0) {
      console.log(`No position to sell for ${signal.symbol}`);
      return;
    }

    const proceeds = existingPosition.quantity * signal.price;
    this.cash += proceeds;

    // Clear the position
    this.positions.delete(signal.symbol);
  }

  updatePortfolioValue(stockData: StockData[]): void {
    let portfolioValue = this.cash;

    stockData.forEach((data) => {
      const position = this.positions.get(data.symbol);
      if (position) {
        const currentValue = position.quantity * data.price;
        position.currentPrice = data.price;
        position.unrealizedPnL = (data.price - position.averagePrice) * position.quantity;
        portfolioValue += currentValue;
      }
    });

    this.totalValue = portfolioValue;
  }

  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getStatus(): AgentConfig {
    return this.config;
  }
}
