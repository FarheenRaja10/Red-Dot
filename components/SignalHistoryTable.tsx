import React, { useState, useMemo } from 'react';
import type { HistoricalTrade, TradingPair } from '../types';

interface SignalHistoryTableProps {
  trades: HistoricalTrade[];
  pair: TradingPair;
  onViewTrade: (trade: HistoricalTrade) => void;
}

const ITEMS_PER_PAGE = 10;

export const SignalHistoryTable: React.FC<SignalHistoryTableProps> = ({ trades, pair, onViewTrade }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Show most recent trades first, memoized for performance
  const reversedTrades = useMemo(() => [...trades].reverse(), [trades]);

  const totalPages = Math.ceil(reversedTrades.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTrades = reversedTrades.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="mt-4 flex items-center justify-center space-x-3">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
          className="px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          &larr; Previous
        </button>
        <span className="text-gray-400 text-sm font-mono">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
          className="px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          Next &rarr;
        </button>
      </div>
    );
  };

  const getExitReasonBadge = (reason: HistoricalTrade['exitReason']) => {
    switch (reason) {
      case 'Reversal':
        return 'bg-purple-500/20 text-purple-300';
      case 'Trailing Stop':
        return 'bg-green-500/20 text-green-300';
      case 'Stop Loss':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };


  return (
    <div className="mt-8 bg-gray-800 p-4 sm:p-6 rounded-xl shadow-2xl border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-4">Trade History (Includes Open Position)</h2>
      <div className="overflow-x-auto">
        {reversedTrades.length > 0 ? (
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-900/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-3">Symbol</th>
                <th className="p-3">Type</th>
                <th className="p-3">Entry Date</th>
                <th className="p-3 text-right">Position Size ({pair.base})</th>
                <th className="p-3 text-right">Entry Price</th>
                <th className="p-3 text-right">Initial SL</th>
                <th className="p-3 text-right">Exit Price</th>
                <th className="p-3">Exit Date</th>
                <th className="p-3 whitespace-nowrap">Exit Reason</th>
                <th className="p-3 text-right">P/L (USD)</th>
                <th className="p-3 text-right">P/L (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 font-mono">
              {paginatedTrades.map((trade) => {
                const isOpen = !trade.exitSignal;
                const isProfit = (trade.profitOrLoss ?? 0) >= 0;
                return (
                  <tr 
                    key={trade.entrySignal.time} 
                    className={`cursor-pointer transition-colors duration-150 hover:bg-gray-700/50 ${isOpen ? 'bg-blue-900/20' : ''}`}
                    onClick={() => onViewTrade(trade)}
                    role="button"
                    aria-label={`View details for ${trade.type} trade entered at ${new Date(trade.entrySignal.time).toLocaleString()}`}
                  >
                    <td className="p-3 font-sans font-semibold">{pair.symbol}</td>
                    <td className="p-3 font-sans font-medium">
                      <span className={trade.type === 'BUY' ? 'text-brand-green' : 'text-brand-red'}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="p-3">{new Date(trade.entrySignal.time).toLocaleString()}</td>
                    <td className="p-3 text-right">{trade.positionSizeInBase.toFixed(6)}</td>
                    <td className="p-3 text-right">${trade.entrySignal.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right">${trade.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right">
                      {isOpen ? (
                        <span className="italic text-gray-400">In Progress</span>
                      ) : (
                        `$${trade.exitSignal!.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      )}
                    </td>
                    <td className="p-3">
                      {isOpen ? (
                        <span className="italic text-gray-400">-</span>
                      ) : (
                        new Date(trade.exitSignal!.time).toLocaleString()
                      )}
                    </td>
                    <td className="p-3 font-sans whitespace-nowrap">
                      {isOpen ? (
                        <span className="italic text-gray-400">Open</span>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getExitReasonBadge(trade.exitReason)}`}>
                          {trade.exitReason || 'Closed'}
                        </span>
                      )}
                    </td>
                    <td className={`p-3 text-right font-semibold ${isProfit ? 'text-brand-green' : 'text-brand-red'}`}>
                      {isOpen && <span className="text-xs italic text-gray-400 mr-1">(Unrealized)</span>}
                      {isProfit ? '+' : ''}{(trade.profitOrLoss ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-right font-semibold ${isProfit ? 'text-brand-green' : 'text-brand-red'}`}>
                      {isProfit ? '+' : ''}{(trade.profitOrLossPercentage ?? 0).toFixed(2)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-400 py-4">No completed trades for this timeframe yet.</p>
        )}
      </div>
      <PaginationControls />
    </div>
  );
};