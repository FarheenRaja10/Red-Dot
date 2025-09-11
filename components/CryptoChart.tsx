import React, { useEffect, useRef, memo } from 'react';
import { EMA_PERIOD_FAST, EMA_PERIOD_SLOW, EMA_PERIOD_TREND } from '../constants';
import type { ChartDataPoint, TradingPair, HistoricalTrade } from '../types';

interface CryptoChartProps {
  timeframe: string;
  data: ChartDataPoint[];
  pair: TradingPair;
  tradeToHighlight?: HistoricalTrade;
}

// Helper function to draw signals and stop-loss lines on the chart
const drawMarkers = (chart: any, data: ChartDataPoint[], tradeToHighlight?: HistoricalTrade) => {
  if (!chart || !data || data.length === 0) return;

  const lastTime = data.length > 0 ? data[data.length - 1].time / 1000 : Date.now() / 1000;

  // Clear previous drawings to prevent duplicates
  chart.removeAllShapes();
  chart.removeAllExecutions();

  if (tradeToHighlight) {
    const { entrySignal, exitSignal, stopLoss, type } = tradeToHighlight;
    const isBuy = type === 'BUY';

    // 1. Draw Entry Marker using a text label
    const entryPriceForMarker = isBuy ? entrySignal.low : entrySignal.high;
    chart.createText(
        { time: entrySignal.time / 1000, price: entryPriceForMarker },
        {
            text: `ENTRY`,
            lock: true, disableSelection: true,
            overrides: {
                color: isBuy ? '#26a69a' : '#ef5350',
                vertAlign: isBuy ? 'bottom' : 'top',
                horzAlign: 'center',
                fontsize: 14,
                font: "bold",
                backgroundColor: '#111827', // Same as pane background
                borderColor: isBuy ? '#26a69a' : '#ef5350',
            }
        }
    );
    

    // 2. Draw Exit Marker if trade is closed
    if (exitSignal) {
        const exitPriceForMarker = isBuy ? exitSignal.high : exitSignal.low;
        chart.createText(
            { time: exitSignal.time / 1000, price: exitPriceForMarker },
            {
                text: `EXIT`,
                lock: true, disableSelection: true,
                overrides: {
                    color: isBuy ? '#ef5350' : '#26a69a',
                    vertAlign: isBuy ? 'top' : 'bottom', // Opposite alignment
                    horzAlign: 'center',
                    fontsize: 14,
                    font: "bold",
                    backgroundColor: '#111827',
                    borderColor: isBuy ? '#ef5350' : '#26a69a',
                }
            }
        );
    }
    
    // 3. Draw Initial Stop Loss line
    const slEndTime = exitSignal ? exitSignal.time / 1000 : lastTime;
    chart.createShape(
      [{ time: entrySignal.time / 1000, price: stopLoss }, { time: slEndTime, price: stopLoss }],
      {
        shape: 'trend_line', lock: true, disableSelection: true,
        overrides: {
          "linestyle": 2, "linewidth": 2, "linecolor": "#f59e0b",
          "showLabel": true, "text": `STOP LOSS\n$${stopLoss.toFixed(2)}`,
          "textcolor": "#f59e0b", "horzLabelsAlign": "right",
          "vertLabelsAlign": "middle", "fontsize": 12,
          "font": "bold"
        }
      }
    );

  } else {
    // Original logic: Draw all signals and their stop losses
    const signalPoints = data.filter(d => d.signal && d.signal !== 'HOLD' && d.stopLoss);

    signalPoints.forEach(point => {
      if (!point.signal || !point.stopLoss) return;
      const isBuy = point.signal === 'BUY';
      chart.createExecution()
        .setText(point.signal)
        .setTooltip(`${point.signal} Signal @ ${point.close.toFixed(2)}`)
        .setTime(point.time / 1000)
        .setPrice(isBuy ? point.low : point.high)
        .setArrowColor(isBuy ? '#26a69a' : '#ef5350')
        .setArrowHeight(1.5).setArrowSpacing(3)
        .setDirection(isBuy ? "buy" : "sell");

      chart.createShape(
        [{ time: point.time / 1000, price: point.stopLoss }, { time: lastTime, price: point.stopLoss }],
        {
          shape: 'trend_line', lock: true, disableSelection: true,
          overrides: {
            "linestyle": 2, "linewidth": 1, "linecolor": "#f59e0b",
            "showLabel": true, "text": `SL ${point.stopLoss.toFixed(2)}`,
            "textcolor": "#f59e0b", "horzLabelsAlign": "right",
            "vertLabelsAlign": "middle", "fontsize": 10,
          }
        }
      );
    });
  }
};


export const CryptoChart: React.FC<CryptoChartProps> = memo(({ timeframe, data, pair, tradeToHighlight }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null); // To store the widget instance
  const chartApiRef = useRef<any>(null); // To store the chart API object

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const createWidget = () => {
      if (widgetRef.current) {
        try { widgetRef.current.remove(); } catch (error) {}
        widgetRef.current = null;
        chartApiRef.current = null;
      }
      container.innerHTML = '';

      const tvWidget = new (window as any).TradingView.widget({
        autosize: true,
        symbol: pair.tradingViewSymbol,
        interval: timeframe,
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#1e293b',
        enable_publishing: false,
        hide_side_toolbar: true,
        allow_symbol_change: false,
        show_countdown: true,
        container_id: container.id,
        disabled_features: ['header_resolutions'],
        studies: [
          { id: "MAExp@tv-basicstudies", inputs: { length: EMA_PERIOD_FAST }, styles: { plot: { color: '#2962FF' } } },
          { id: "MAExp@tv-basicstudies", inputs: { length: EMA_PERIOD_SLOW }, styles: { plot: { color: '#FF6D00' } } },
          { id: "MAExp@tv-basicstudies", inputs: { length: EMA_PERIOD_TREND }, styles: { plot: { color: '#ef4444' } } }
        ],
        overrides: {
          "paneProperties.background": "#111827",
          "paneProperties.vertGridProperties.color": "#374151",
          "paneProperties.horzGridProperties.color": "#374151",
          "scalesProperties.textColor": "#D1D5DB",
        },
        onChartReady: () => {
          chartApiRef.current = tvWidget.chart();
          // A short delay can help ensure the chart is fully interactive before drawing
          setTimeout(() => {
            if (chartApiRef.current) {
              drawMarkers(chartApiRef.current, data, tradeToHighlight);
            }
          }, 100);
        },
      });
      widgetRef.current = tvWidget;
    };
    
    if (!document.getElementById('tradingview-widget-script')) {
        const script = document.createElement('script');
        script.id = 'tradingview-widget-script';
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = createWidget;
        document.head.appendChild(script);
    } else {
        createWidget();
    }
    
    return () => {
      if (widgetRef.current) {
        try { widgetRef.current.remove(); } catch (error) { console.warn("Could not remove TradingView widget on cleanup:", error); }
        widgetRef.current = null;
        chartApiRef.current = null;
      }
    };
  }, [timeframe, pair.tradingViewSymbol]);

  useEffect(() => {
    if (chartApiRef.current) {
      drawMarkers(chartApiRef.current, data, tradeToHighlight);
    }
  }, [data, tradeToHighlight]);

  return (
    <div className="bg-gray-800 p-1 sm:p-2 rounded-xl shadow-2xl border border-gray-700 h-[550px]">
        <div id={`tradingview-widget-container-${(tradeToHighlight?.entrySignal.time ?? 'main')}`} ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
});