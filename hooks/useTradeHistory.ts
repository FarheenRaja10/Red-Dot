
import { useMemo } from 'react';
import { calculateTradeDetails } from '../utils/tradeUtils';
import type { ChartDataPoint, HistoricalTrade, TradeSettings, TradeDetails } from '../types';

/**
 * A custom hook that runs a backtest simulation to generate a history of trades.
 * It processes raw signal data against the current trade settings to determine
 * entries, exits (due to momentum exhaustion, stop loss, reversal, or trailing stop), and profit/loss.
 *
 * @param rawSignalData The unprocessed data array with signals.
 * @param settings The user's current trade configuration.
 * @param notionalCapital The calculated notional capital for trades.
 * @returns A memoized array of historical trades, including the current open position.
 */
export const useTradeHistory = (
  rawSignalData: ChartDataPoint[],
  settings: TradeSettings,
  notionalCapital: number,
): HistoricalTrade[] => {
  const tradeHistory = useMemo((): HistoricalTrade[] => {
    if (!rawSignalData || rawSignalData.length < 2) {
      return [];
    }

    const {
        capital,
        riskModel,
        riskPercentage,
        fixedRiskAmount,
        leverage,
        trailingStopEnabled,
        trailingStopActivation,
        trailingStopDistance
    } = settings;

    const trades: HistoricalTrade[] = [];
    interface OpenPosition {
      type: 'BUY' | 'SELL';
      entryPoint: ChartDataPoint;
      details: TradeDetails;
      currentStopLoss: number;
      peakPrice: number;
    }
    let openPosition: OpenPosition | null = null;

    // Start from index 1 to have a `prevPoint` for momentum calculations
    for (let i = 1; i < rawSignalData.length; i++) {
        const prevPoint = rawSignalData[i-1];
        const point = rawSignalData[i];

        if (openPosition) {
            let exitPrice: number | null = null;
            let exitReason: HistoricalTrade['exitReason'] = undefined;
            const entryPrice = openPosition.entryPoint.close;

            // --- TRAILING STOP LOGIC ---
            if (trailingStopEnabled) {
                if (openPosition.type === 'BUY') {
                    openPosition.peakPrice = Math.max(openPosition.peakPrice, point.high);
                    const profitInUSD = (openPosition.peakPrice - entryPrice) * openPosition.details.positionSizeInBase;
                    if (profitInUSD >= trailingStopActivation) {
                        const potentialNewStop = openPosition.peakPrice - (trailingStopDistance / openPosition.details.positionSizeInBase);
                        if (potentialNewStop > openPosition.currentStopLoss) {
                            openPosition.currentStopLoss = potentialNewStop;
                        }
                    }
                } else { // SELL
                    openPosition.peakPrice = Math.min(openPosition.peakPrice, point.low);
                    const profitInUSD = (entryPrice - openPosition.peakPrice) * openPosition.details.positionSizeInBase;
                    if (profitInUSD >= trailingStopActivation) {
                        const potentialNewStop = openPosition.peakPrice + (trailingStopDistance / openPosition.details.positionSizeInBase);
                        if (potentialNewStop < openPosition.currentStopLoss) {
                            openPosition.currentStopLoss = potentialNewStop;
                        }
                    }
                }
            }

            // --- EXIT CONDITIONS (in order of priority) ---

            // 1. Trend-Following Exit (Primary Exit)
            // Exit when the fast EMA (13) crosses the slow EMA (48), signaling a trend change.
            if (point.ema13 && point.ema48 && prevPoint.ema13 && prevPoint.ema48) {
                 if (openPosition.type === 'BUY' && prevPoint.ema13 >= prevPoint.ema48 && point.ema13 < point.ema48) {
                    exitPrice = point.close;
                    exitReason = 'Trend Exit';
                } else if (openPosition.type === 'SELL' && prevPoint.ema13 <= prevPoint.ema48 && point.ema13 > point.ema48) {
                    exitPrice = point.close;
                    exitReason = 'Trend Exit';
                }
            }


            // 2. Stop Loss / Trailing Stop (Safety Exit)
            if (exitPrice === null) {
                if (openPosition.type === 'BUY' && point.low <= openPosition.currentStopLoss) {
                    exitPrice = openPosition.currentStopLoss;
                    exitReason = trailingStopEnabled && exitPrice > entryPrice ? 'Trailing Stop' : 'Stop Loss';
                } else if (openPosition.type === 'SELL' && point.high >= openPosition.currentStopLoss) {
                    exitPrice = openPosition.currentStopLoss;
                    exitReason = trailingStopEnabled && exitPrice < entryPrice ? 'Trailing Stop' : 'Stop Loss';
                }
            }
            
            // 3. Reversal Signal (Systematic Exit)
            if (exitPrice === null && point.signal && point.signal !== 'HOLD' && openPosition.type !== point.signal) {
                exitPrice = point.close;
                exitReason = 'Reversal';
            }

            // --- CLOSE TRADE ---
            if (exitPrice !== null && exitReason) {
                const pnlPerCoin = openPosition.type === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice;
                const profitOrLoss = pnlPerCoin * openPosition.details.positionSizeInBase;
                const marginForTrade = openPosition.details.positionSizeInUSD / openPosition.details.leverage;
                const profitOrLossPercentage = marginForTrade > 0 ? (profitOrLoss / marginForTrade) * 100 : 0;
                
                const exitPointForHistory: ChartDataPoint = { ...point, close: exitPrice };

                trades.push({
                    entrySignal: openPosition.entryPoint,
                    exitSignal: exitPointForHistory,
                    positionSizeUSD: openPosition.details.positionSizeInUSD,
                    positionSizeInBase: openPosition.details.positionSizeInBase,
                    profitOrLoss,
                    profitOrLossPercentage,
                    type: openPosition.type,
                    stopLoss: openPosition.details.stopLoss,
                    exitReason,
                });
                
                openPosition = null;
            }
        }

        // --- OPEN TRADE ---
        if (!openPosition && point.signal && point.signal !== 'HOLD') {
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
                openPosition = {
                    type: point.signal,
                    entryPoint: point,
                    details,
                    currentStopLoss: details.stopLoss,
                    peakPrice: point.signal === 'BUY' ? point.high : point.low,
                };
            }
        }
    }

    // --- HANDLE FINAL OPEN POSITION ---
    if (openPosition) {
      const lastPrice = rawSignalData[rawSignalData.length - 1].close;
      const entryPrice = openPosition.entryPoint.close;
      const pnlPerCoin = openPosition.type === 'BUY' ? lastPrice - entryPrice : entryPrice - lastPrice;
      const unrealizedPnl = pnlPerCoin * openPosition.details.positionSizeInBase;
      const marginForTrade = openPosition.details.positionSizeInUSD / openPosition.details.leverage;
      const unrealizedPnlPercentage = marginForTrade > 0 ? (unrealizedPnl / marginForTrade) * 100 : 0;

      trades.push({
        entrySignal: openPosition.entryPoint,
        positionSizeUSD: openPosition.details.positionSizeInUSD,
        positionSizeInBase: openPosition.details.positionSizeInBase,
        profitOrLoss: unrealizedPnl,
        profitOrLossPercentage: unrealizedPnlPercentage,
        type: openPosition.type,
        stopLoss: openPosition.details.stopLoss,
      });
    }

    return trades;
  }, [rawSignalData, settings, notionalCapital]);

  return tradeHistory;
};
