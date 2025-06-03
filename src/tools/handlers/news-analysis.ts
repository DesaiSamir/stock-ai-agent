import { BaseTool } from '../base';
import type { ActionContext, ActionResult } from '../../types/actions';
import type { ToolType } from '../../types/tools';
import { logger } from '@/utils/logger';
import { ENDPOINTS } from '@/constants/http';
import { httpService } from '@/services/http-client';
import { useNewsStore } from '@/store/news-store';
import type { NewsItem } from '@/types/agent';
import type { NewsArticle, NewsAnalysis } from '@/store/news-store';

interface NewsAPIResponse {
  articles: Array<NewsItem>;
  analysis: Array<{
    keyTopics: string[];
    marketImpact: string;
    tradingSignals: string[];
    confidence: number;
  }>;
  metadata: {
    symbol: string;
    timestamp: string;
    sources: string[];
  };
}

interface NewsAnalysisPayload {
  symbol: string;
  timeframe?: '1d' | '1w' | '1m';
  limit?: number;
  sources?: string[];
}

interface NewsAnalysisResult {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  articles: Array<{
    title: string;
    source: string;
    url: string;
    sentiment: number;
    timestamp: string;
  }>;
  summary: string;
  keyTopics?: string[];
  marketImpact?: {
    direction: 'up' | 'down' | 'stable';
    magnitude: number;
    timeframe: 'immediate' | 'short-term' | 'long-term';
  };
}

export class NewsAnalysisTool extends BaseTool {
  public readonly type: ToolType = 'NEWS_ANALYSIS';
  public readonly description = 'Analyzes news sentiment and impact for stocks';
  public readonly payloadSchema = {
    type: 'object',
    properties: {
      symbol: { type: 'string' },
      timeframe: { 
        type: 'string', 
        enum: ['1d', '1w', '1m'],
        optional: true
      },
      limit: { type: 'number', optional: true },
      sources: { 
        type: 'array',
        items: { type: 'string' },
        optional: true
      }
    },
    required: ['symbol']
  };

  async execute(
    payload: Record<string, unknown>,
    context: ActionContext
  ): Promise<ActionResult> {
    try {
      const newsPayload = this.validatePayload(payload);
      
      // Fetch and analyze news
      const analysis = await this.analyzeNews(newsPayload);
      
      const result = this.createSuccessResult(analysis, {
        query: newsPayload
      });

      this.logTool(context, result);
      return result;
    } catch (error) {
      const errorResult = this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown error occurred',
        { payload }
      );
      this.logTool(context, errorResult);
      return errorResult;
    }
  }

  private validatePayload(payload: Record<string, unknown>): NewsAnalysisPayload {
    if (!payload.symbol || typeof payload.symbol !== 'string') {
      throw new Error('Symbol is required and must be a string');
    }
    return payload as unknown as NewsAnalysisPayload;
  }

  private async analyzeNews(payload: NewsAnalysisPayload): Promise<NewsAnalysisResult> {
    try {
      // Fetch news data from API
      const response = await httpService.get<NewsAPIResponse>(
        `${ENDPOINTS.NEWS.GET_NEWS}?symbol=${payload.symbol}`
      );

      // Convert API response to store format
      const articles: NewsArticle[] = response.articles.map(article => ({
        id: `${payload.symbol}-${article.publishedAt}-${article.url}`,
        title: article.title,
        description: article.description || '',
        url: article.url,
        source: article.source,
        publishedAt: article.publishedAt
      }));

      const analysis: NewsAnalysis[] = response.analysis.map(a => ({
        keyTopics: a.keyTopics,
        marketImpact: a.marketImpact,
        tradingSignals: a.tradingSignals,
        confidence: a.confidence
      }));

      // Store news data
      useNewsStore.getState().addNewsData(payload.symbol, articles, analysis);

      // Get most significant analysis
      const significantAnalysis = this.findSignificantAnalysis(response.analysis);
      
      // Parse market impact if available
      let marketImpact;
      if (significantAnalysis?.marketImpact) {
        const impactMatch = significantAnalysis.marketImpact.match(
          /(up|down|stable)\s*\((\d+(?:\.\d+)?)%\)\s*(immediate|short-term|long-term)/i
        );
        if (impactMatch) {
          const [, direction, magnitude, timeframe] = impactMatch;
          marketImpact = {
            direction: direction.toLowerCase() as 'up' | 'down' | 'stable',
            magnitude: parseFloat(magnitude),
            timeframe: timeframe as 'immediate' | 'short-term' | 'long-term'
          };
        }
      }

      // Filter recent articles based on timeframe
      const timeframeHours = payload.timeframe === '1m' ? 720 : 
                            payload.timeframe === '1w' ? 168 : 24;
      const cutoffTime = new Date(Date.now() - timeframeHours * 60 * 60 * 1000).toISOString();
      
      const filteredArticles = response.articles
        .filter(article => article.publishedAt > cutoffTime)
        .slice(0, payload.limit || 10)
        .map(article => ({
          title: article.title,
          source: article.source,
          url: article.url,
          sentiment: article.sentiment || 0,
          timestamp: article.publishedAt
        }));

      // Determine overall sentiment
      const overallSentiment = significantAnalysis?.tradingSignals?.[0]?.toUpperCase() as 'BULLISH' | 'BEARISH' | 'NEUTRAL' || 'NEUTRAL';
      
      return {
        sentiment: overallSentiment,
        confidence: significantAnalysis?.confidence || 0.5,
        articles: filteredArticles,
        summary: significantAnalysis ? 
          `Market impact: ${significantAnalysis.marketImpact}. Key topics: ${significantAnalysis.keyTopics.join(", ")}` :
          'No significant news impact detected',
        keyTopics: significantAnalysis?.keyTopics,
        marketImpact
      };
    } catch (error) {
      logger.error({message: 'Error analyzing news:', error: error as Error});
      throw error;
    }
  }

  private findSignificantAnalysis(analyses: NewsAPIResponse['analysis']) {
    if (!analyses?.length) return null;

    // Find analysis with highest confidence that isn't stable
    return analyses
      .filter(analysis => {
        const impactMatch = analysis.marketImpact.match(/(up|down|stable)/i);
        return impactMatch && impactMatch[1].toLowerCase() !== 'stable' && analysis.confidence >= 0.7;
      })
      .sort((a, b) => b.confidence - a.confidence)[0] || null;
  }
} 