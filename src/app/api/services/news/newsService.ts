import axios from 'axios';
import { NewsItem } from '@/types/agent';
import { 
  FinnhubNewsItem, 
  AlphaVantageNewsItem, 
  NewsAnalysis, 
  NewsCache, 
  AnalysisCache 
} from '@/types/news';
import { HttpClient } from '@/app/api/services/http-client';
import { aiService } from '@/app/api/services/ai/aiService';

class NewsService {
  private static instance: NewsService;
  private httpClient: HttpClient;
  private newsCache: Map<string, NewsCache> = new Map();
  private analysisCache: Map<string, AnalysisCache> = new Map();
  private pendingRequests: Map<string, Promise<NewsItem[]>> = new Map();
  private lastAICallTimestamp: number = 0;
  private readonly AI_CALL_INTERVAL = 60000; // 1 minute in milliseconds
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  private constructor() {
    this.httpClient = HttpClient.getInstance();
    this.startCacheCleanup();
  }

  public static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      for (const [key, value] of this.newsCache.entries()) {
        if (!this.isCacheValid(value.timestamp)) {
          this.newsCache.delete(key);
        }
      }
      for (const [key, value] of this.analysisCache.entries()) {
        if (!this.isCacheValid(value.timestamp)) {
          this.analysisCache.delete(key);
        }
      }
    }, this.CACHE_DURATION);
  }

  private async waitForAIRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastAICallTimestamp;
    
    if (timeSinceLastCall < this.AI_CALL_INTERVAL) {
      const waitTime = this.AI_CALL_INTERVAL - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastAICallTimestamp = Date.now();
  }

  // Public API methods
  public async getNews(symbol?: string): Promise<NewsItem[]> {
    if (!symbol) {
      return this.getLatestNews();
    }
    return this.getNewsWithAnalysis(symbol).then(result => result.articles);
  }

  public async getLatestNews(limit: number = 10): Promise<NewsItem[]> {
    const cacheKey = `latest-${limit}`;
    
    const cached = this.newsCache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    const news = await this.httpClient.get<NewsItem[]>("/news/latest", {
      params: { limit },
    });

    this.newsCache.set(cacheKey, {
      timestamp: Date.now(),
      data: news
    });

    return news;
  }

  public async analyzeSentiment(newsId: string): Promise<number> {
    const cacheKey = `sentiment-${newsId}`;
    
    const cached = this.analysisCache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data.confidence;
    }

    const response = await this.httpClient.get<{ sentiment: number }>(
      `/news/${newsId}/sentiment`
    );
    return response.sentiment;
  }

  // External API methods
  public async getFinnhubNews(symbol: string): Promise<NewsItem[]> {
    const cacheKey = `finnhub-${symbol}`;
    
    const cached = this.newsCache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    let pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    pendingRequest = (async () => {
      try {
        const response = await axios.get<FinnhubNewsItem[]>(
          `https://finnhub.io/api/v1/company-news`,
          {
            params: {
              symbol,
              from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              to: new Date().toISOString().split('T')[0]
            },
            headers: {
              'X-Finnhub-Token': process.env.FINNHUB_API_KEY || ''
            }
          }
        );

        const news = response.data.map(item => ({
          id: item.id.toString(),
          title: item.headline,
          description: item.summary,
          url: item.url,
          source: 'Finnhub',
          publishedAt: new Date(item.datetime * 1000).toISOString()
        }));

        this.newsCache.set(cacheKey, {
          timestamp: Date.now(),
          data: news
        });

        return news;
      } catch (error) {
        console.error('Finnhub fetch error:', error);
        return [];
      } finally {
        this.pendingRequests.delete(cacheKey);
      }
    })();

    this.pendingRequests.set(cacheKey, pendingRequest);
    return pendingRequest;
  }

  public async getAlphaVantageNews(symbol: string): Promise<NewsItem[]> {
    const cacheKey = `alphavantage-${symbol}`;
    
    const cached = this.newsCache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    let pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    pendingRequest = (async () => {
      try {
        const response = await axios.get<{ feed: AlphaVantageNewsItem[] }>(
          'https://www.alphavantage.co/query',
          {
            params: {
              function: 'NEWS_SENTIMENT',
              tickers: symbol,
              apikey: process.env.ALPHA_VANTAGE_API_KEY
            }
          }
        );

        // Check if response data and feed exist
        if (!response.data || !response.data.feed) {
          console.warn('Invalid Alpha Vantage response format:', response.data);
          return [];
        }

        const news = response.data.feed.map(item => ({
          id: item.url,
          title: item.title,
          description: item.summary,
          url: item.url,
          source: 'Alpha Vantage',
          publishedAt: new Date(item.time_published).toISOString(),
          sentiment: item.ticker_sentiment[0]?.ticker_sentiment_score
        }));

        this.newsCache.set(cacheKey, {
          timestamp: Date.now(),
          data: news
        });

        return news;
      } catch (error) {
        console.error('Alpha Vantage fetch error:', error);
        return [];
      } finally {
        this.pendingRequests.delete(cacheKey);
      }
    })();

    this.pendingRequests.set(cacheKey, pendingRequest);
    return pendingRequest;
  }

  public async analyzeNews(news: NewsItem): Promise<NewsAnalysis | null> {
    const cacheKey = news.url;
    
    const cached = this.analysisCache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      await this.waitForAIRateLimit();

      const analysis = await aiService.analyzeNewsImpact([news], {
        currentPrice: 0,
        volume: 0,
        previousClose: 0
      });

      const newsAnalysis = {
        keyTopics: analysis.keyEvents,
        marketImpact: `${analysis.predictedImpact.priceDirection} (${analysis.predictedImpact.magnitudePercent}%) ${analysis.predictedImpact.timeframe}`,
        tradingSignals: [analysis.sentiment],
        confidence: analysis.confidence
      };

      this.analysisCache.set(cacheKey, {
        timestamp: Date.now(),
        data: newsAnalysis
      });

      return newsAnalysis;
    } catch (error) {
      console.error('Error analyzing news:', error);
      return null;
    }
  }

  public async getNewsWithAnalysis(symbol: string) {
    const [finnhubNews] = await Promise.all([
      this.getFinnhubNews(symbol),
      // this.getAlphaVantageNews(symbol)
    ]);

    // Deduplicate news by URL
    const uniqueNews = new Map<string, NewsItem>();
    [...finnhubNews].forEach(article => {
      if (!uniqueNews.has(article.url)) {
        uniqueNews.set(article.url, article);
      }
    });

    const allNews = Array.from(uniqueNews.values());
    
    // Sort by date, newest first
    allNews.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Get analysis for each news item
    const analysisPromises = allNews.map(news => this.analyzeNews(news));
    const analyses = await Promise.all(analysisPromises);

    return {
      articles: allNews,
      analyses: analyses.filter((a): a is NewsAnalysis => a !== null)
    };
  }
}

export const newsService = NewsService.getInstance(); 