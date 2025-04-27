import React from 'react';
import { TradingSignal } from '../../types/stock';
import { Card } from '../core/Card';
import { Alert } from '../core/Alert';

interface TradingSignalsProps {
  signals: TradingSignal[];
}

export const TradingSignals: React.FC<TradingSignalsProps> = ({ signals }) => {
  const getSignalSeverity = (type: TradingSignal['type']) => {
    switch (type) {
      case 'BUY':
        return 'success';
      case 'SELL':
        return 'error';
      case 'HOLD':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <Card title="Trading Signals">
      <div className="space-y-4">
        {signals.map((signal) => (
          <Alert
            key={`${signal.symbol}-${signal.timestamp.getTime()}`}
            severity={getSignalSeverity(signal.type)}
            title={`${signal.symbol} - ${signal.type}`}
          >
            <div className="text-sm">
              <p>Price: ${signal.price.toFixed(2)}</p>
              <p>Confidence: {(signal.confidence * 100).toFixed(1)}%</p>
              <p>Reason: {signal.reason}</p>
              <div className="mt-2 text-xs text-gray-500">
                {signal.timestamp.toLocaleString()}
              </div>
            </div>
          </Alert>
        ))}
      </div>
    </Card>
  );
}; 