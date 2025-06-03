import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material';
import { orchestratorAgent } from '@/agents';
import { useMarketDataStore } from "@/store/market-data";
import { useChatStore } from '@/store/chat';
import type { AgentContext, AgentTask } from '@/agents/types';
import { logger } from '@/utils/logger';
import { ActionTypes } from '@/types/actions';

interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: string;
}

interface NewsAnalysis {
  sentiment: number;
  confidence: number;
  relevantNews: string[];
}

interface TradingSignal {
  symbol: string;
  direction: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  reasons: string[];
}

interface TradeOrder {
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
}

export const TradingPanel: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [tradingSignal, setTradingSignal] = useState<TradingSignal | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { currentSymbol } = useMarketDataStore();
  const { currentMessage } = useChatStore();
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const [logPanelHeight, setLogPanelHeight] = useState(200); // minimum height
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  // Create agent context from current chat message
  const createAgentContext = (): AgentContext => ({
    conversationId: currentMessage?.conversationId || '',
    messageId: currentMessage?.id || '',
    metadata: {
      symbol: currentSymbol,
      timestamp: new Date().toISOString()
    }
  });

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    // Scroll to bottom of logs
    setTimeout(() => {
      if (logsRef.current) {
        logsRef.current.scrollTop = logsRef.current.scrollHeight;
      }
    }, 0);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const context = createAgentContext();
      const tasks: AgentTask[] = [
        {
          type: 'action',
          name: ActionTypes.GET_MARKET_DATA,
          payload: { symbol: currentSymbol },
          priority: 1
        },
        {
          type: 'action',
          name: ActionTypes.ANALYZE_NEWS,
          payload: { symbol: currentSymbol },
          priority: 1
        },
        {
          type: 'action',
          name: ActionTypes.ANALYZE_MARKET,
          payload: { symbol: currentSymbol },
          priority: 1
        },
        {
          type: 'action',
          name: ActionTypes.VIEW_PORTFOLIO,
          payload: { symbol: currentSymbol },
          priority: 1
        }
      ];

      const results = await Promise.all(tasks.map(task => orchestratorAgent.execute(task, context)));
      const [marketResult, newsResult, signalResult, tradesResult] = results;

      if (marketResult.success) {
        setMarketData(marketResult.data as MarketData);
        addLog(`Market Data Update: ${currentSymbol} price $${(marketResult.data as MarketData).price}`);
      }

      if (newsResult.success) {
        const news = newsResult.data as NewsAnalysis;
        addLog(`News Analysis Update: Sentiment ${news.sentiment?.toFixed(2)}, Confidence ${news.confidence?.toFixed(2)}`);
      }

      if (signalResult.success) {
        setTradingSignal(signalResult.data as TradingSignal);
        const signal = signalResult.data as TradingSignal;
        addLog(`Trading Signal Update: ${signal.direction} (${signal.confidence?.toFixed(2)}% confidence)`);
      }

      if (tradesResult.success) {
        const trades = tradesResult.data as TradeOrder[];
        if (trades.length > 0) {
          addLog(`Portfolio Update: ${trades.length} active trade(s)`);
        }
      }

      // Log errors
      results.forEach((result, index) => {
        if (!result.success) {
          const error = `Error fetching ${tasks[index].name}: ${result.error || 'Unknown error'}`;
          logger.error({
            message: error,
            error: result.error || 'Unknown error'
          });
          addLog(error);
        }
      });
    } catch (error) {
      const errorMsg = `Trading Panel Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error({
        message: errorMsg,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      addLog(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const startFetching = () => {
    if (!isRunning) {
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
                  <Typography>Price: ${marketData.price}</Typography>
                  <Typography>Volume: {marketData.volume}</Typography>
                  <Typography>Last Updated: {new Date(marketData.timestamp).toLocaleString()}</Typography>
                </Paper>
              )}
              {tradingSignal && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography>Signal: {tradingSignal.direction}</Typography>
                  <Typography>Confidence: {tradingSignal.confidence}%</Typography>
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
              fontFamily: 'monospace'
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