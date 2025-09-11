import React from 'react';
import type { Alert } from '../types';

interface AlertHistoryModalProps {
  alerts: Alert[];
  onClose: () => void;
  onClear: () => void;
}

export const AlertHistoryModal: React.FC<AlertHistoryModalProps> = ({ alerts, onClose, onClear }) => {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 rounded-xl shadow-2xl border border-gray-600 w-full max-w-2xl flex flex-col h-[90vh] overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white text-center">Alert History</h2>
          {alerts.length > 0 && (
             <p className="text-center text-gray-400 text-sm mt-1">Showing {alerts.length} most recent alerts.</p>
          )}
        </div>

        <div className="flex-grow p-6 overflow-y-auto space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div key={alert.id} className="bg-gray-900/75 rounded-lg border border-gray-700 overflow-hidden">
                <div className="px-4 py-2 bg-gray-700/50">
                    <p className="text-xs text-gray-400 font-mono">
                        {new Date(alert.timestamp).toLocaleString()}
                    </p>
                </div>
                <pre className="p-4 text-white font-mono text-sm whitespace-pre-wrap">
                    {alert.text}
                </pre>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No alerts have been generated in this session.</p>
            </div>
          )}
        </div>

        <div className="bg-gray-700/50 px-6 py-4 flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear the alert history? This cannot be undone.')) {
                onClear();
              }
            }}
            disabled={alerts.length === 0}
            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-brand-red/50 bg-transparent px-4 py-2 text-base font-medium text-brand-red/80 shadow-sm hover:bg-brand-red/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear History
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-500 bg-transparent px-4 py-2 text-base font-medium text-gray-300 shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
