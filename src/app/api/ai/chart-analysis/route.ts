import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/app/api/services/ai/aiService';
import { TradeSignal } from '@/types/agent';

export async function POST(req: NextRequest) {
  const { symbol, bars } = await req.json();

  // Use AI service for chart analysis
  const aiResult = await aiService.analyzeChart(symbol, bars);

  // Use the last bar for price and timestamp
  const lastBar = bars[bars.length - 1];

  const response: TradeSignal = {
    symbol,
    action: aiResult.action as 'BUY' | 'SELL',
    confidence: aiResult.confidence,
    analysis: {
      sentiment: aiResult.confidence > 0.7 ? 'bullish' : 'bearish',
      keyEvents: [],
      reasoning: aiResult?.reasoning,
      predictedImpact: {
        magnitude: aiResult.confidence,
        timeframe: 'short-term',
      },
      optionsPlay: aiResult?.optionsPlay,
    },
    rawResponse: aiResult.rawResponse,
    price: lastBar.close,
    timestamp: new Date(),
    source: 'ANALYSIS',
  }

  return NextResponse.json(response);
} 