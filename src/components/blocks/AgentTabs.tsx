"use client";

import React from "react";
import { Box, Typography, Card, CardHeader, CardContent } from "@mui/material";
import { useAgentMonitoringStore } from "@/store/agent-monitoring";

export const AgentTabs: React.FC = () => {
  const { latestPrices, latestSignals, recentTrades } = useAgentMonitoringStore();

  return (
    <Box sx={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 1,
      p: 1,
      height: "100%",
      overflow: "hidden"
    }}>
      {/* News Agent Card */}
      <Card sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <CardHeader 
          title="News Agent" 
          sx={{
            bgcolor: 'primary.main', 
            color: 'primary.contrastText',
            p: 1,
            '& .MuiCardHeader-title': {
              fontSize: '1rem',
              fontWeight: 'bold'
            }
          }} 
        />
        <CardContent sx={{ 
          flex: 1, 
          overflow: 'auto',
          p: 1,
          '&:last-child': { pb: 1 }
        }}>
          {latestSignals.filter(signal => signal.source === 'NEWS').map((signal, index) => (
            <Box key={index} sx={{ 
              mb: 1, 
              p: 1, 
              bgcolor: 'background.default',
              borderRadius: 1
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {signal.symbol} - {signal.action} @ ${signal.price.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Confidence: {(signal.confidence * 100).toFixed(1)}%
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Trading Agent Card */}
      <Card sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <CardHeader 
          title="Trading Agent" 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'primary.contrastText',
            p: 1,
            '& .MuiCardHeader-title': {
              fontSize: '1rem',
              fontWeight: 'bold'
            }
          }} 
        />
        <CardContent sx={{ 
          flex: 1, 
          overflow: 'auto',
          p: 1,
          '&:last-child': { pb: 1 }
        }}>
          {recentTrades.map((trade, index) => (
            <Box key={index} sx={{ 
              mb: 1, 
              p: 1, 
              bgcolor: 'background.default',
              borderRadius: 1
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {trade.symbol} - {trade.action} {trade.quantity} shares @ ${trade.price.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {new Date(trade.timestamp).toLocaleString()}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Analysis Agent Card */}
      <Card sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <CardHeader 
          title="Analysis Agent" 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'primary.contrastText',
            p: 1,
            '& .MuiCardHeader-title': {
              fontSize: '1rem',
              fontWeight: 'bold'
            }
          }} 
        />
        <CardContent sx={{ 
          flex: 1, 
          overflow: 'auto',
          p: 1,
          '&:last-child': { pb: 1 }
        }}>
          {latestSignals.filter(signal => signal.source === 'ANALYSIS').map((signal, index) => (
            <Box key={index} sx={{ 
              mb: 1, 
              p: 1, 
              bgcolor: 'background.default',
              borderRadius: 1
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {signal.symbol} - {signal.action} @ ${signal.price.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Confidence: {(signal.confidence * 100).toFixed(1)}%
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Ticker Agent Card */}
      <Card sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <CardHeader 
          title="Ticker Agent" 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'primary.contrastText',
            p: 1,
            '& .MuiCardHeader-title': {
              fontSize: '1rem',
              fontWeight: 'bold'
            }
          }} 
        />
        <CardContent sx={{ 
          flex: 1, 
          overflow: 'auto',
          p: 1,
          '&:last-child': { pb: 1 }
        }}>
          {Object.entries(latestPrices).map(([symbol, data]) => (
            <Box key={symbol} sx={{ 
              mb: 1, 
              p: 1, 
              bgcolor: 'background.default',
              borderRadius: 1
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {symbol}: ${data.close.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Volume: {data.volume.toLocaleString()} | {new Date(data.timestamp).toLocaleTimeString()}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                O: ${data.open.toFixed(2)} H: ${data.high.toFixed(2)} L: ${data.low.toFixed(2)}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};
