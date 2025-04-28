'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { StockData, TimeInterval } from '../../types/stock';
import { TimeIntervalSelector } from '../core/TimeIntervalSelector';
import { StockStats } from '../core/StockStats';
import Chart from '../core/Chart';
import { Box } from '@mui/material';
import { useStockData } from '../../hooks/useStockData';

interface StockChartProps {
  symbol: string;
  initialData?: StockData[];
}

export const StockChart: React.FC<StockChartProps> = ({ 
  symbol
}) => {
  const [interval, setInterval] = useState<TimeInterval>('1m');
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const data = useStockData({
    symbol,
    interval,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleIntervalChange = (newInterval: TimeInterval) => {
    setInterval(newInterval);
  };

  const latestStock = data[0];

  return (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
      }}
    >
      <StockStats stock={latestStock} />
      
      <Box 
        ref={containerRef}
        sx={{ 
          flexGrow: 1, 
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: '400px'
        }}
      >
        <Chart 
          data={[...data].reverse()}
          width={dimensions.width}
          height={dimensions.height}
          ratio={1}
        />
      </Box>

      <TimeIntervalSelector value={interval} onChange={handleIntervalChange} />
    </Box>
  );
}; 