"use client";

import React, { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ScriptableContext,
  ChartConfiguration,
  TooltipItem,
} from "chart.js";
import {
  CandlestickController,
  CandlestickElement,
} from "chartjs-chart-financial";
import { StockData } from "@/types/stock";
import "chartjs-adapter-date-fns";
import { enUS } from "date-fns/locale";

interface DynamicChartProps {
  data: StockData[];
  width?: number;
  height?: number;
}

interface CandleData {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

const DynamicChart: React.FC<DynamicChartProps> = ({
  data,
  width = 800,
  height = 400,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    // Register Chart.js components on client side only
    ChartJS.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      Title,
      Tooltip,
      Legend,
      TimeScale,
      CandlestickController,
      CandlestickElement
    );

    if (!canvasRef.current || !data.length) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Sort data by date and filter out invalid entries
    const sortedData = [...data]
      .filter(
        (item) =>
          item.date &&
          item.open != null &&
          item.high != null &&
          item.low != null &&
          item.close != null
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const candleData = sortedData.map((item) => ({
      x: new Date(item.date).getTime(),
      o: item.open,
      h: item.high,
      l: item.low,
      c: item.close,
    }));

    const config = {
      type: "candlestick" as const,
      data: {
        datasets: [
          {
            label: "OHLC",
            data: candleData,
            backgroundColor: (ctx: ScriptableContext<"candlestick">) => {
              const candle = ctx.raw as CandleData;
              return candle.o <= candle.c
                ? "rgba(75, 192, 192, 0.5)"
                : "rgba(255, 99, 132, 0.5)";
            },
            borderColor: (ctx: ScriptableContext<"candlestick">) => {
              const candle = ctx.raw as CandleData;
              return candle.o <= candle.c
                ? "rgb(75, 192, 192)"
                : "rgb(255, 99, 132)";
            },
            borderWidth: 2,
            borderSkipped: false,
          },
        ],
      },
      options: {
        parsing: false,
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "time",
            time: {
              unit: "minute",
            },
            adapters: {
              date: {
                locale: enUS, // Use consistent locale
              },
            },
            ticks: {
              source: "data",
              autoSkip: true,
              maxRotation: 0,
            },
          },
          y: {
            type: "linear",
            position: "right",
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            intersect: false,
            mode: "index",
            callbacks: {
              label(tooltipItem: TooltipItem<"candlestick">) {
                const point = tooltipItem.parsed as unknown as CandleData;
                return [
                  `Open: ${point.o.toFixed(2)}`,
                  `High: ${point.h.toFixed(2)}`,
                  `Low: ${point.l.toFixed(2)}`,
                  `Close: ${point.c.toFixed(2)}`,
                ];
              },
            },
          },
        },
      },
    };

    chartRef.current = new ChartJS(
      ctx,
      config as ChartConfiguration<"candlestick">
    );

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

export default DynamicChart;
