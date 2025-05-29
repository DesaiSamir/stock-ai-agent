import { EventEmitter } from "events";
import { AnalysisAgent } from "./analysis-agent/AnalysisAgent";
import { TradingAgent } from "./trading-agent/TradingAgent";
import { NewsAgent } from "./news-agent/NewsAgent";
import { TickerAgent } from "./ticker-agent/TickerAgent";
import type { 
  TradeSignal, 
  StockData, 
  AgentConfig,
  AgentType,
  TradeExecution
} from "../types/agent";

interface OrchestratorConfig {
  symbols: string[];
  updateInterval: number;
  technicalIndicators: string[];
  fundamentalMetrics: string[];
  minConfidence: number;
  maxPositionSize: number;
  riskLimit: number;
  newsSources: string[];
  dataSource: string;
}

// Store interface for what the orchestrator needs
interface StoreInterface {
  isOrchestratorRunning: boolean;
  setOrchestratorRunning: (running: boolean) => void;
}

export class AgentOrchestrator extends EventEmitter {
  private analysisAgent: AnalysisAgent;
  private tradingAgent: TradingAgent;
  private newsAgent: NewsAgent;
  private tickerAgent: TickerAgent;
  private config: OrchestratorConfig;
  private isRunning: boolean = false;
  private store: StoreInterface | null = null;

  constructor(config: OrchestratorConfig) {
    super();
    this.config = config;

    // Initialize agents with their specific configurations
    this.analysisAgent = new AnalysisAgent({
      name: "Analysis Agent",
      type: "ANALYSIS" as AgentType,
      status: "INACTIVE",
      lastUpdated: new Date(),
      config: {
        symbols: config.symbols,
        updateInterval: config.updateInterval,
        technicalIndicators: config.technicalIndicators,
        fundamentalMetrics: config.fundamentalMetrics,
      },
    });

    this.tradingAgent = new TradingAgent({
      name: "Trading Agent",
      type: "TRADING" as AgentType,
      status: "INACTIVE",
      lastUpdated: new Date(),
      config: {
        symbols: config.symbols,
        updateInterval: config.updateInterval,
        minConfidence: config.minConfidence,
        maxPositionSize: config.maxPositionSize,
        riskLimit: config.riskLimit,
      },
    });

    this.newsAgent = new NewsAgent({
      name: "News Agent",
      type: "NEWS" as AgentType,
      status: "INACTIVE",
      lastUpdated: new Date(),
      config: {
        symbols: config.symbols,
        updateInterval: config.updateInterval,
        newsSources: config.newsSources,
      },
    });

    this.tickerAgent = new TickerAgent({
      name: "Ticker Agent",
      type: "TICKER" as AgentType,
      status: "INACTIVE",
      lastUpdated: new Date(),
      config: {
        symbols: config.symbols,
        updateInterval: config.updateInterval,
        dataSource: config.dataSource,
      },
    });

    this.setupEventHandlers();
  }

  // Method to set the store interface
  setStore(store: StoreInterface) {
    this.store = store;
  }

  private setupEventHandlers(): void {
    // Handle ticker data updates
    this.tickerAgent.on("priceUpdate", (stockData: StockData) => {
      this.analysisAgent.emit("priceUpdate", stockData);
      this.tradingAgent.emit("priceUpdate", stockData);
    });

    // Handle analysis signals
    this.analysisAgent.on("analysisComplete", (signal: TradeSignal) => {
      this.tradingAgent.handleTradeSignal(signal);
      // Re-emit analysis signal
      this.emit("analysisSignal", signal);
    });

    // Handle news signals
    this.newsAgent.on("newsSignal", (signal: TradeSignal) => {
      this.tradingAgent.handleTradeSignal(signal);
      // Re-emit news signal
      this.emit("newsSignal", signal);
    });

    // Handle trading execution
    this.tradingAgent.on("tradeExecuted", (trade: TradeExecution) => {
      this.emit("tradeExecuted", trade);
    });

    // Handle errors from all agents
    [this.analysisAgent, this.tradingAgent, this.newsAgent, this.tickerAgent].forEach(
      (agent) => {
        agent.on("error", (error: Error) => {
          this.handleAgentError(error, agent);
        });
      }
    );
  }

  private handleAgentError(error: Error, agent: EventEmitter): void {
    console.error(`Agent error:`, error);
    this.emit("error", { agent, error });
  }

  async start(): Promise<void> {
    if (!this.store) {
      throw new Error("Store not initialized. Call setStore before starting the orchestrator.");
    }
    
    // Check both local and persisted running state
    if (this.isRunning || this.store.isOrchestratorRunning) {
      console.log("Orchestrator is already running (either locally or in persisted state)");
      return;
    }

    console.log("Starting Agent Orchestrator...");

    try {
      // Start agents in the correct order
      await this.tickerAgent.start();
      await this.newsAgent.start();
      await this.analysisAgent.start();
      await this.tradingAgent.start();

      this.isRunning = true;
      this.store.setOrchestratorRunning(true);
      this.emit("started");
    } catch (error) {
      console.error("Error starting orchestrator:", error);
      this.isRunning = false;
      this.store.setOrchestratorRunning(false);
      await this.stop();
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.store) {
      throw new Error("Store not initialized. Call setStore before stopping the orchestrator.");
    }

    if (!this.isRunning && !this.store.isOrchestratorRunning) {
      console.log("Orchestrator is already stopped");
      return;
    }

    console.log("Stopping Agent Orchestrator...");

    try {
      // Stop agents in reverse order
      await this.tradingAgent.stop();
      await this.analysisAgent.stop();
      await this.newsAgent.stop();
      await this.tickerAgent.stop();

      this.isRunning = false;
      this.store.setOrchestratorRunning(false);
      this.emit("stopped");
    } catch (error) {
      console.error("Error stopping orchestrator:", error);
      // Still mark as stopped even on error to allow retry
      this.isRunning = false;
      this.store.setOrchestratorRunning(false);
      throw error;
    }
  }

  getAgentStatuses(): Record<string, AgentConfig> {
    return {
      ticker: this.tickerAgent.getStatus(),
      analysis: this.analysisAgent.getStatus(),
      news: this.newsAgent.getStatus(),
      trading: this.tradingAgent.getStatus(),
    };
  }

  updateConfig(newConfig: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // TODO: Implement config update logic for individual agents
  }

  getPositions() {
    return this.tradingAgent.getPositions();
  }
} 