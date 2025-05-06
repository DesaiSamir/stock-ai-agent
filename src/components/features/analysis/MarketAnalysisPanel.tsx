import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, CircularProgress, Box } from '@mui/material';
import { AIAnalysisResponse } from '../../../app/api/services/ai/aiService';
import { Candlestick } from '@/types/candlestick';
import { ReactMarkdownRenderer } from '@/components/ui/markdown/ReactMarkdownRenderer';

interface MarketAnalysisPanelProps {
  symbol: string;
  marketData: Candlestick[];
}

export const MarketAnalysisPanel: React.FC<MarketAnalysisPanelProps> = ({ symbol, marketData }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/market-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Analyze the current market conditions for ${symbol} based on the provided data.`,
            },
          ],
          marketData,
        }),
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
        <Typography variant="h5" gutterBottom>
          Market Analysis: {symbol}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Last Price: ${marketData[marketData.length - 1].close.toFixed(2)}
          <br />
          Volume: {marketData[marketData.length - 1].volume || 0}
        </Typography>

        <Button
          variant="contained"
          onClick={requestAnalysis}
          disabled={loading}
          sx={{ my: 1 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Analyze Market'}
        </Button>

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