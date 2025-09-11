import React from 'react';
import type { HistoricalTrade } from '../types';

interface TradeTimelineProps {
  trade: HistoricalTrade;
}

export const TradeTimeline: React.FC<TradeTimelineProps> = ({ trade }) => {
  const isOpen = !trade.exitSignal;
  const isProfit = (trade.profitOrLoss ?? 0) >= 0;
  
  const lineColor = isOpen ? 'bg-gray-500' : isProfit ? 'bg-brand-green' : 'bg-brand-red';

  const InfoBlock: React.FC<{ title: string; time?: number; price?: number; isProgress?: boolean }> = ({ title, time, price, isProgress }) => (
    <div className="text-center p-4 rounded-lg bg-gray-900/75 min-w-[220px] border border-gray-700">
      <p className="text-lg font-bold text-white uppercase">{title}</p>
      {isProgress ? (
         <p className="text-sm text-gray-400 italic mt-2">Position is currently open</p>
      ) : (
        <>
          <p className="text-sm text-gray-400 font-mono mt-2">{new Date(time!).toLocaleString()}</p>
          <p className="text-md text-white font-mono mt-1">${price!.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="flex items-center w-full">
        <InfoBlock 
          title="Entry"
          time={trade.entrySignal.time}
          price={trade.entrySignal.close}
        />
        
        <div className="flex-grow flex items-center justify-center relative mx-4 h-12">
          <div className={`w-full h-1 ${lineColor} rounded-full`}></div>
           {!isOpen && (
               <div className="absolute left-1/2 -translate-x-1/2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-600 whitespace-nowrap text-center">
                  <p className={`text-md font-bold ${isProfit ? 'text-brand-green' : 'text-brand-red'}`}>
                    {isProfit ? '+' : ''}{(trade.profitOrLoss ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className={`text-xs font-semibold mt-1 ${isProfit ? 'text-brand-green' : 'text-brand-red'}`}>
                    ({isProfit ? '+' : ''}{(trade.profitOrLossPercentage ?? 0).toFixed(2)}%)
                  </p>
               </div>
            )}
        </div>

        <InfoBlock 
          title={isOpen ? "In Progress" : "Exit"}
          time={trade.exitSignal?.time}
          price={trade.exitSignal?.close}
          isProgress={isOpen}
        />
      </div>
    </div>
  );
};
