import { NewsItem } from "@/types/agent";
import { HttpClient } from "./http-client";

export class NewsService {
  private static instance: NewsService;
  private httpClient: HttpClient;

  private constructor() {
    this.httpClient = HttpClient.getInstance();
  }

  public static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  public async getNews(symbol?: string): Promise<NewsItem[]> {
    const url = symbol ? `/news/${symbol}` : "/news";
    return this.httpClient.get<NewsItem[]>(url);
  }

  public async getLatestNews(limit: number = 10): Promise<NewsItem[]> {
    return this.httpClient.get<NewsItem[]>("/news/latest", {
      params: { limit },
    });
  }

  public async analyzeSentiment(newsId: string): Promise<number> {
    const response = await this.httpClient.get<{ sentiment: number }>(
      `/news/${newsId}/sentiment`,
    );
    return response.sentiment;
  }
}
