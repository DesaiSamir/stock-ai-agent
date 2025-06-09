import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/app/api/services/ai/aiService';
import { TradeSignal } from '@/types/agent';
import { ChartAnalysisRequest } from '@/types/chart-analysis';

export async function POST(req: NextRequest) {
  const request: ChartAnalysisRequest = await req.json();

  // Use AI service for chart analysis
  const aiResult = await aiService.analyzeChart(request);

  // Use the last bar for price and timestamp
  const lastBar = request.bars?.[request.bars.length - 1];

  const response: TradeSignal = {
    symbol: request.symbol,
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
    price: lastBar?.close ?? 0,
    timestamp: new Date(),
    source: 'ANALYSIS',
  }

  return NextResponse.json(response);
} 