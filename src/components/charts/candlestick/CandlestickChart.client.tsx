"use client";

import { useState, useEffect, useRef, memo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TimeScale,
  TimeScaleTimeOptions,
} from "chart.js";
import {
  CandlestickController,
  CandlestickElement,
} from "chartjs-chart-financial";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { useStockData } from "@/hooks/useStockData";
import { useMarketDataStore } from "@/store/market-data";
import {
  CandlestickChartProps,
  CandlestickData,
  ChartComponentProps,
} from "./types";
import { TimeInterval } from "@/types/stock";
import type { DeepPartial } from "ts-essentials";

const ChartComponent = memo(({ chartRef, options }: ChartComponentProps) => {
  return (
    <Chart
      ref={chartRef}
      type="candlestick"
      data={{
        datasets: [
          {
            label: "OHLC",
            data: [],
          },
        ],
      }}
      options={options}
    />
  );
});

ChartComponent.displayName = "ChartComponent";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement,
  TimeScale
);

const getTimeConfig = (
  interval: TimeInterval
): DeepPartial<TimeScaleTimeOptions> => {
  switch (interval) {
    case "1m":
    case "5m":
    case "15m":
    case "30m":
      return {
        unit: "minute" as const,
        displayFormats: {
          minute: "HH:mm",
        },
      };
    case "1h":
    case "4h":
      return {
        unit: "hour" as const,
        displayFormats: {
          hour: "HH:mm",
        },
      };
    case "1d":
      return {
        unit: "day" as const,
        displayFormats: {
          day: "MMM d",
        },
      };
    case "1w":
      return {
        unit: "week" as const,
        displayFormats: {
          week: "MMM d",
        },
      };
    case "1M":
      return {
        unit: "month" as const,
        displayFormats: {
          month: "MMM yyyy",
        },
      };
  }
};

const defaultOptions: ChartOptions<"candlestick"> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      type: "time",
      time: getTimeConfig("1m"), // Default to 1m
      ticks: {
        source: "auto",
        maxRotation: 0,
        autoSkip: true,
      },
    },
    y: {
      type: "linear",
      position: "right",
      beginAtZero: false,
      ticks: {
        callback: (value) => `$${value}`,
      },
    },
  },
  interaction: {
    intersect: false,
    mode: "index",
  },
  animation: {
    duration: 0,
  },
  plugins: {
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
        x: {
          min: "original",
          max: "original",
          minRange: 1000 * 60 * 5, // 5 minutes minimum zoom
        },
      },
    },
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true,
      mode: "index",
      intersect: false,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      titleColor: "white",
      bodyColor: "white",
      borderColor: "rgba(255, 255, 255, 0.2)",
      borderWidth: 1,
      padding: 10,
      displayColors: false,
      boxWidth: 12,
      boxHeight: 12,
      callbacks: {
        title: function (context) {
          const data = context[0].raw as CandlestickData;
          const chart = context[0].chart;
          const time =
            data ===
            chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1]
              ? new Date()
              : new Date(data.x);
          return time.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          });
        },
        label: function (context) {
          const data = context.raw as CandlestickData;
          const greenSquare = "🟩";
          const redSquare = "🟥";

          return [
            `${data.c >= data.o ? greenSquare : redSquare} Open: $${data.o.toFixed(2)}`,
            `${greenSquare} High: $${data.h.toFixed(2)}`,
            `${redSquare} Low: $${data.l.toFixed(2)}`,
            `${data.c >= data.o ? greenSquare : redSquare} Close: $${data.c.toFixed(2)}`,
          ];
        },
      },
    },
  },
};

export function CandlestickChart({
  symbol,
  interval = "1m",
  height = 400,
  width = 800,
}: CandlestickChartProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isLoading, error } = useStockData({
    symbol,
    interval,
  });

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Initialize zoom plugin on client side
  useEffect(() => {
    if (isClient) {
      import("chartjs-plugin-zoom").then((zoomPlugin) => {
        ChartJS.register(zoomPlugin.default);
      });
    }
  }, [isClient]);

  // Handle data updates
  useEffect(() => {
    if (!mounted || !chartRef.current) return;

    // Get initial data
    const store = useMarketDataStore.getState();
    const initialData = store.getBarData(symbol) || [];
    if (initialData.length > 0) {
      const chart = chartRef.current;
      chart.data.datasets[0].data = initialData.map((bar) => ({
        x: new Date(bar.date).getTime(),
        o: bar.open!,
        h: bar.high!,
        l: bar.low!,
        c: bar.close!,
      }));
      chart.update("none");
    }

    const unsubscribe = useMarketDataStore.subscribe((state) => {
      const newData = state.barData[symbol] || [];
      if (newData.length > 0 && chartRef.current) {
        const chart = chartRef.current;
        const existingData = chart.data.datasets[0].data;

        // Update data without recreating array
        newData.forEach((bar, i) => {
          const point = {
            x: new Date(bar.date).getTime(),
            o: bar.open!,
            h: bar.high!,
            l: bar.low!,
            c: bar.close!,
          };
          if (i < existingData.length) {
            Object.assign(existingData[i], point);
          } else {
            existingData.push(point);
          }
        });

        // Remove extra points if new data is shorter
        if (existingData.length > newData.length) {
          existingData.length = newData.length;
        }

        chart.update("none");
      }
    });

    return unsubscribe;
  }, [symbol, mounted]);

  // Update time configuration when interval changes
  useEffect(() => {
    if (!mounted || !chartRef.current) return;

    const chart = chartRef.current;
    const timeConfig = getTimeConfig(interval);

    if (chart.options.scales?.x) {
      Object.assign(chart.options.scales.x.time, timeConfig);
      chart.update("none");
    }
  }, [interval, mounted]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ height, width }}>
      {isClient && (
        <div style={{ marginBottom: "10px" }}>
          <button
            onClick={() => chartRef.current?.resetZoom()}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4a5568",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Reset Zoom
          </button>
        </div>
      )}
      <ChartComponent chartRef={chartRef} options={defaultOptions} />
    </div>
  );
}
