import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '../../services/ai/aiService';
import { AIAnalysisRequest } from '../../services/ai/aiService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AIAnalysisRequest;
    
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }

    const analysis = await aiService.analyzeMarket(body);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Market analysis failed:', error);
    return NextResponse.json(
      { error: 'Failed to analyze market data' },
      { status: 500 }
    );
  }
} 