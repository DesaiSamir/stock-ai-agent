import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  TextField,
  Box,
  LinearProgress,
} from '@mui/material';

interface SentimentAnalyzerProps {
  symbol: string;
}

interface SentimentResponse {
  overall: 'bullish' | 'bearish' | 'neutral';
  score: number;
  analysis: string;
}

export const SentimentAnalyzer: React.FC<SentimentAnalyzerProps> = ({ symbol }) => {
  const [texts, setTexts] = useState<string[]>([]);
  const [newText, setNewText] = useState('');
  const [sentiment, setSentiment] = useState<SentimentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddText = () => {
    if (newText.trim()) {
      setTexts([...texts, newText.trim()]);
      setNewText('');
    }
  };

  const handleRemoveText = (index: number) => {
    setTexts(texts.filter((_, i) => i !== index));
  };

  const analyzeSentiment = async () => {
    if (texts.length === 0) {
      setError('Please add at least one text to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ texts }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze sentiment');
      }

      const data = await response.json();
      setSentiment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: 'bullish' | 'bearish' | 'neutral') => {
    switch (sentiment) {
      case 'bullish':
        return 'success.main';
      case 'bearish':
        return 'error.main';
      default:
        return 'text.primary';
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Market Sentiment Analysis: {symbol}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Add market-related text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            multiline
            rows={2}
            variant="outlined"
          />
          <Button
            variant="outlined"
            onClick={handleAddText}
            sx={{ mt: 1 }}
            disabled={!newText.trim()}
          >
            Add Text
          </Button>
        </Box>

        {texts.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Texts to Analyze:
            </Typography>
            {texts.map((text, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  mt: 1,
                  p: 1,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {text}
                </Typography>
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleRemoveText(index)}
                >
                  Remove
                </Button>
              </Box>
            ))}
          </Box>
        )}

        <Button
          variant="contained"
          onClick={analyzeSentiment}
          disabled={loading || texts.length === 0}
          sx={{ mt: 2 }}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Analyze Sentiment'}
        </Button>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        {sentiment && (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="h6"
              color={getSentimentColor(sentiment.overall)}
              gutterBottom
            >
              Overall Sentiment: {sentiment.overall}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Sentiment Score:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Box sx={{ flex: 1, mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={sentiment.score * 100}
                    color={
                      sentiment.overall === 'bullish'
                        ? 'success'
                        : sentiment.overall === 'bearish'
                        ? 'error'
                        : 'primary'
                    }
                  />
                </Box>
                <Typography variant="body2">
                  {(sentiment.score * 100).toFixed(1)}%
                </Typography>
              </Box>
            </Box>

            <Typography variant="h6" sx={{ mt: 2 }}>
              Detailed Analysis:
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
              {sentiment.analysis}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}; 