import React from 'react';
import { Box } from '@mui/material';
import { MarketAnalysisPanel } from './MarketAnalysisPanel';
import { TradingStrategyCard } from './TradingStrategyCard';
import { Candlestick } from '@/types/candlestick';

interface AnalysisDashboardProps {
  symbol: string;
  marketData: Candlestick[];
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  symbol,
  marketData,
}) => {
  return (
    <Box
      sx={{
        height: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        p: 1,
        pb: 3,
        gap: 1
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1,
          height: '100%',
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            flex: 1,
            width: { xs: '100%', md: '50%' },
            minWidth: 0,
            minHeight: 0,
            height: { xs: 'auto', md: '100%' },
            mb: { xs: 2, md: 0 },
            maxHeight: { xs: '60vh', md: 'none' },
            overflowY: { xs: 'auto', md: 'visible' },
          }}
        >
          <MarketAnalysisPanel symbol={symbol} marketData={marketData} />
        </Box>

        <Box
          sx={{
            flex: 1,
            width: { xs: '100%', md: '50%' },
            minWidth: 0,
            minHeight: 0,
            height: { xs: 'auto', md: '100%' },
            mb: { xs: 2, md: 0 },
            maxHeight: { xs: '60vh', md: 'none' },
            overflowY: { xs: 'auto', md: 'visible' },
          }}
        >
          <TradingStrategyCard symbol={symbol} />
        </Box>
      </Box>
    </Box>
  );
}; 