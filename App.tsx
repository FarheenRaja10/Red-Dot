import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { TimeframeSelector } from './components/TimeframeSelector';
import { PairSelector } from './components/PairSelector';
import { SignalIndicator } from './components/SignalIndicator';
import { CryptoChart } from './components/CryptoChart';
import { TradeSetupPanel } from './components/TradeSetupPanel';
import { TradeAlertModal } from './components/TradeAlertModal';
import { AlertHistoryModal } from './components/AlertHistoryModal';
import { SignalHistoryTable } from './components/SignalHistoryTable';
import { TradeDetailModal } from './components/TradeDetailModal';
import { getHistoricalData } from './services/cryptoService';
import { addIndicators } from './utils/indicatorUtils';
import { calculateTradeDetails, formatTradeAlert } from './utils/tradeUtils';
import { TIMEFRAMES, SUPPORTED_PAIRS } from './constants';
import type { AppTimeframeOption, ChartDataPoint, RiskModel, Signal, HistoricalTrade, TradeSettings, TradingPair, TradeDetails, TradeType, Alert } from './types';

const App: React.FC = () => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<AppTimeframeOption>(
    TIMEFRAMES.find(tf => tf.value === '2m') || TIMEFRAMES[0]
  );
  const [selectedPair, setSelectedPair] = useState<TradingPair>(SUPPORTED_PAIRS[0]);

  const [lastSignal, setLastSignal] = useState<Signal>('HOLD');
  const [lastSignalDate, setLastSignalDate] = useState<number | null>(null);
  const [lastSignalPrice, setLastSignalPrice] = useState<number | null>(null);
  
  // Trade Settings State
  const [capital, setCapital] = useState<number>(10000);
  const [riskPercentage, setRiskPercentage] = useState<number>(1);
  const [riskModel, setRiskModel] = useState<RiskModel>('percentage');
  const [fixedRiskAmount, setFixedRiskAmount] = useState<number>(100);
  const [tradeType, setTradeType] = useState<TradeType>('spot');
  const [leverage, setLeverage] = useState<number>(1);
  const [trailingStopEnabled, setTrailingStopEnabled] = useState<boolean>(true);
  const [trailingStopActivation, setTrailingStopActivation] = useState<number>(300);
  const [trailingStopDistance, setTrailingStopDistance] = useState<number>(300);


  const [tradeAlertText, setTradeAlertText] = useState<string | null>(null);
  const [alertHistory, setAlertHistory] = useState<Alert[]>([]);
  const [isAlertHistoryVisible, setIsAlertHistoryVisible] = useState<boolean>(false);
  
  const [selectedTrade, setSelectedTrade] = useState<HistoricalTrade | null>(null);

  const handleViewTradeDetail = (trade: HistoricalTrade) => {
    setSelectedTrade(trade);
  };

  const handleCloseTradeDetail = () => {
    setSelectedTrade(null);
  };


  const notionalCapital = useMemo(() => capital * leverage, [capital, leverage]);

  useEffect(() => {
    document.title = `RedDot | ${selectedPair.symbol}`;
  }, [selectedPair]);

  const handleSelectTimeframe = (timeframe: AppTimeframeOption) => {
    setSelectedTimeframe(timeframe);
    setData([]); // Clear data to prevent drawing stale signals on new chart
  };

  const handleSelectPair = (pair: TradingPair) => {
    setSelectedPair(pair);
    setData([]); // Clear data to prevent drawing stale signals on new chart
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rawData = await getHistoricalData(selectedTimeframe, selectedPair);
      const dataWithIndicators = addIndicators(rawData);
      setData(dataWithIndicators);
      
      // Find the last signal
      const lastSignalPoint = [...dataWithIndicators].reverse().find(d => d.signal && d.signal !== 'HOLD');
      if (lastSignalPoint && lastSignalPoint.signal) {
        setLastSignal(lastSignalPoint.signal);
        setLastSignalDate(lastSignalPoint.time);
        setLastSignalPrice(lastSignalPoint.close);
      } else {
        setLastSignal('HOLD');
        setLastSignalDate(null);
        setLastSignalPrice(null);
      }
    } catch (err) {
      setError('Failed to load signal data. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeframe, selectedPair]);

  useEffect(() => {
    fetchData();
    // Set up a poller to refresh data periodically
    const interval = setInterval(fetchData, selectedTimeframe.pollInterval);
    return () => clearInterval(interval);
  }, [fetchData, selectedTimeframe.pollInterval]);

  // NEW: A memoized value to hold the final data with calculated trade details for the chart
  const dataWithCalculatedStops = useMemo(() => {
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
                // Create a new point object with the calculated stopLoss
                return { ...point, stopLoss: details.stopLoss };
            }
        }
        // Return original point if no signal or if details can't be calculated
        return point;
    });
  }, [data, capital, riskPercentage, riskModel, fixedRiskAmount, notionalCapital, leverage]);


  // Effect to trigger trade alert modal
  useEffect(() => {
    if (data.length < 2) return;

    const latestPoint = data[data.length - 1];
    const previousPoint = data[data.length - 2];

    // Only show alert for a new signal on the most recent candle
    if (latestPoint.signal && latestPoint.signal !== 'HOLD' && latestPoint.signal !== previousPoint.signal) {
      const riskValue = riskModel === 'percentage' ? riskPercentage : fixedRiskAmount;
      const tradeDetails: TradeDetails | null = calculateTradeDetails({
        entryPrice: latestPoint.close,
        signalType: latestPoint.signal,
        notionalCapital: notionalCapital,
        realCapital: capital,
        riskModel,
        riskValue,
        leverage: leverage,
      });

      if (tradeDetails) {
        const alertText = formatTradeAlert(tradeDetails, latestPoint.close, latestPoint.signal, selectedPair);
        setTradeAlertText(alertText);
        setAlertHistory(prev => [{ id: latestPoint.time, text: alertText, timestamp: latestPoint.time }, ...prev]);
      }
    }
  }, [data, capital, riskModel, riskPercentage, fixedRiskAmount, selectedPair, notionalCapital, leverage]);
  
  const handleSaveTradeSettings = (settings: TradeSettings) => {
    setCapital(settings.capital);
    setRiskPercentage(settings.riskPercentage);
    setRiskModel(settings.riskModel);
    setFixedRiskAmount(settings.fixedRiskAmount);
    setTradeType(settings.tradeType);
    setLeverage(settings.leverage);
    setTrailingStopEnabled(settings.trailingStopEnabled);
    setTrailingStopActivation(settings.trailingStopActivation);
    setTrailingStopDistance(settings.trailingStopDistance);
  };
  
  const tradeHistory = useMemo((): HistoricalTrade[] => {
    const trades: HistoricalTrade[] = [];
    interface OpenPosition {
      type: 'BUY' | 'SELL';
      entryPoint: ChartDataPoint;
      details: TradeDetails;
      currentStopLoss: number;
      peakPrice: number; // Highest high for long, lowest low for short
    }
    let openPosition: OpenPosition | null = null;

    for (const point of data) {
      // --- I. CHECK FOR CLOSING AN OPEN POSITION ---
      if (openPosition) {
        let exitPrice: number | null = null;
        let exitReason: HistoricalTrade['exitReason'] = undefined;
        const entryPrice = openPosition.entryPoint.close;

        // 1a. Update peak price and trail stop loss if enabled
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
        
        // 1b. Check if stop loss (initial or trailed) was hit
        if (openPosition.type === 'BUY' && point.low <= openPosition.currentStopLoss) {
          exitPrice = openPosition.currentStopLoss;
          exitReason = trailingStopEnabled && exitPrice > entryPrice ? 'Trailing Stop' : 'Stop Loss';
        } else if (openPosition.type === 'SELL' && point.high >= openPosition.currentStopLoss) {
          exitPrice = openPosition.currentStopLoss;
          exitReason = trailingStopEnabled && exitPrice < entryPrice ? 'Trailing Stop' : 'Stop Loss';
        }

        // 1c. If not stopped out, check for a reversal signal
        if (exitPrice === null && point.signal && point.signal !== 'HOLD' && openPosition.type !== point.signal) {
          exitPrice = point.close; // Exit on the close of the reversal candle
          exitReason = 'Reversal';
        }

        // 1d. If an exit condition was met, create the historical trade entry
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
          
          openPosition = null; // Position is now closed
        }
      }

      // --- II. CHECK FOR OPENING A NEW POSITION ---
      // A new position can be opened if one doesn't exist (or was just closed).
      // This allows for stop-and-reverse on the same candle.
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

    // --- III. ADD THE CURRENT OPEN POSITION TO THE HISTORY TABLE ---
    if (openPosition) {
      const lastPrice = data.length > 0 ? data[data.length - 1].close : openPosition.entryPoint.close;
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
  }, [data, capital, riskPercentage, riskModel, fixedRiskAmount, notionalCapital, leverage, trailingStopEnabled, trailingStopActivation, trailingStopDistance]);


  const getStatusText = (): string => {
    if (isLoading) return "Loading Signal Data...";
    if (error) return error;
    if (lastSignal === 'HOLD') return "Awaiting Crossover";
    return "";
  }

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen font-sans">
      <main className="container mx-auto px-4 py-8">
        <Header />

        <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
          <PairSelector
            selectedPair={selectedPair}
            onSelectPair={handleSelectPair}
            disabled={isLoading}
          />
          <TimeframeSelector 
            selectedTimeframe={selectedTimeframe}
            onSelectTimeframe={handleSelectTimeframe}
            disabled={isLoading}
          />
          <div className="bg-gray-900/50 p-2 rounded-lg">
            <button
              onClick={() => setIsAlertHistoryVisible(true)}
              disabled={isLoading}
              className="relative px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
              aria-label={`View ${alertHistory.length} trade alerts`}
            >
              <span>🚨 Alerts</span>
              {alertHistory.length > 0 && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-brand-red rounded-full">
                      {alertHistory.length}
                  </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <SignalIndicator 
            signal={lastSignal} 
            date={lastSignalDate} 
            price={lastSignalPrice}
            status={getStatusText()}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
             <CryptoChart 
                key={`${selectedTimeframe.value}-${selectedPair.symbol}`}
                timeframe={selectedTimeframe.tradingView} 
                pair={selectedPair}
                data={dataWithCalculatedStops}
              />
          </div>
          <div className="lg:col-span-1">
            <TradeSetupPanel 
              capital={capital}
              riskPercentage={riskPercentage}
              riskModel={riskModel}
              fixedRiskAmount={fixedRiskAmount}
              tradeType={tradeType}
              leverage={leverage}
              trailingStopEnabled={trailingStopEnabled}
              trailingStopActivation={trailingStopActivation}
              trailingStopDistance={trailingStopDistance}
              onSave={handleSaveTradeSettings}
            />
          </div>
        </div>

        <SignalHistoryTable trades={tradeHistory} pair={selectedPair} onViewTrade={handleViewTradeDetail} />

        {tradeAlertText && (
          <TradeAlertModal 
            alertText={tradeAlertText} 
            onClose={() => setTradeAlertText(null)} 
          />
        )}

        {isAlertHistoryVisible && (
            <AlertHistoryModal
                alerts={alertHistory}
                onClose={() => setIsAlertHistoryVisible(false)}
                onClear={() => setAlertHistory([])}
            />
        )}

        {selectedTrade && (
            <TradeDetailModal
                trade={selectedTrade}
                pair={selectedPair}
                onClose={handleCloseTradeDetail}
                allData={data}
                timeframe={selectedTimeframe}
            />
        )}
      </main>
    </div>
  );
};

export default App;