

import type { PriceData, ChartDataPoint, Signal } from '../types';
import { EMA_PERIOD_FAST, EMA_PERIOD_SLOW, EMA_PERIOD_TREND } from '../constants';

const calculateEMA = (data: number[], period: number): (number | undefined)[] => {
  if (data.length < period) {
    return Array(data.length).fill(undefined);
  }

  const k = 2 / (period + 1);
  const emaArray: (number | undefined)[] = Array(data.length).fill(undefined);
  
  // First EMA is a simple moving average
  let sma = 0;
  for (let i = 0; i < period; i++) {
    sma += data[i];
  }
  emaArray[period - 1] = sma / period;

  // Calculate the rest of the EMAs
  for (let i = period; i < data.length; i++) {
    const prevEma = emaArray[i - 1];
    if (typeof prevEma === 'number') {
        emaArray[i] = (data[i] * k) + (prevEma * (1 - k));
    }
  }

  return emaArray;
};

export const addIndicators = (data: PriceData[]): ChartDataPoint[] => {
  const closes = data.map(d => d.close);
  
  const emaFast = calculateEMA(closes, EMA_PERIOD_FAST);
  const emaSlow = calculateEMA(closes, EMA_PERIOD_SLOW);
  const emaTrend = calculateEMA(closes, EMA_PERIOD_TREND);

  const dataWithIndicators: ChartDataPoint[] = data.map((d, i) => ({
    ...d,
    ema13: emaFast[i],
    ema48: emaSlow[i],
    ema200: emaTrend[i],
  }));

  // Add signal markers based on crossover + momentum confirmation
  // We start at index 2 to look at the previous two bars for a confirmed crossover.
  for (let i = 2; i < dataWithIndicators.length; i++) {
    const prevPrev = dataWithIndicators[i - 2];
    const prev = dataWithIndicators[i - 1];
    const current = dataWithIndicators[i];

    if (prevPrev.ema13 && prevPrev.ema48 && prev.ema13 && prev.ema48 && current.ema13 && current.ema48) {
      
      // Condition 1: Check for a crossover on the PREVIOUS bar.
      const crossoverUp = prevPrev.ema13 <= prevPrev.ema48 && prev.ema13 > prev.ema48;
      const crossoverDown = prevPrev.ema13 >= prevPrev.ema48 && prev.ema13 < prev.ema48;

      if (crossoverUp) {
        // Condition 2: Confirm momentum by checking if the spread widened on the CURRENT bar.
        const prevSpread = prev.ema13 - prev.ema48;
        const currentSpread = current.ema13 - current.ema48;
        if (currentSpread > prevSpread) {
          // Signal is marked on the current (confirmation) bar.
          current.signal = 'BUY';
        }
      } else if (crossoverDown) {
        // Symmetrical check for a sell signal.
        const prevSpread = prev.ema13 - prev.ema48;
        const currentSpread = current.ema13 - current.ema48;
        if (currentSpread < prevSpread) {
          current.signal = 'SELL';
        }
      }
    }
  }

  return dataWithIndicators;
};