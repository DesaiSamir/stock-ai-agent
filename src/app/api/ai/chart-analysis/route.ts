import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/app/api/services/ai/aiService';

export async function POST(req: NextRequest) {
  const { symbol, bars } = await req.json();

  // Use AI service for chart analysis
  const aiResult = await aiService.analyzeChart(symbol, bars);

  // Use the last bar for price and timestamp
  const lastBar = bars[bars.length - 1];

  return NextResponse.json({
    symbol,
    action: aiResult.action,
    confidence: aiResult.confidence,
    reasoning: aiResult.reasoning,
    entry: aiResult.entry,
    stop: aiResult.stop,
    target: aiResult.target,
    optionsPlay: aiResult.optionsPlay,
    riskReward: aiResult.riskReward,
    probabilityOfProfit: aiResult.probabilityOfProfit,
    price: lastBar.close,
    timestamp: new Date(),
    source: 'AI',
  });
} 