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
import 'chartjs-adapter-luxon';
import {
  CandlestickController,
  CandlestickElement,
} from "chartjs-chart-financial";
import { StockData } from "@/types/stock";
import "chartjs-adapter-date-fns";
// import zoomPlugin from "chartjs-plugin-zoom";
import CrosshairPlugin from "chartjs-plugin-crosshair";
import StreamingPlugin from "chartjs-plugin-streaming";

// Register Chart.js components
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
  CandlestickElement,
  // zoomPlugin,
  CrosshairPlugin,
  StreamingPlugin
);

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

export const DynamicChart: React.FC<DynamicChartProps> = ({
  data,
  width = 800,
  height = 400,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Sort data by date and filter out invalid entries
    const sortedData = [...data]
      .filter(
        (
          item
        ): item is StockData & {
          open: number;
          high: number;
          low: number;
          close: number;
          date: string;
        } =>
          item.date != null &&
          typeof item.open === "number" &&
          typeof item.high === "number" &&
          typeof item.low === "number" &&
          typeof item.close === "number"
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
        animation: {
          duration: 0,
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "realtime",
            realtime: {
              duration: 120000,
              refresh: 1000,
              delay: 0,
              onRefresh: (chart: ChartJS) => {
                // This will be called on each refresh
                const dataset = chart.data.datasets[0];
                if (!dataset.data.length) return;

                const lastData = dataset.data[
                  dataset.data.length - 1
                ] as CandleData;
                if (!lastData) return;

                // Update the last candle with new data if available
                if (candleData.length > 0) {
                  const latestData = candleData[candleData.length - 1];
                  if (
                    latestData &&
                    typeof latestData.o === "number" &&
                    typeof latestData.h === "number" &&
                    typeof latestData.l === "number" &&
                    typeof latestData.c === "number" &&
                    latestData.x !== lastData.x
                  ) {
                    dataset.data.push(latestData);
                  } else if (latestData) {
                    Object.assign(lastData, latestData);
                  }
                }
              },
            },
            ticks: {
              source: "auto",
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
        interaction: {
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label(tooltipItem: TooltipItem<"candlestick">) {
                const point = tooltipItem.raw as CandleData;
                return [
                  `Open: ${point.o.toFixed(2)}`,
                  `High: ${point.h.toFixed(2)}`,
                  `Low: ${point.l.toFixed(2)}`,
                  `Close: ${point.c.toFixed(2)}`,
                ];
              },
            },
          },
          zoom: {
            pan: {
              enabled: true,
              mode: "x",
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },
              mode: "x",
            },
            limits: {
              x: { min: "original", max: "original" },
            },
          },
          crosshair: {
            line: {
              color: "#808080",
              width: 1,
            },
            sync: {
              enabled: false,
            },
            zoom: {
              enabled: true,
              zoomboxBackgroundColor: "rgba(66,133,244,0.2)",
              zoomboxBorderColor: "#48F",
              zoomButtonText: "Reset Zoom",
              zoomButtonClass: "reset-zoom",
            },
          },
        },
      },
    } as ChartConfiguration<"candlestick">;

    chartRef.current = new ChartJS(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};
