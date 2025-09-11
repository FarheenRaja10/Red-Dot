import { useState, useEffect, useCallback, useMemo } from 'react';
import { getHistoricalData } from '../services/cryptoService';
import { addIndicators } from '../utils/indicatorUtils';
import { calculateTradeDetails } from '../utils/tradeUtils';
import type { ChartDataPoint, Signal, AppTimeframeOption, TradingPair, TradeSettings } from '../types';

/**
 * A custom hook to fetch, process, and manage cryptocurrency signal data.
 * It handles loading and error states, polls for new data, adds technical indicators,
 * finds the latest signal, and prepares data with stop-loss markers for chart visualization.
 * 
 * @param selectedTimeframe - The currently selected timeframe configuration.
 * @param selectedPair - The currently selected trading pair.
 * @param settings - The current trade settings, used for calculating stop-loss markers.
 * @param notionalCapital - The calculated notional capital for trades.
 * @returns An object with all necessary data and state for the UI.
 */
export const useSignalData = (
  selectedTimeframe: AppTimeframeOption,
  selectedPair: TradingPair,
  settings: TradeSettings,
  notionalCapital: number
) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [lastSignal, setLastSignal] = useState<Signal>('HOLD');
  const [lastSignalDate, setLastSignalDate] = useState<number | null>(null);
  const [lastSignalPrice, setLastSignalPrice] = useState<number | null>(null);

  /**
   * Fetches raw price data, adds indicators, and updates the component's state.
   * This function is wrapped in useCallback to stabilize its reference for useEffect.
   */
  const fetchData = useCallback(async () => {
    // Don't set loading to true on polls, only on initial/parameter change load.
    if (data.length === 0) {
        setIsLoading(true);
    }
    setError(null);
    try {
      const rawData = await getHistoricalData(selectedTimeframe, selectedPair);
      const dataWithIndicators = addIndicators(rawData);
      setData(dataWithIndicators);
      
      const lastSignalPoint = [...dataWithIndicators].reverse().find(d => d.signal && d.signal !== 'HOLD');
      if (lastSignalPoint?.signal) {
        setLastSignal(lastSignalPoint.signal);
        setLastSignalDate(lastSignalPoint.time);
        setLastSignalPrice(lastSignalPoint.close);
      } else {
        setLastSignal('HOLD');
        setLastSignalDate(null);
        setLastSignalPrice(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to load signal data. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeframe, selectedPair, data.length]);

  /**
   * Effect to trigger data fetching when timeframe or pair changes, and to set up
   * a polling interval for continuous updates.
   */
  useEffect(() => {
    setData([]); // Clear data on param change to show loading state correctly.
    fetchData();
    const interval = setInterval(fetchData, selectedTimeframe.pollInterval);
    return () => clearInterval(interval);
  }, [fetchData, selectedTimeframe, selectedPair, selectedTimeframe.pollInterval]);

  /**
   * Memoized calculation to add visual stop-loss markers to the data points
   * intended for the chart. This separates chart data from raw signal data.
   */
  const dataWithChartMarkers = useMemo(() => {
    const { riskModel, riskPercentage, fixedRiskAmount, leverage, capital } = settings;
    return data.map(point => {
        if (point.signal && point.signal !== 'HOLD') {
            const riskValue = riskModel === 'percentage' ? riskPercentage : fixedRiskAmount;
            const details = calculateTradeDetails({
                entryPrice: point.close,
                signalType: point.signal,
                notionalCapital: notionalCapital,
                realCapital: capital,
                riskModel,
                riskValue,
                leverage: leverage,
            });

            if (details) {
                return { ...point, stopLoss: details.stopLoss };
            }
        }
        return point;
    });
  }, [data, settings, notionalCapital]);

  /**
   * Memoized calculation for the primary status text displayed below the signal indicator.
   */
  const statusText = useMemo(() => {
    if (isLoading) return "Loading Signal Data...";
    if (error) return error;
    if (lastSignal === 'HOLD') return "Awaiting Crossover";
    return "";
  }, [isLoading, error, lastSignal]);

  return {
    dataWithChartMarkers,
    rawSignalData: data,
    isLoading,
    error,
    lastSignal,
    lastSignalDate,
    lastSignalPrice,
    statusText,
  };
};
