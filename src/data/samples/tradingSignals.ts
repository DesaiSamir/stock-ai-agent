import type { TradingSignal } from '../../types/stock';

export const sampleTradingSignals: TradingSignal[] = [
  {
    id: '1',
    symbol: 'AAPL',
    type: 'BUY',
    price: 180.5,
    confidence: 85,
    reason: 'Strong upward momentum detected',
    timestamp: new Date(),
  },
  {
    id: '2',
    symbol: 'AAPL',
    type: 'SELL',
    price: 182.3,
    confidence: 75,
    reason: 'Overbought conditions',
    timestamp: new Date(),
  },
]; 