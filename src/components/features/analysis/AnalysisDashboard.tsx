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
      maxWidth="xl" 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        py: 2
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2,
        height: '100%',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          width: { xs: '100%', lg: '50%' },
          height: '100%',
          minHeight: 0 // This is crucial for flex child to respect parent height
        }}>
          <MarketAnalysisPanel symbol={symbol} marketData={marketData} />
        </Box>

        <Box sx={{ 
          width: { xs: '100%', md: '47%', lg: '23%' },
          height: { xs: 'auto', lg: '100%' }
        }}>
          <TradingStrategyCard symbol={symbol} />
        </Box>

        <Box sx={{ 
          width: { xs: '100%', md: '47%', lg: '23%' },
          height: { xs: 'auto', lg: '100%' }
        }}>
          <SentimentAnalyzer symbol={symbol} />
        </Box>
      </Box>
    </Container>
  );
}; 