import React, { useState } from 'react';

interface TradeAlertModalProps {
  alertText: string;
  onClose: () => void;
}

export const TradeAlertModal: React.FC<TradeAlertModalProps> = ({ alertText, onClose }) => {
  const [copyButtonText, setCopyButtonText] = useState('Copy Alert');

  const handleCopy = () => {
    navigator.clipboard.writeText(alertText).then(() => {
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy Alert'), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      setCopyButtonText('Copy Failed');
      setTimeout(() => setCopyButtonText('Copy Alert'), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl border border-brand-blue w-full max-w-lg overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white text-center">🚨 New Trade Signal! 🚨</h2>
          <pre className="mt-4 bg-gray-900 p-4 rounded-lg text-white font-mono text-sm whitespace-pre-wrap overflow-x-auto">
            {alertText}
          </pre>
        </div>
        <div className="bg-gray-700/50 px-6 py-4 flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent bg-brand-blue px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-brand-blue/80 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            {copyButtonText}
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-500 bg-transparent px-4 py-2 text-base font-medium text-gray-300 shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
