import { EventEmitter } from 'events';
import { TradingAgent } from '@/agents/trading-agent/TradingAgent';
import type { TradeSignal, TradeExecution, TradingAgentConfig } from '@/types/agent';
import { logger } from '@/utils/logger';

export class AgentHandler extends EventEmitter {
  private static instance: AgentHandler;
  private tradingAgent: TradingAgent;
  private isActive: boolean = false;
  private symbols: string[] = [];

  private constructor() {
    super();
    
    // Initialize trading agent with default config
    const config: TradingAgentConfig = {
      name: 'Trading Agent',
      type: 'TRADING',
      status: 'INACTIVE',
      lastUpdated: new Date(),
      config: {
        symbols: [],
        updateInterval: 5000, // 5 seconds
        minConfidence: 0.7,
        maxPositionSize: 100000, // $100k max position
        riskLimit: 0.02 // 2% risk per trade
      }
    };

    this.tradingAgent = new TradingAgent(config);
    this.setupEventListeners();
  }

  public static getInstance(): AgentHandler {
    if (!AgentHandler.instance) {
      AgentHandler.instance = new AgentHandler();
    }
    return AgentHandler.instance;
  }

  private setupEventListeners(): void {
    // Listen for trade executions
    this.tradingAgent.on('tradeExecuted', (execution: TradeExecution) => {
      this.emit('tradeExecuted', execution);
      logger.info({
        message: 'Trade executed',
        execution
      });
    });

    // Listen for errors
    this.tradingAgent.on('error', (error: Error) => {
      this.emit('error', error);
      logger.error({
        message: 'Trading agent error',
        error
      });
    });
  }

  public start(symbols: string[]): void {
    if (this.isActive) return;
    
    this.symbols = symbols;
    this.isActive = true;
    this.emit('started', { symbols });
    logger.info({
      message: 'Agent handler started',
      symbols
    });
  }

  public stop(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.emit('stopped');
    logger.info({
      message: 'Agent handler stopped'
    });
  }

  public async processTradeSignal(signal: TradeSignal): Promise<void> {
    if (!this.isActive) {
      logger.warn({
        message: 'Cannot process trade signal - agent handler is not active'
      });
      return;
    }

    try {
      await this.tradingAgent.handleTradeSignal(signal);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      logger.error({
        message: 'Error processing trade signal',
        error: err,
        signal
      });
      throw err;
    }
  }

  public getPositions() {
    return Array.from(this.tradingAgent['positions'].values());
  }

  public isRunning(): boolean {
    return this.isActive;
  }

  public getSymbols(): string[] {
    return this.symbols;
  }
} 