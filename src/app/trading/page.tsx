'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material';
import { useMarketDataStore } from "@/store/market-data";
import { logger } from '@/utils/logger';
import { ToolExecutor } from '@/services/tool-executor';
import { AgentHandler } from '@/services/agent-handler';
import { v4 as uuidv4 } from 'uuid';
import { registerAllTools } from '@/tools';
import type { TradeExecution, TradeSignal } from '@/types/agent';
import type { Candlestick } from '@/types/candlestick';
import type { TechnicalIndicators, TrendAnalysis, VolumeAnalysis } from '@/services/technical-analysis';
import { formatToEST, formatToESTTime } from '@/utils/date';
import { ChartAnalysisRequest } from "@/types/chart-analysis";
import { ENDPOINTS } from '@/constants/http';
import { httpService } from '@/services/http-client';

interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: string;
}

interface NewsAnalysis {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  articles: Array<{
    title: string;
    source: string;
    url: string;
    sentiment: number;
    timestamp: string;
  }>;
  summary: string;
  keyTopics?: string[];
  marketImpact?: {
    direction: 'up' | 'down' | 'stable';
    magnitude: number;
    timeframe: 'immediate' | 'short-term' | 'long-term';
  };
}

interface TechnicalAnalysisResult {
  bars: Candlestick[];
  technicalAnalysis: {
    indicators: TechnicalIndicators;
    trend: TrendAnalysis;
    volume: VolumeAnalysis;
  };
}

