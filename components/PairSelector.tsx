import React from 'react';
import type { TradingPair } from '../types';
import { SUPPORTED_PAIRS } from '../constants';

interface PairSelectorProps {
  selectedPair: TradingPair;
  onSelectPair: (pair: TradingPair) => void;
  disabled: boolean;
}

export const PairSelector: React.FC<PairSelectorProps> = ({ selectedPair, onSelectPair, disabled }) => {
  return (
    <div className="flex items-center justify-center space-x-2 bg-gray-900/50 p-2 rounded-lg">
      <span className="text-sm font-medium text-gray-400 mr-2">Pair:</span>
      {SUPPORTED_PAIRS.map((pair) => (
        <button
          key={pair.symbol}
          onClick={() => onSelectPair(pair)}
          disabled={disabled}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue
            ${selectedPair.symbol === pair.symbol
              ? 'bg-brand-blue text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed'
            }
          `}
        >
          {pair.symbol}
        </button>
      ))}
    </div>
  );
};
