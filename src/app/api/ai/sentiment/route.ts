import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '../../services/ai/aiService';

interface SentimentRequest {
  texts: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SentimentRequest;
    
    if (!body.texts || !Array.isArray(body.texts)) {
      return NextResponse.json(
        { error: 'Invalid request: texts array is required' },
        { status: 400 }
      );
    }

    const sentiment = await aiService.analyzeSentiment(body.texts);
    return NextResponse.json(sentiment);
  } catch (error) {
    console.error('Sentiment analysis failed:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentiment' },
      { status: 500 }
    );
  }
} 