import React from 'react';
// Fix: Corrected import to get type from types.ts and constant from constants.ts
import type { AppTimeframeOption } from '../types';
import { TIMEFRAMES } from '../constants';

interface TimeframeSelectorProps {
  selectedTimeframe: AppTimeframeOption;
  onSelectTimeframe: (timeframe: AppTimeframeOption) => void;
  disabled: boolean;
}

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({ selectedTimeframe, onSelectTimeframe, disabled }) => {
  return (
    <div className="flex items-center justify-center space-x-2 bg-gray-900/50 p-2 rounded-lg">
      <span className="text-sm font-medium text-gray-400 mr-2">Timeframe:</span>
      {TIMEFRAMES.map((timeframe) => (
        <button
          key={timeframe.value}
          onClick={() => onSelectTimeframe(timeframe)}
          disabled={disabled}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue
            ${selectedTimeframe.value === timeframe.value
              ? 'bg-brand-blue text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed'
            }
          `}
        >
          {timeframe.label}
        </button>
      ))}
    </div>
  );
};
