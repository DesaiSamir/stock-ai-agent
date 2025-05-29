import React from 'react';
import { Container, Box } from '@mui/material';
import { MarketAnalysisPanel } from './MarketAnalysisPanel';
import { TradingStrategyCard } from './TradingStrategyCard';
import { SentimentAnalyzer } from './SentimentAnalyzer';
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
      maxWidth={false}
      
      sx={{
        width: '100%',
        height: '100%',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        py: 2,
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          height: '100%',
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            flex: { md: '2 1 0%' },
            width: { xs: '100%', md: 'auto' },
            minWidth: 0,
            minHeight: 0,
            height: { xs: 'auto', md: '100%' },
            mb: { xs: 2, md: 0 },
            // On mobile, limit max height and allow scroll for this card
            maxHeight: { xs: '60vh', md: 'none' },
            overflowY: { xs: 'auto', md: 'visible' },
          }}
        >
          <MarketAnalysisPanel symbol={symbol} marketData={marketData} />
        </Box>

        <Box
          sx={{
            flex: { md: '1 1 0%' },
            width: { xs: '100%', md: 'auto' },
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

        <Box
          sx={{
            flex: { md: '1 1 0%' },
            width: { xs: '100%', md: 'auto' },
            minWidth: 0,
            minHeight: 0,
            height: { xs: 'auto', md: '100%' },
            mb: { xs: 2, md: 0 },
          }}
        >
          <SentimentAnalyzer symbol={symbol} />
        </Box>
      </Box>
    </Container>
  );
}; 