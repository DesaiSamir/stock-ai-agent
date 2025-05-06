import { NextResponse } from 'next/server';
import { newsService } from '../services/news/newsService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const skipAnalysis = searchParams.get('skipAnalysis') === 'true';
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    if (skipAnalysis) {
      // Just fetch and combine news without AI analysis
      const news = await newsService.getNews(symbol);
      return NextResponse.json({
        articles: news,
        metadata: {
          symbol,
          timestamp: new Date().toISOString(),
          sources: ['Finnhub', 'Alpha Vantage']
        }
      });
    }

    // Get news with AI analysis
    const result = await newsService.getNewsWithAnalysis(symbol);
    return NextResponse.json(result);
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
} 