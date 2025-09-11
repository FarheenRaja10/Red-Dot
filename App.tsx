import React, { useState, useEffect } from 'react';
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
import { calculateTradeDetails, formatTradeAlert } from './utils/tradeUtils';
import { TIMEFRAMES, SUPPORTED_PAIRS } from './constants';
import type { AppTimeframeOption, HistoricalTrade, TradingPair, Alert, TradeDetails } from './types';

// Core logic is now managed by custom hooks, promoting separation of concerns.
import { useTradeSettings } from './hooks/useTradeSettings';
import { useSignalData } from './hooks/useSignalData';
import { useTradeHistory } from './hooks/useTradeHistory';


/**
 * The main application component.
 * It's responsible for composing the UI, managing high-level UI state (like modals),
 * and orchestrating the flow of data between the custom hooks and the components.
 */
const App: React.FC = () => {
  // --- High-Level UI State ---
  const [selectedTimeframe, setSelectedTimeframe] = useState<AppTimeframeOption>(
    TIMEFRAMES.find(tf => tf.value === '2m') || TIMEFRAMES[0]
  );
  const [selectedPair, setSelectedPair] = useState<TradingPair>(SUPPORTED_PAIRS[0]);
  const [selectedTrade, setSelectedTrade] = useState<HistoricalTrade | null>(null);

  // --- Custom Hooks for Core Application Logic ---
  // Manages all user-configurable trade settings and calculates notional capital.
  const { settings, notionalCapital, handleSaveSettings } = useTradeSettings();
  
  // Fetches, processes, and provides all signal-related data.
  const { 
    dataWithChartMarkers,
    rawSignalData,
    isLoading,
    lastSignal,
    lastSignalDate,
    lastSignalPrice,
    statusText 
  } = useSignalData(selectedTimeframe, selectedPair, settings, notionalCapital);
  
  // Simulates and calculates the trade history based on signal data and settings.
  const tradeHistory = useTradeHistory(rawSignalData, settings, notionalCapital);

  // --- Alert State & Logic ---
  const [tradeAlertText, setTradeAlertText] = useState<string | null>(null);
  const [alertHistory, setAlertHistory] = useState<Alert[]>([]);
  const [isAlertHistoryVisible, setIsAlertHistoryVisible] = useState<boolean>(false);

  // --- UI Event Handlers ---
  const handleSelectTimeframe = (timeframe: AppTimeframeOption) => setSelectedTimeframe(timeframe);
  const handleSelectPair = (pair: TradingPair) => setSelectedPair(pair);
  const handleViewTradeDetail = (trade: HistoricalTrade) => setSelectedTrade(trade);
  const handleCloseTradeDetail = () => setSelectedTrade(null);

  // Effect to update the document title when the trading pair changes.
  useEffect(() => {
    document.title = `RedDot | ${selectedPair.symbol}`;
  }, [selectedPair]);

  // Effect to generate and display a trade alert when a new signal appears.
  useEffect(() => {
    if (rawSignalData.length < 2) return;

    const latestPoint = rawSignalData[rawSignalData.length - 1];
    const previousPoint = rawSignalData[rawSignalData.length - 2];

    // Trigger alert only on a new, changed signal.
    if (latestPoint.signal && latestPoint.signal !== 'HOLD' && latestPoint.signal !== previousPoint.signal) {
      const { riskModel, riskPercentage, fixedRiskAmount, leverage, capital } = settings;
      const riskValue = riskModel === 'percentage' ? riskPercentage : fixedRiskAmount;
      const tradeDetails: TradeDetails | null = calculateTradeDetails({
        entryPrice: latestPoint.close,
        signalType: latestPoint.signal,
        notionalCapital,
        realCapital: capital,
        riskModel,
        riskValue,
        leverage,
      });

      if (tradeDetails) {
        const alertText = formatTradeAlert(tradeDetails, latestPoint.close, latestPoint.signal, selectedPair);
        setTradeAlertText(alertText);
        setAlertHistory(prev => [{ id: latestPoint.time, text: alertText, timestamp: latestPoint.time }, ...prev]);
      }
    }
  }, [rawSignalData, settings, notionalCapital, selectedPair]);
  
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
            status={statusText}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
             <CryptoChart 
                key={`${selectedTimeframe.value}-${selectedPair.symbol}`}
                timeframe={selectedTimeframe.tradingView} 
                pair={selectedPair}
                data={dataWithChartMarkers}
              />
          </div>
          <div className="lg:col-span-1">
            <TradeSetupPanel 
              {...settings} // Spread all settings properties as props
              onSave={handleSaveSettings}
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
                allData={rawSignalData} // Pass raw data for context padding
                timeframe={selectedTimeframe}
            />
        )}
      </main>
    </div>
  );
};

export default App;
