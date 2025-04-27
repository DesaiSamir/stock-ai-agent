import { TradeSignal } from '@/types/agent';
import { HttpClient } from './http-client';

interface Position {
  symbol: string;
  shares: number;
  averagePrice: number;
  totalCost: number;
}

interface PortfolioSummary {
  positions: Position[];
  cash: number;
  totalValue: number;
}

export class TradingService {
  private static instance: TradingService;
  private httpClient: HttpClient;

  private constructor() {
    this.httpClient = HttpClient.getInstance();
  }

  public static getInstance(): TradingService {
    if (!TradingService.instance) {
      TradingService.instance = new TradingService();
    }
    return TradingService.instance;
  }

  public async getTradeSignals(symbol?: string): Promise<TradeSignal[]> {
    const url = symbol ? `/trading/signals/${symbol}` : '/trading/signals';
    return this.httpClient.get<TradeSignal[]>(url);
  }

  public async executeTrade(signal: TradeSignal): Promise<Position> {
    return this.httpClient.post<Position>('/trading/execute', signal);
  }

  public async getPositions(): Promise<Position[]> {
    return this.httpClient.get<Position[]>('/trading/positions');
  }

  public async getPortfolioSummary(): Promise<PortfolioSummary> {
    return this.httpClient.get<PortfolioSummary>('/trading/portfolio');
  }

  public async setCash(amount: number): Promise<void> {
    await this.httpClient.post('/trading/cash', { amount });
  }
} 