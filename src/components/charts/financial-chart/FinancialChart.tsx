import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { useState } from "react";
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
  withDeviceRatio,
  withSize,
  Label,
  Annotate,
  BarAnnotation,
} from "react-financial-charts";
import type { Candlestick as ChartData } from "@/types/candlestick";
import React from "react";

interface FinancialChartProps {
  data: ChartData[];
  dateTimeFormat?: string;
  height: number;
  ratio: number;
  width: number;
  chartText?: string;
}

const getPercentDiff = (a: number, b: number) => {
  return ((a - b) / b) * 100;
};

const FinancialChart = ({
  data: initialData,
  dateTimeFormat = "%d %b",
  height,
  ratio,
  width,
  chartText,
  ...rest
}: FinancialChartProps) => {
  const margin = { left: 50, right: 50, top: 0, bottom: 24 };
  const pricesDisplayFormat = format(".2f");
  const numberDisplayFormat = format(",");
  const [lastClose, setLastClose] = useState(0);
  const [lastColor, setLastColor] = useState("#26a69a");

  const xScaleProvider =
    discontinuousTimeScaleProviderBuilder().inputDateAccessor(
      (d: ChartData) => new Date(d.date),
    );

  const ema12 = ema()
    .id(1)
    .options({ windowSize: 21 })
    .merge((d: ChartData, c: number) => {
      d.ema12 = c;
    })
    .accessor((d: ChartData) => d.ema12 || 0);

  const ema26 = ema()
    .id(2)
    .options({ windowSize: 51 })
    .merge((d: ChartData, c: number) => {
      d.ema26 = c;
    })
    .accessor((d: ChartData) => d.ema26 || 0);

  const ema200 = ema()
    .id(3)
    .options({ windowSize: 200 })
    .merge((d: ChartData, c: number) => {
      d.ema200 = c;
    })
    .accessor((d: ChartData) => d.ema200 || 0)
    .stroke("green");

  const sma200 = ema()
    .id(4)
    .options({ windowSize: 200 })
    .accessor((d: ChartData) => d.sma200 || 0)
    .stroke("#9B0A47");

  const elder = elderRay();

  const calculatedData = elder(ema200(ema26(ema12(initialData))));
  const { data, xScale, xAccessor, displayXAccessor } =
    xScaleProvider(calculatedData);

  // Add index to data for previous/next calculations
  data.forEach((d: ChartData, i: number) => {
    d.index = i;
  });

  const max = xAccessor(data[data.length - 1]);
  const min = xAccessor(data[Math.max(0, data.length - 100)]);
  const xExtents = [min, max + 8];
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

  const barChartExtents = (data: ChartData) => {
    return data.volume || 0;
  };

  let dataLow = 0;
  let dataHigh = 0;

  const candleChartExtents = (data: ChartData) => {
    const low = data.low || data.price;
    const high = data.high || data.price;
    dataLow = dataLow === 0 ? low : low < dataLow ? low : dataLow;
    dataHigh = dataHigh === 0 ? high : high > dataHigh ? high : dataHigh;
    const percentDiff = getPercentDiff(dataHigh, dataLow) / 1000;
    const highValue = high + dataHigh * percentDiff;
    const lowValue = low - low * percentDiff;

    return [highValue, lowValue];
  };

  const yEdgeIndicator = (data: ChartData) => {
    setLastClose(data.close || data.price);
    return data.close || data.price;
  };

  const volumeColor = (data: ChartData) => {
    const open = data.open || data.price;
    const close = data.close || data.price;
    return close > open ? "rgba(38, 166, 154, 0.3)" : "rgba(239, 83, 80, 0.3)";
  };

  const volumeSeries = (data: ChartData) => {
    return data.volume || 0;
  };

  const openCloseColor = (data: ChartData) => {
    const open = data.open || data.price;
    const close = data.close || data.price;
    const color = close > open ? "#26a69a" : "#ef5350";
    setLastColor(color);
    return color;
  };

  const candelFillColor = (data: ChartData, seriesData: ChartData[] = []) => {
    const previous =
      data.index !== undefined ? seriesData[data.index - 1] : undefined;
    const open = data.open || data.price;
    const close = data.close || data.price;
    let fillColor =
      close > open
        ? "#ffffff00"
        : previous && close >= (previous.close || previous.price)
          ? "#26a69a"
          : "#ef5350";

    switch (data.patternType) {
      case "bullish":
        fillColor = "green";
        break;
      case "bearish":
        fillColor = "red";
        break;
      default:
        break;
    }

    return fillColor;
  };

  const candelStrokeColor = (data: ChartData, seriesData: ChartData[] = []) => {
    const previous =
      data.index !== undefined ? seriesData[data.index - 1] : undefined;
    const open = data.open || data.price;
    const close = data.close || data.price;
    const dataMax = Math.max(open, close);
    const prevOpen = previous?.open || previous?.price || 0;
    const prevClose = previous?.close || previous?.price || 0;
    const prevMax = Math.max(prevOpen, prevClose);
    const prevMin = Math.min(prevOpen, prevClose);
    const strokeColor =
      close > open
        ? previous && open < prevClose && close >= prevOpen
          ? previous && (dataMax < prevMax || dataMax < prevMin)
            ? "red"
            : "green"
          : previous && dataMax < prevMin
            ? "red"
            : "green"
        : previous && close >= prevClose
          ? "green"
          : "red";

    return strokeColor;
  };

  const candlestickYAccessor = (data: ChartData) => {
    return {
      open: data.open || data.price,
      high: data.high || data.price,
      low: data.low || data.price,
      close: data.close || data.price,
    };
  };

  const averageVolume = (data: ChartData[]) => {
    const { length } = data;
    return data.reduce((acc, val) => {
      return acc + (val.volume || 0) / length;
    }, 0);
  };

  const whenBullish = (data: ChartData) => {
    return data.patternType === "bullish";
  };

  const whenBearish = (data: ChartData) => {
    return data.patternType === "bearish";
  };

  interface ChartScale {
    yScale: (n: number) => number;
    xScale: (n: number) => number;
    xAccessor: (d: ChartData) => number;
    datum: ChartData;
  }

  const annotBullish = {
    tooltip: (data: ChartData) => data.pattern,
    textIcon: "\u25B2",
    textIconFill: "green",
    textIconFontSize: 20,
    className: "bullish",
    y: ({ yScale, datum }: ChartScale) => yScale(datum.high || datum.price),
    x: ({ xScale, xAccessor, datum }: ChartScale) => xScale(xAccessor(datum)),
  };

  const annotBerish = {
    tooltip: (data: ChartData) => data.pattern,
    textIcon: "\u25BC",
    textIconFill: "red",
    textIconFontSize: 20,
    className: "bearish",
    y: ({ yScale, datum }: ChartScale) => yScale(datum.high || datum.price),
    x: ({ xScale, xAccessor, datum }: ChartScale) =>
      xScale(xAccessor(datum)) - 0.35,
  };

  // const SingleValueTooltip = ({
  //     yAccessor,
  //     yLabel,
  //     yDisplayFormat,
  //     origin = [8, 16]
  // }: {
  //     yAccessor: (data: ChartData) => ElderRayData;
  //     yLabel: string;
  //     yDisplayFormat: (data: ElderRayData) => string;
  //     origin?: [number, number];
  // }) => (
  //     <SingleValueTooltip
  //         yAccessor={yAccessor}
  //         yLabel={yLabel}
  //         yDisplayFormat={yDisplayFormat}
  //         origin={origin}
  //     />
  // );

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
    >
      <Chart
        id={2}
        height={barChartHeight}
        origin={barChartOrigin}
        yExtents={barChartExtents}
      >
        <YAxis
          axisAt="left"
          orient="left"
          ticks={5}
          tickFormat={format(".2s")}
        />
        <LineSeries
          yAccessor={() => averageVolume(data)}
          strokeStyle="#9B0A47"
        />
        <MouseCoordinateY
          at="left"
          orient="left"
          displayFormat={format(".4s")}
          arrowWidth={10}
        />
        <BarSeries fillStyle={volumeColor} yAccessor={volumeSeries} />
        <CurrentCoordinate
          yAccessor={(d) => d.volume || 0}
          fillStyle="#9B0A47"
        />
        <EdgeIndicator
          itemType="first"
          orient="right"
          rectWidth={margin.right}
          fill="#9B0A47"
          displayFormat={format(".4s")}
          yAccessor={() => averageVolume(data)}
          arrowWidth={10}
        />
      </Chart>

      <Chart id={3} height={chartHeight} yExtents={candleChartExtents}>
        <XAxis showGridLines showTickLabel={false} />
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
          arrowWidth={10}
        />
        <LineSeries yAccessor={() => lastClose} strokeStyle={lastColor} />
        <CurrentCoordinate
          yAccessor={sma200.accessor()}
          fillStyle={ema12.stroke()}
        />
        <LineSeries yAccessor={sma200.accessor()} strokeStyle="#9B0A47" />
        <EdgeIndicator
          itemType="last"
          rectWidth={margin.right}
          fill={openCloseColor}
          lineStroke={openCloseColor}
          displayFormat={pricesDisplayFormat}
          yAccessor={yEdgeIndicator}
          arrowWidth={10}
        />
        <MovingAverageTooltip
          origin={[8, 24]}
          options={[
            {
              yAccessor: sma200.accessor(),
              type: "SMA",
              stroke: sma200.stroke(),
              windowSize: sma200.options().windowSize,
            },
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
        <Label
          text={chartText}
          {...rest}
          x={(width - margin.left - margin.right) / 2}
          y={(height - margin.top - margin.bottom) / 2}
        />
        <Annotate
          with={BarAnnotation}
          usingProps={annotBullish}
          when={whenBullish}
        />
        <Annotate
          with={BarAnnotation}
          usingProps={annotBerish}
          when={whenBearish}
        />
        <OHLCTooltip
          origin={[8, 16]}
          textFill={(d) => (d.close > d.open ? "#26a69a" : "#ef5350")}
        />
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
                {
                  label: "Bar %",
                  value: `${pricesDisplayFormat(((currentItem.high - currentItem.low) * 100) / lastClose)}%`,
                },
                {
                  label: "H200 %",
                  value: `${currentItem.ema200 && pricesDisplayFormat(getPercentDiff(currentItem.high || currentItem.price, currentItem.ema200))}%`,
                },
                {
                  label: "L200 %",
                  value: `${currentItem.ema200 && pricesDisplayFormat(getPercentDiff(currentItem.low || currentItem.price, currentItem.ema200))}%`,
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
        <XAxis showGridLines gridLinesStrokeStyle="#e0e3eb" />
        <YAxis ticks={4} tickFormat={pricesDisplayFormat} />

        <MouseCoordinateX displayFormat={timeDisplayFormat} />
        <MouseCoordinateY
          rectWidth={margin.right}
          displayFormat={pricesDisplayFormat}
          arrowWidth={10}
        />

        <ElderRaySeries yAccessor={elder.accessor()} />

        <SingleValueTooltip
          yAccessor={elder.accessor()}
          yLabel="Elder Ray"
          yDisplayFormat={() => {
            const data = elder.accessor()(calculatedData[0]);
            return `${pricesDisplayFormat(data.bullPower)}, ${pricesDisplayFormat(data.bearPower)}`;
          }}
          origin={[8, 16]}
        />
      </Chart>
      <CrossHairCursor />
    </ChartCanvas>
  );
};

const BaseChart = React.memo(FinancialChart);
const ChartWithRatio = withDeviceRatio()(
  BaseChart as unknown as React.ComponentClass<FinancialChartProps>,
);
const ResponsiveChart = withSize({ style: { minHeight: 600 } })(
  ChartWithRatio as unknown as React.ComponentClass<FinancialChartProps>,
);
export default ResponsiveChart;
