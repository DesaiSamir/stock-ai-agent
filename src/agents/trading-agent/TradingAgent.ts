import type { TradeSignal, StockData, AgentConfig } from '../../types/agent';
import { EventEmitter } from 'events';

interface TradingAgentConfig extends Omit<AgentConfig, 'config'> {
  config: {
    symbols: string[];
    minConfidence: number;
    maxPositionSize: number;
    riskLimit: number;
  };
}

interface Position {
  symbol: string;
  shares: number;
  averagePrice: number;
  totalCost: number;
}

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
    console.log('Starting Trading Agent...');
    this.config.status = 'ACTIVE';
    this.config.lastUpdated = new Date();
  }

  async stop(): Promise<void> {
    this.config.status = 'INACTIVE';
  }

  async handleTradeSignal(signal: TradeSignal): Promise<void> {
    try {
      if (signal.confidence < this.config.config.minConfidence) {
        console.log(`Ignoring low confidence signal for ${signal.symbol}`);
        return;
      }

      const position = this.positions.get(signal.symbol);
      
      switch (signal.action) {
        case 'BUY':
          await this.executeBuy(signal, position);
          break;
        case 'SELL':
          await this.executeSell(signal, position);
          break;
        case 'HOLD':
          console.log(`Holding position for ${signal.symbol}`);
          break;
      }

      this.config.lastUpdated = new Date();
      this.emit('tradeExecuted', {
        symbol: signal.symbol,
        action: signal.action,
        price: signal.price,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error handling trade signal:', error);
      this.config.status = 'ERROR';
      this.emit('error', error);
    }
  }

  private async executeBuy(signal: TradeSignal, existingPosition?: Position): Promise<void> {
    // TODO: Implement actual buy execution logic
    // This is a placeholder implementation
    const availableCash = this.cash;
    const maxPosition = this.config.config.maxPositionSize;
    const currentExposure = existingPosition?.totalCost || 0;
    const remainingCapacity = maxPosition - currentExposure;
    
    if (remainingCapacity <= 0) {
      console.log(`Maximum position size reached for ${signal.symbol}`);
      return;
    }

    const sharesToBuy = Math.floor(Math.min(availableCash, remainingCapacity) / signal.price);
    
    if (sharesToBuy <= 0) {
      console.log(`Insufficient funds to buy ${signal.symbol}`);
      return;
    }

    const totalCost = sharesToBuy * signal.price;
    this.cash -= totalCost;

    if (existingPosition) {
      // Update existing position
      const newShares = existingPosition.shares + sharesToBuy;
      const newTotalCost = existingPosition.totalCost + totalCost;
      this.positions.set(signal.symbol, {
        symbol: signal.symbol,
        shares: newShares,
        averagePrice: newTotalCost / newShares,
        totalCost: newTotalCost
      });
    } else {
      // Create new position
      this.positions.set(signal.symbol, {
        symbol: signal.symbol,
        shares: sharesToBuy,
        averagePrice: signal.price,
        totalCost: totalCost
      });
    }
  }

  private async executeSell(signal: TradeSignal, existingPosition?: Position): Promise<void> {
    // TODO: Implement actual sell execution logic
    // This is a placeholder implementation
    if (!existingPosition || existingPosition.shares <= 0) {
      console.log(`No position to sell for ${signal.symbol}`);
      return;
    }

    const proceeds = existingPosition.shares * signal.price;
    this.cash += proceeds;

    // Clear the position
    this.positions.delete(signal.symbol);
  }

  updatePortfolioValue(stockData: StockData[]): void {
    let portfolioValue = this.cash;

    stockData.forEach(data => {
      const position = this.positions.get(data.symbol);
      if (position) {
        portfolioValue += position.shares * data.price;
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