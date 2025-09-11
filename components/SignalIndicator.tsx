import React from 'react';
import type { Signal } from '../types';

interface SignalIndicatorProps {
  signal: Signal;
  date: number | null;
  price: number | null;
  status?: string;
}

export const SignalIndicator: React.FC<SignalIndicatorProps> = ({ signal, date, price, status }) => {
  const signalConfig = {
    BUY: {
      bgColor: 'bg-brand-green/10',
      borderColor: 'border-brand-green',
      textColor: 'text-brand-green',
      dotColor: 'bg-brand-green',
      text: 'BUY',
    },
    SELL: {
      bgColor: 'bg-brand-red/10',
      borderColor: 'border-brand-red',
      textColor: 'text-brand-red',
      dotColor: 'bg-brand-red',
      text: 'SELL',
    },
    HOLD: {
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500',
      textColor: 'text-gray-400',
      dotColor: 'bg-gray-500',
      text: 'HOLD',
    },
  };

  const config = signalConfig[signal];

  return (
    <div className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor} flex flex-col sm:flex-row items-center justify-between`}>
      <div className="flex items-center">
        <div className={`w-4 h-4 rounded-full ${config.dotColor} mr-3`}></div>
        <span className={`text-2xl font-bold ${config.textColor}`}>
          CURRENT SIGNAL: {config.text}
        </span>
      </div>
      <div className="text-right mt-2 sm:mt-0">
        {signal !== 'HOLD' && date && price ? (
          <>
            <p className="text-sm text-gray-300">Last Signal Triggered</p>
            <p className="font-mono text-white">{new Date(date).toLocaleString()} at ${price.toFixed(2)}</p>
          </>
        ) : (
           <p className="font-mono text-gray-400">{status || 'Awaiting Crossover'}</p>
        )}
      </div>
    </div>
  );
};