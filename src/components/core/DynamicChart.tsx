'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import type { StockData } from '../../types/stock';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  TimeScale,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { CandlestickController, CandlestickElement, OhlcElement } from 'chartjs-chart-financial';
import zoomPlugin from 'chartjs-plugin-zoom';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  CandlestickController,
  CandlestickElement,
  OhlcElement,
  zoomPlugin
);

interface DynamicChartProps {
  data: StockData[];
  viewRange: { min: number; max: number };
  setViewRange: (range: { min: number; max: number }) => void;
  earliestTimestamp: number;
  latestTimestamp: number;
}

export const DynamicChart: React.FC<DynamicChartProps> = ({
  data,
  viewRange,
  setViewRange,
  earliestTimestamp,
  latestTimestamp,
}) => {
  const chartRef = useRef<ChartJS>(null);

  const handlePanZoom = useCallback(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    const timeScale = chart.scales.x;

    // Get the new range
    const newMin = Math.max(timeScale.min, earliestTimestamp);
    const newMax = Math.min(timeScale.max, latestTimestamp);

    // Only update if the range has actually changed
    if (newMin !== viewRange.min || newMax !== viewRange.max) {
      setViewRange({ min: newMin, max: newMax });
    }
  }, [earliestTimestamp, latestTimestamp, setViewRange, viewRange]);

  const chartData = {
    datasets: [
      {
        label: 'OHLC',
        type: 'candlestick' as const,
        data: data.map(d => ({
          x: new Date(d.timestamp).getTime(),
          o: d.open,
          h: d.high,
          l: d.low,
          c: d.close
        })),
        borderColor: '#000',
        color: {
          up: '#00ff00',
          down: '#ff0000',
        },
      },
      {
        label: 'Volume',
        type: 'bar' as const,
        data: data.map(d => ({
          x: new Date(d.timestamp).getTime(),
          o: 0,
          h: d.volume,
          l: 0,
          c: d.volume
        })),
        yAxisID: 'volume',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'minute' as const,
        },
        adapters: {
          date: {
            locale: undefined
          }
        },
        min: viewRange.min,
        max: viewRange.max,
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      volume: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      zoom: {
        pan: {
          enabled: true,
          mode: 'x' as const,
          modifierKey: undefined,
          onPan: handlePanZoom,
        },
        zoom: {
          wheel: {
            enabled: true,
            modifierKey: 'ctrl' as const,
          },
          pinch: {
            enabled: true
          },
          mode: 'x' as const,
          onZoomComplete: handlePanZoom,
        },
        limits: {
          x: {
            min: earliestTimestamp,
            max: latestTimestamp,
            minRange: 60000,
          }
        }
      }
    },
    interaction: {
      mode: 'x' as const,
      intersect: false,
    },
    elements: {
      point: {
        radius: 0,
      }
    }
  };

  // Update chart when viewRange changes externally
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    
    if (chart.scales.x.min !== viewRange.min || chart.scales.x.max !== viewRange.max) {
      chart.update('none');
    }
  }, [viewRange]);

  return <Chart ref={chartRef} type="candlestick" data={chartData} options={options} />;
}; 