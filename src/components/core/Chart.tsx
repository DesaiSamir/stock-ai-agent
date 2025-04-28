"use client";

import PropTypes from "prop-types";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import {
  elderRay,
  ema,
  discontinuousTimeScaleProviderBuilder,
  Chart,
  ChartCanvas,
  BarSeries,
  CandlestickSeries,
  LineSeries,
  CurrentCoordinate,
  ElderRaySeries,
  MovingAverageTooltip,
  OHLCTooltip,
  SingleValueTooltip,
  HoverTooltip,
  lastVisibleItemBasedZoomAnchor,
  XAxis,
  YAxis,
  CrossHairCursor,
  EdgeIndicator,
  MouseCoordinateX,
  MouseCoordinateY,
  ZoomButtons,
} from "react-financial-charts";
import type { StockData } from "../../types/stock";

interface ChartData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema12?: number;
  ema26?: number;
  ema200?: number;
}

interface CandleData extends ChartData {
  idx: { index: number };
  patternType?: "bullish" | "bearish";
}

interface ChartProps {
  data: StockData[];
  dateTimeFormat?: string;
  height?: number;
  ratio?: number;
  width: number;
}

const StockChart: React.FC<ChartProps> = ({
  data: initialData,
  dateTimeFormat = "%d %b",
  height = 600,
  ratio = 1,
  width,
}) => {
  const margin = { left: 50, right: 50, top: 0, bottom: 24 };
  const pricesDisplayFormat = format(".2f");
  const numberDisplayFormat = format(",");

  // Convert StockData to the format expected by react-financial-charts
  const formattedData: ChartData[] = initialData.map((d) => ({
    date: d.date,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
    volume: d.volume,
  }));

  const xScaleProvider =
    discontinuousTimeScaleProviderBuilder().inputDateAccessor(
      (d: ChartData) => d.date
    );

  const ema12 = ema()
    .id(1)
    .options({ windowSize: 21 })
    .merge((d: ChartData, c: number) => {
      d.ema12 = c;
    })
    .accessor((d: ChartData) => d.ema12);

  const ema26 = ema()
    .id(2)
    .options({ windowSize: 51 })
    .merge((d: ChartData, c: number) => {
      d.ema26 = c;
    })
    .accessor((d: ChartData) => d.ema26);

  const ema200 = ema()
    .id(3)
    .options({ windowSize: 200 })
    .merge((d: ChartData, c: number) => {
      d.ema200 = c;
    })
    .accessor((d: ChartData) => d.ema200)
    .stroke("green");

  const elder = elderRay();

  const calculatedData = elder(ema200(ema26(ema12(formattedData))));
  const { data, xScale, xAccessor, displayXAccessor } =
    xScaleProvider(calculatedData);

  const max = xAccessor(data[data.length - 1]);
  const min = xAccessor(data[Math.max(0, data.length - 100)]);
  const xExtents = [min, max + 5];

  const gridHeight = height - margin.top - margin.bottom;
  const elderRayHeight = 100;
  const elderRayOrigin = (_: number, h: number) => [0, h - elderRayHeight];
  const barChartHeight = gridHeight / 4;
  const barChartOrigin = (_: number, h: number) => [
    0,
    h - barChartHeight - elderRayHeight,
  ];
  const chartHeight = gridHeight - elderRayHeight;

  const timeDisplayFormat = timeFormat(dateTimeFormat);

  const candleChartExtents = (d: ChartData) => {
    return [d.high, d.low];
  };

  // Modern shades
  const MODERN_GREEN = "#22c55e"; // Tailwind green-500
  const MODERN_RED = "#ef4444"; // Tailwind red-500

  const candelFillColor = (data: CandleData, seriesData: CandleData[] = []) => {
    const previous = seriesData[data.idx.index - 1];
    if (!previous) return "white"; // Default for first candle
    // Logic:
    // Green hollow: close > open && close > prev close
    // Green filled: close < open && close > prev close
    // Red hollow:   close > open && close < prev close
    // Red filled:   close < open && close < prev close
    if (data.close > data.open && data.close > previous.close) {
      return "white"; // Green hollow
    } else if (data.close < data.open && data.close > previous.close) {
      return MODERN_GREEN; // Green filled
    } else if (data.close > data.open && data.close < previous.close) {
      return "white"; // Red hollow
    } else if (data.close < data.open && data.close < previous.close) {
      return MODERN_RED; // Red filled
    }
    return "white";
  };

  const candelStrokeColor = (
    data: CandleData,
    seriesData: CandleData[] = []
  ) => {
    const previous = seriesData[data.idx.index - 1];
    if (!previous) return MODERN_GREEN; // Default for first candle
    if (data.close > data.open && data.close > previous.close) {
      return MODERN_GREEN; // Green hollow
    } else if (data.close < data.open && data.close > previous.close) {
      return MODERN_GREEN; // Green filled
    } else if (data.close > data.open && data.close < previous.close) {
      return MODERN_RED; // Red hollow
    } else if (data.close < data.open && data.close < previous.close) {
      return MODERN_RED; // Red filled
    }
    return MODERN_GREEN;
  };

  const candlestickYAccessor = (data: CandleData) => {
    return data;
  };

  const yEdgeIndicator = (d: ChartData) => d.close;

  const volumeColor = (d: ChartData) => {
    return d.close > d.open
      ? "rgba(38, 166, 154, 0.3)"
      : "rgba(239, 83, 80, 0.3)";
  };

  const volumeSeries = (d: ChartData) => {
    return d.volume;
  };

  const openCloseColor = (d: ChartData) => {
    return d.close > d.open ? "#26a69a" : "#ef5350";
  };

  return (
    <ChartCanvas
      height={height}
      ratio={ratio}
      width={width}
      margin={margin}
      data={data}
      displayXAccessor={displayXAccessor}
      seriesName="Data"
      xScale={xScale}
      xAccessor={xAccessor}
      xExtents={xExtents}
      zoomAnchor={lastVisibleItemBasedZoomAnchor}
      maintainPointsPerPixelOnResize={false}
      disableInteraction={false}
      disablePan={false}
      disableZoom={false}
    >
      <Chart
        id={2}
        height={barChartHeight}
        origin={barChartOrigin}
        yExtents={(d) => d.volume}
      >
        <YAxis
          axisAt="left"
          orient="left"
          ticks={5}
          tickFormat={format(".2s")}
        />
        <MouseCoordinateY
          at="left"
          orient="left"
          displayFormat={format(".4s")}
        />
        <BarSeries fillStyle={volumeColor} yAccessor={volumeSeries} />
      </Chart>
      <Chart id={3} height={chartHeight} yExtents={candleChartExtents}>
        <XAxis showGridLines />
        <YAxis showGridLines tickFormat={pricesDisplayFormat} />
        <CandlestickSeries
          fill={(d) => candelFillColor(d, data)}
          stroke={(d) => candelStrokeColor(d, data)}
          widthRatio={0.6}
          candleStrokeWidth={1}
          wickStroke={(d) => candelStrokeColor(d, data)}
          yAccessor={candlestickYAccessor}
        />
        <LineSeries
          yAccessor={ema200.accessor()}
          strokeStyle={ema200.stroke()}
        />
        <CurrentCoordinate
          yAccessor={ema200.accessor()}
          fillStyle={ema200.stroke()}
        />
        <LineSeries yAccessor={ema26.accessor()} strokeStyle={ema26.stroke()} />
        <CurrentCoordinate
          yAccessor={ema26.accessor()}
          fillStyle={ema26.stroke()}
        />
        <LineSeries yAccessor={ema12.accessor()} strokeStyle={ema12.stroke()} />
        <CurrentCoordinate
          yAccessor={ema12.accessor()}
          fillStyle={ema12.stroke()}
        />
        <MouseCoordinateY
          rectWidth={margin.right}
          displayFormat={pricesDisplayFormat}
        />
        <EdgeIndicator
          itemType="last"
          rectWidth={margin.right}
          fill={openCloseColor}
          lineStroke={openCloseColor}
          displayFormat={pricesDisplayFormat}
          yAccessor={yEdgeIndicator}
        />
        <MovingAverageTooltip
          origin={[8, 24]}
          options={[
            {
              yAccessor: ema200.accessor(),
              type: "EMA",
              stroke: ema200.stroke(),
              windowSize: ema200.options().windowSize,
            },
            {
              yAccessor: ema26.accessor(),
              type: "EMA",
              stroke: ema26.stroke(),
              windowSize: ema26.options().windowSize,
            },
            {
              yAccessor: ema12.accessor(),
              type: "EMA",
              stroke: ema12.stroke(),
              windowSize: ema12.options().windowSize,
            },
          ]}
        />
        <ZoomButtons />
        <OHLCTooltip origin={[8, 16]} />
        <HoverTooltip
          yAccessor={ema200.accessor()}
          tooltip={{
            content: ({ currentItem, xAccessor }) => ({
              x: timeDisplayFormat(xAccessor(currentItem)),
              y: [
                {
                  label: "Open",
                  value:
                    currentItem.open && pricesDisplayFormat(currentItem.open),
                },
                {
                  label: "High",
                  value:
                    currentItem.high && pricesDisplayFormat(currentItem.high),
                },
                {
                  label: "Low",
                  value:
                    currentItem.low && pricesDisplayFormat(currentItem.low),
                },
                {
                  label: "Close",
                  value:
                    currentItem.close && pricesDisplayFormat(currentItem.close),
                },
                {
                  label: "Volume",
                  value:
                    currentItem.volume &&
                    numberDisplayFormat(currentItem.volume),
                },
              ],
            }),
          }}
        />
      </Chart>
      <Chart
        id={4}
        height={elderRayHeight}
        yExtents={[0, elder.accessor()]}
        origin={elderRayOrigin}
        padding={{ top: 8, bottom: 8 }}
      >
        <XAxis showGridLines />
        <YAxis ticks={4} tickFormat={pricesDisplayFormat} />
        <MouseCoordinateX displayFormat={timeDisplayFormat} />
        <MouseCoordinateY
          rectWidth={margin.right}
          displayFormat={pricesDisplayFormat}
        />
        <ElderRaySeries yAccessor={elder.accessor()} />
        <SingleValueTooltip
          yAccessor={elder.accessor()}
          yLabel="Elder Ray"
          yDisplayFormat={pricesDisplayFormat}
          origin={[8, 16]}
        />
      </Chart>
      <CrossHairCursor />
    </ChartCanvas>
  );
};

StockChart.propTypes = {
  data: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,
  ratio: PropTypes.number,
  dateTimeFormat: PropTypes.string,
  height: PropTypes.number,
};

export { StockChart as default };
