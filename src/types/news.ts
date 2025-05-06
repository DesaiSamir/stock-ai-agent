import { NewsItem } from "./agent";

export interface FinnhubNewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  source: string;
  summary: string;
  url: string;
}

export interface AlphaVantageNewsItem {
  title: string;
  url: string;
  time_published: string;
  summary: string;
  source: string;
  ticker_sentiment: Array<{
    ticker: string;
    relevance_score: number;
    ticker_sentiment_score: number;
  }>;
}

export interface NewsAnalysis {
  keyTopics: string[];
  marketImpact: string;
  tradingSignals: string[];
  confidence: number;
  relatedSymbols?: string[];
}

export interface NewsCache {
  timestamp: number;
  data: NewsItem[];
}

export interface AnalysisCache {
  timestamp: number;
  data: NewsAnalysis;
} 