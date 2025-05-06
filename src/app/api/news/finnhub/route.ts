import { NextResponse } from 'next/server';
import { newsService } from '../../services/news/newsService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const news = await newsService.getFinnhubNews(symbol);
    
    return NextResponse.json({
      articles: news,
      metadata: {
        symbol,
        timestamp: new Date().toISOString(),
        source: 'Finnhub'
      }
    });
  } catch (error) {
    console.error('Finnhub API error:', error);
    return NextResponse.json({ error: 'Failed to fetch Finnhub news' }, { status: 500 });
  }
} 