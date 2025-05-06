import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '../../services/ai/aiService';

interface TradingStrategyRequest {
  symbol: string;
  timeframe: string;
  riskTolerance: 'low' | 'medium' | 'high';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TradingStrategyRequest;
    
    if (!body.symbol || !body.timeframe || !body.riskTolerance) {
      return NextResponse.json(
        { error: 'Invalid request: symbol, timeframe, and riskTolerance are required' },
        { status: 400 }
      );
    }

    const strategy = await aiService.generateTradingStrategy(
      body.symbol,
      body.timeframe,
      body.riskTolerance
    );

    return NextResponse.json({ strategy });
  } catch (error) {
    console.error('Trading strategy generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate trading strategy' },
      { status: 500 }
    );
  }
} 