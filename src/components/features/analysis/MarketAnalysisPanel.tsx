import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, CircularProgress, Box } from '@mui/material';
import { AIAnalysisResponse } from '../../../app/api/services/ai/aiService';
import { ReactMarkdownRenderer } from '@/components/ui/markdown/ReactMarkdownRenderer';
import { useMarketDataStore } from '@/store/market-data';
import { useNewsStore } from '@/store/news-store';


export const MarketAnalysisPanel: React.FC = () => {
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const symbol = useMarketDataStore(state => state.currentSymbol);
  const marketData = useMarketDataStore(state => state.barData[symbol || ''] || []);
  const marketDataPayload = marketData.slice(-10) || [];
  const quoteData = useMarketDataStore(state => state.quotes[symbol || '']);
  
  // Get news analysis for the current symbol
  const newsData = useNewsStore(state => state.newsData.find(n => n.symbol === symbol));
  const newsAnalysis = newsData?.analysis || [];

  // Combine into a single payload
  const analysisPayload = {
    symbol,
    quoteData,
    bars: marketDataPayload,
    newsAnalysis,
  };

  const requestAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/market-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisPayload),
      });

      if (!response.ok) {
        throw new Error('Failed to get market analysis');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatAnalysisContent = () => {
    if (!analysis) return '';

    const content = [
      `### Market Analysis Results`,
      `**Sentiment:** ${analysis.sentiment}${analysis.confidence ? ` (${(analysis.confidence * 100).toFixed(1)}% confidence)` : ''}`,
      '',
      analysis.analysis,
    ];

    if (analysis.suggestedActions && analysis.suggestedActions.length > 0) {
      content.push(
        '',
        '**Suggested Actions:**',
        '',
        analysis.suggestedActions.map(action => `* ${action}`).join('\n')
      );
    }

    if (analysis.reasoning) {
      content.push(
        '',
        '**Analysis Reasoning:**',
        '',
        analysis.reasoning
      );
    }

    return content.join('\n');
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <CardContent 
        sx={{ 
          flex: 'none',
          pb: 1,
          pt: 2,
          px: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Market Analysis: {symbol}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Last Price: ${marketData[marketData.length - 1].close.toFixed(2)}
              <br />
              Volume: {marketData[marketData.length - 1].volume || 0}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={requestAnalysis}
            disabled={loading}
            sx={{ my: 1, minWidth: 160 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Analyze Market'}
          </Button>
        </Box>
        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </CardContent>

      <Box 
        sx={{ 
          flex: 1,
          minHeight: 0, // Crucial for nested flex scrolling
          overflow: 'auto',
          px: 3.25,
          py: 2,
          bgcolor: 'background.default'
        }}
      >
        {analysis && (
          <ReactMarkdownRenderer
            content={formatAnalysisContent()}
            role="assistant"
          />
        )}
      </Box>
    </Card>
  );
}; 