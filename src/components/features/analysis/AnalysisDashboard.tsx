import React from 'react';
import { Container, Box } from '@mui/material';
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
    <Container
      maxWidth="lg"
      sx={{
        width: '100%',
        height: '100%',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        py: 1,
        minHeight: 0,
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
    </Container>
  );
}; 