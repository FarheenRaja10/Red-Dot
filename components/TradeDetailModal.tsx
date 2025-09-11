import React, { useMemo } from 'react';
import { CryptoChart } from './CryptoChart';
import type { HistoricalTrade, TradingPair, ChartDataPoint, AppTimeframeOption } from '../types';

interface TradeDetailModalProps {
  trade: HistoricalTrade;
  pair: TradingPair;
  allData: ChartDataPoint[];
  timeframe: AppTimeframeOption;
  onClose: () => void;
}

export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({ trade, pair, allData, timeframe, onClose }) => {
  const StatItem: React.FC<{ label: string; value: string | React.ReactNode; className?: string }> = ({ label, value, className = '' }) => (
    <div className={`flex-1 min-w-[150px] bg-gray-900/50 p-3 rounded-lg ${className}`}>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
  
  const chartDataForTrade = useMemo(() => {
    const entryIndex = allData.findIndex(d => d.time === trade.entrySignal.time);
    if (entryIndex === -1) return [];

    let exitIndex = trade.exitSignal ? allData.findIndex(d => d.time === trade.exitSignal!.time) : allData.length -1;
    if (exitIndex === -1) exitIndex = allData.length - 1;

    // Add some padding to the chart to see context before and after the trade
    const padding = 20;
    const startIndex = Math.max(0, entryIndex - padding);
    const endIndex = Math.min(allData.length, exitIndex + padding + 1);

    return allData.slice(startIndex, endIndex);

  }, [allData, trade]);

  const isOpen = !trade.exitSignal;
  const isProfit = (trade.profitOrLoss ?? 0) >= 0;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl border border-gray-600 w-full max-w-4xl flex flex-col max-h-[95vh] transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Trade Review</h2>
            <p className={`text-sm font-semibold ${trade.type === 'BUY' ? 'text-brand-green' : 'text-brand-red'}`}>
              {pair.symbol} &ndash; {trade.type}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto">
            <div className="flex flex-wrap gap-4 mb-6">
                <StatItem label="Entry Date" value={new Date(trade.entrySignal.time).toLocaleString()} />
                <StatItem label="Entry Price" value={`$${trade.entrySignal.close.toLocaleString()}`} />
                <StatItem 
                    label="Exit Date" 
                    value={trade.exitSignal ? new Date(trade.exitSignal.time).toLocaleString() : <span className="italic text-gray-400">Open</span>} 
                />
                <StatItem 
                    label="Exit Price" 
                    value={trade.exitSignal ? `$${trade.exitSignal.close.toLocaleString()}`: <span className="italic text-gray-400">In Progress</span>} 
                />
                 <StatItem
                    label={isOpen ? "Unrealized P/L" : "Realized P/L"}
                    value={
                        <span className={isProfit ? 'text-brand-green' : 'text-brand-red'}>
                        {isProfit ? '+' : ''}{(trade.profitOrLoss ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    }
                />
                <StatItem
                    label="P/L %"
                    value={
                        <span className={isProfit ? 'text-brand-green' : 'text-brand-red'}>
                            {isProfit ? '+' : ''}{(trade.profitOrLossPercentage ?? 0).toFixed(2)}%
                        </span>
                    }
                />
            </div>
            
             <CryptoChart 
                key={`trade-review-${trade.entrySignal.time}`}
                timeframe={timeframe.tradingView} 
                pair={pair}
                data={chartDataForTrade}
                tradeToHighlight={trade}
              />
        </div>
      </div>
    </div>
  );
};