export default function TradingPage() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [newsAnalysis, setNewsAnalysis] = useState<NewsAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { currentSymbol } = useMarketDataStore();
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const [logPanelHeight, setLogPanelHeight] = useState(200); // minimum height
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const agentHandler = useRef<AgentHandler>(AgentHandler.getInstance());

  useEffect(() => {
    // Initialize tools when component mounts
    registerAllTools();

    // Setup agent handler listeners
    const handler = agentHandler.current;
    
    handler.on('tradeExecuted', (execution: TradeExecution) => {
      const { symbol, action, price, quantity, reasoning } = execution;
      const formattedPrice = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const formattedQuantity = quantity.toLocaleString();
      const message = `Trade Executed: ${action} ${formattedQuantity} ${symbol} @ $${formattedPrice}`;
      if (reasoning) {
        addLog(`${message}\nReason: ${reasoning}`);
      } else {
        addLog(message);
      }
    });

    handler.on('error', (error: Error) => {
      addLog(`Trading Error: ${error.message}`);
    });

    handler.on('started', ({ symbols }) => {
      addLog(`Trading started for symbols: ${symbols.join(', ')}`);
    });

    handler.on('stopped', () => {
      addLog('Trading stopped');
    });

    return () => {
      // Cleanup listeners
      handler.removeAllListeners();
    };
  }, []);

  const addLog = (message: string) => {
    const timestamp = formatToESTTime(new Date());
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    // Scroll to bottom of logs
    setTimeout(() => {
      if (logsRef.current) {
        logsRef.current.scrollTop = logsRef.current.scrollHeight;
      }
    }, 0);
  };

  const handleGetMarketData = async () => {
    try {
      const toolExecutor = ToolExecutor.getInstance();
      const result = await toolExecutor.execute('MARKET_DATA', {
        symbol: currentSymbol,
        timeframe: '5m',
        limit: 1  // We only need the latest bar
      }, {
        actionId: uuidv4(),
        timestamp: new Date().toISOString()
      });
      
      if (result.success && result.data) {
        const { bars } = result.data as { bars: Array<{ close: number; volume: number; date: string }> };
        if (bars && bars.length > 0) {
          const latestBar = bars[bars.length - 1];
          return {
            symbol: currentSymbol,
            price: latestBar.close,
            volume: latestBar.volume,
            timestamp: latestBar.date
          };
        } else {
          throw new Error('No market data available');
        }
      } else {
        throw new Error(result.error || 'Failed to fetch market data');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch market data';
      console.error('Error fetching market data:', errorMessage);
      logger.error({
        message: 'Error fetching market data',
        error: new Error(errorMessage)
      });
      throw error;
    }
  };

  const handleGetNewsAnalysis = async () => {
    try {
      const toolExecutor = ToolExecutor.getInstance();
      const result = await toolExecutor.execute('NEWS_ANALYSIS', {
        symbol: currentSymbol,
        timeframe: '1d',
        limit: 10
      }, {
        actionId: uuidv4(),
        timestamp: new Date().toISOString()
      });
      
      if (result.success && result.data) {
        const newsData = result.data as NewsAnalysis;
        return {
          sentiment: newsData.sentiment,
          confidence: newsData.confidence,
          articles: newsData.articles,
          summary: newsData.summary,
          keyTopics: newsData.keyTopics,
          marketImpact: newsData.marketImpact
        };
      } else {
        throw new Error(result.error || 'Failed to analyze news');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze news';
      console.error('Error analyzing news:', errorMessage);
      logger.error({
        message: 'Error analyzing news',
        error: new Error(errorMessage)
      });
      throw error;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get market data and news analysis in parallel
      const [newMarketData, newNewsAnalysis] = await Promise.all([
        handleGetMarketData(),
        handleGetNewsAnalysis()
      ]);

      // Update state with new data
      setMarketData(newMarketData);
      setNewsAnalysis(newNewsAnalysis);

      // Log updates
      addLog(`Market Data Update: ${currentSymbol} price $${newMarketData.price}`);
      addLog(`News Analysis Update: ${newNewsAnalysis.sentiment} (Confidence: ${(newNewsAnalysis.confidence * 100).toFixed(1)}%)`);
      if (newNewsAnalysis.marketImpact) {
        addLog(`Market Impact: ${newNewsAnalysis.marketImpact.direction.toUpperCase()} (${newNewsAnalysis.marketImpact.magnitude}%) - ${newNewsAnalysis.marketImpact.timeframe}`);
      }

      // Get technical analysis
      const toolExecutor = ToolExecutor.getInstance();
      const technicalResult = await toolExecutor.execute('TECHNICAL_ANALYSIS', {
        symbol: currentSymbol,
        timeframe: '5m',
        limit: 30 // Last 30 bars for analysis
      }, {
        actionId: uuidv4(),
        timestamp: new Date().toISOString()
      });

      if (!technicalResult.success || !technicalResult.data) {
        throw new Error('Failed to get technical analysis');
      }

      const technicalData = technicalResult.data as TechnicalAnalysisResult;

      // Generate AI trade signal with all available data
      const aiResult = await httpService.post<TradeSignal>(ENDPOINTS.AI.CHART_ANALYSIS, {
        symbol: currentSymbol,
        timeframe: '5m',
        tradeType: 'Intraday',
        bars: technicalData.bars,
        technicalAnalysis: technicalData.technicalAnalysis,
        newsAnalysis: newNewsAnalysis,
        marketData: newMarketData
      } as ChartAnalysisRequest);

      // Process the AI-generated trade signal
      await agentHandler.current.processTradeSignal(aiResult);
      
      addLog(`AI Analysis Generated Trade Signal:
Symbol: ${aiResult.symbol}
Action: ${aiResult.action}
Price: $${aiResult.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
Confidence: ${(aiResult.confidence * 100).toFixed(1)}%
Reasoning: ${aiResult.analysis?.reasoning || 'No reasoning provided'}
${aiResult.analysis?.optionsPlay ? `Options Play: ${aiResult.analysis.optionsPlay}` : ''}`);

      // Update positions
      const positions = agentHandler.current.getPositions();
      if (positions.length > 0) {
        addLog('Current Positions:');
        positions.forEach(pos => {
          const { symbol, quantity, averagePrice, unrealizedPnL } = pos;
          const formattedPrice = averagePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const formattedPnL = unrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          addLog(`${symbol}: ${quantity} shares @ $${formattedPrice} (P&L: $${formattedPnL})`);
        });
      }
    } catch (error) {
      const errorMsg = `Trading Panel Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error({
        message: errorMsg,
        error: new Error(error instanceof Error ? error.message : 'Unknown error')
      });
      addLog(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const startFetching = () => {
    if (!isRunning) {
      agentHandler.current.start([currentSymbol]);
      fetchData();
      intervalRef.current = setInterval(fetchData, 60000 * 5);
      setIsRunning(true);
    }
  };

  const stopFetching = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    agentHandler.current.stop();
    setIsRunning(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = logPanelHeight;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = startY.current - e.clientY;
    const newHeight = Math.max(200, startHeight.current + delta); // minimum 200px
    setLogPanelHeight(newHeight);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopFetching();
    };
  }, []);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <Box p={2} display="flex" flexDirection="column" height="100%">
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Trading Panel</Typography>
        <Box>
          <Button onClick={startFetching} disabled={isRunning} variant="contained" color="primary" size="small">Start</Button>
          <Button onClick={stopFetching} disabled={!isRunning} variant="outlined" color="secondary" size="small" style={{ marginLeft: 8 }}>Stop</Button>
        </Box>
      </Box>

      <Box flex={1} display="flex" flexDirection="column" minHeight={0}>
        {/* Data Display Section */}
        <Box flex={1} overflow="auto" mb={2}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {marketData && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Market Data</Typography>
                  <Typography>Price: ${marketData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                  <Typography>Volume: {marketData.volume.toLocaleString()}</Typography>
                  <Typography>Last Updated: {formatToEST(marketData.timestamp)}</Typography>
                </Paper>
              )}
              {newsAnalysis && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>News Analysis</Typography>
                  <Typography>Sentiment: <strong>{newsAnalysis.sentiment}</strong></Typography>
                  <Typography>Confidence: <strong>{(newsAnalysis.confidence * 100).toFixed(1)}%</strong></Typography>
                  {newsAnalysis.marketImpact && (
                    <Typography>
                      Impact: <strong>{newsAnalysis.marketImpact.direction.toUpperCase()}</strong> ({newsAnalysis.marketImpact.magnitude}%) - {newsAnalysis.marketImpact.timeframe}
                    </Typography>
                  )}
                  {newsAnalysis.keyTopics && newsAnalysis.keyTopics.length > 0 && (
                    <Typography>Key Topics: {newsAnalysis.keyTopics.join(', ')}</Typography>
                  )}
                  {newsAnalysis.articles && newsAnalysis.articles.length > 0 && (
                    <>
                      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Latest News</Typography>
                      <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                        {newsAnalysis.articles.map((article, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{article.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {article.source} - {formatToEST(article.timestamp)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}
                </Paper>
              )}
            </Box>
          )}
        </Box>

        {/* Draggable Activity Log */}
        <Paper 
          sx={{ 
            height: logPanelHeight,
            minHeight: 200,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            transition: 'none'
          }}
        >
          {/* Drag Handle */}
          <Box
            sx={{
              height: '10px',
              width: '100%',
              cursor: 'row-resize',
              position: 'absolute',
              top: 0,
              left: 0,
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)'
              },
              zIndex: 1
            }}
            onMouseDown={handleMouseDown}
          />
          
          {/* Log Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2">Activity Log</Typography>
            <Button 
              onClick={() => setLogs([])} 
              size="small" 
              variant="text" 
              color="inherit"
              sx={{ minWidth: 'auto', p: 0.5 }}
            >
              Clear
            </Button>
          </Box>

          {/* Log Content */}
          <Box 
            ref={logsRef}
            sx={{ 
              flex: 1,
              overflow: 'auto',
              p: 2,
              pt: 1,
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap'
            }}
          >
            {logs.map((log, index) => (
              <Box key={index} sx={{ py: 0.5 }}>{log}</Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}; 