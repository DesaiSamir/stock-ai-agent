import { StockData } from '@/types/agent';
import { HttpClient } from './http-client';

export class StockService {
  private static instance: StockService;
  private httpClient: HttpClient;

  private constructor() {
    this.httpClient = HttpClient.getInstance();
  }

  public static getInstance(): StockService {
    if (!StockService.instance) {
      StockService.instance = new StockService();
    }
    return StockService.instance;
  }

  public async getStockPrice(symbol: string): Promise<StockData> {
    return this.httpClient.get<StockData>(`/stocks/${symbol}`);
  }

  public async getStockPrices(symbols: string[]): Promise<StockData[]> {
    return this.httpClient.post<StockData[]>('/stocks/batch', { symbols });
  }

  public async getHistoricalData(symbol: string, days: number): Promise<StockData[]> {
    return this.httpClient.get<StockData[]>(`/stocks/${symbol}/history`, {
      params: { days }
    });
  }
} 