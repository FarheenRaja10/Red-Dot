
import React, { useState, useEffect, useMemo } from 'react';
import type { RiskModel, TradeSettings, TradeType } from '../types';
import { RISK_PERCENTAGES, LEVERAGE_OPTIONS } from '../constants';

interface TradeSetupPanelProps extends TradeSettings {
  onSave: (settings: TradeSettings) => void;
}

export const TradeSetupPanel: React.FC<TradeSetupPanelProps> = ({
  capital,
  marginPerTradeUsd,
  riskPercentage,
  riskModel,
  fixedRiskAmount,
  tradeType,
  leverage,
  trailingStopEnabled,
  trailingStopActivation,
  trailingStopDistance,
  onSave,
}) => {
  // Local draft state for the form inputs
  const [draftCapital, setDraftCapital] = useState(capital);
  const [draftMarginPerTradeUsd, setDraftMarginPerTradeUsd] = useState(marginPerTradeUsd);
  const [draftRiskPercentage, setDraftRiskPercentage] = useState(riskPercentage);
  const [draftRiskModel, setDraftRiskModel] = useState(riskModel);
  const [draftFixedRiskAmount, setDraftFixedRiskAmount] = useState(fixedRiskAmount);
  const [draftTradeType, setDraftTradeType] = useState<TradeType>(tradeType);
  const [draftLeverage, setDraftLeverage] = useState(leverage);
  const [draftTrailingStopEnabled, setDraftTrailingStopEnabled] = useState(trailingStopEnabled);
  const [draftTrailingStopActivation, setDraftTrailingStopActivation] = useState(trailingStopActivation);
  const [draftTrailingStopDistance, setDraftTrailingStopDistance] = useState(trailingStopDistance);
  
  const [isTrailingStopSectionOpen, setIsTrailingStopSectionOpen] = useState(trailingStopEnabled);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Sync local state if props change from parent
  useEffect(() => {
    setDraftCapital(capital);
    setDraftMarginPerTradeUsd(marginPerTradeUsd);
    setDraftRiskPercentage(riskPercentage);
    setDraftRiskModel(riskModel);
    setDraftFixedRiskAmount(fixedRiskAmount);
    setDraftTradeType(tradeType);
    setDraftLeverage(leverage);
    setDraftTrailingStopEnabled(trailingStopEnabled);
    setDraftTrailingStopActivation(trailingStopActivation);
    setDraftTrailingStopDistance(trailingStopDistance);
  }, [capital, marginPerTradeUsd, riskPercentage, riskModel, fixedRiskAmount, tradeType, leverage, trailingStopEnabled, trailingStopActivation, trailingStopDistance]);

  // Handle changing trade type and resetting leverage
  const handleTradeTypeChange = (newType: TradeType) => {
    setDraftTradeType(newType);
    setDraftLeverage(LEVERAGE_OPTIONS[newType][0].value);
  }

  const handleNumericInputChange = (setter: React.Dispatch<React.SetStateAction<number>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setter(isNaN(value) || value < 0 ? 0 : value);
  };
  
  const handleRiskPercentageChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = parseFloat(e.target.value);
    const sanitizedValue = isNaN(value) || value < 0 ? 0 : value > 100 ? 100 : value;
    setDraftRiskPercentage(sanitizedValue);
  };

  const hasChanges =
    draftCapital !== capital ||
    draftMarginPerTradeUsd !== marginPerTradeUsd ||
    draftRiskPercentage !== riskPercentage ||
    draftRiskModel !== riskModel ||
    draftFixedRiskAmount !== fixedRiskAmount ||
    draftTradeType !== tradeType ||
    draftLeverage !== leverage ||
    draftTrailingStopEnabled !== trailingStopEnabled ||
    draftTrailingStopActivation !== trailingStopActivation ||
    draftTrailingStopDistance !== trailingStopDistance;

  const handleSave = () => {
    setSaveStatus('saving');
    onSave({
      capital: draftCapital,
      marginPerTradeUsd: draftMarginPerTradeUsd,
      riskPercentage: draftRiskPercentage,
      riskModel: draftRiskModel,
      fixedRiskAmount: draftFixedRiskAmount,
      tradeType: draftTradeType,
      leverage: draftLeverage,
      trailingStopEnabled: draftTrailingStopEnabled,
      trailingStopActivation: draftTrailingStopActivation,
      trailingStopDistance: draftTrailingStopDistance,
    });
    
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const getSaveButtonText = () => {
    switch(saveStatus) {
      case 'saving': return 'Saving...';
      case 'saved': return '✓ Saved!';
      default: return 'Save Settings';
    }
  }

  const notionalCapital = useMemo(() => draftMarginPerTradeUsd * draftLeverage, [draftMarginPerTradeUsd, draftLeverage]);
  const currentLeverageOptions = LEVERAGE_OPTIONS[draftTradeType];
  
  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-2xl border border-gray-700 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4">
        Trade Setup &amp; Risk Management
      </h2>

      <div className="flex-grow space-y-6 overflow-y-auto pr-2">
        {/* Capital Input */}
        <div>
          <label htmlFor="capital" className="block text-sm font-medium text-gray-300 mb-2">
            Portfolio (USD)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">$</span>
            <input
              type="number"
              id="capital"
              name="capital"
              className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 pl-7 pr-4 text-white focus:ring-brand-blue focus:border-brand-blue"
              value={draftCapital}
              onChange={handleNumericInputChange(setDraftCapital)}
              min="0"
            />
          </div>
        </div>

        {/* Margin per Trade Input */}
        <div>
          <label htmlFor="marginPerTrade" className="block text-sm font-medium text-gray-300 mb-2">
            Margin per Trade (USD)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">$</span>
            <input
              type="number"
              id="marginPerTrade"
              name="marginPerTrade"
              className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 pl-7 pr-4 text-white focus:ring-brand-blue focus:border-brand-blue"
              value={draftMarginPerTradeUsd}
              onChange={handleNumericInputChange(setDraftMarginPerTradeUsd)}
              min="0"
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {draftCapital > 0 && draftMarginPerTradeUsd > 0
              ? `Using ${((draftMarginPerTradeUsd / draftCapital) * 100).toFixed(1)}% of your portfolio per trade.`
              : 'Set your portfolio and margin to see the allocation percentage.'}
          </p>
        </div>


        {/* Trade Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Trade Type</label>
          <div className="flex rounded-md shadow-sm">
            {(Object.keys(LEVERAGE_OPTIONS) as TradeType[]).map((type, index) => {
              const isFirst = index === 0;
              const isLast = index === (Object.keys(LEVERAGE_OPTIONS).length - 1);
              const labelMap = { spot: 'Spot', margin: 'Margin', contracts: 'Contracts' };
              
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTradeTypeChange(type)}
                  className={`flex-1 py-2 px-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue transition-colors
                    ${isFirst ? 'rounded-l-md' : ''} ${isLast ? 'rounded-r-md' : ''}
                    ${draftTradeType === type
                      ? 'bg-brand-blue text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                  {labelMap[type]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Leverage Selection */}
        <div>
          <label htmlFor="leverage" className="block text-sm font-medium text-gray-300 mb-2">Leverage</label>
          <select
            id="leverage"
            name="leverage"
            className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-brand-blue focus:border-brand-blue disabled:bg-gray-800 disabled:text-gray-500"
            value={draftLeverage}
            onChange={(e) => setDraftLeverage(Number(e.target.value))}
            disabled={currentLeverageOptions.length <= 1}
          >
            {currentLeverageOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Notional Capital Display */}
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600 text-center">
            <p className="text-sm font-medium text-gray-400">Notional Capital</p>
            <p className="text-3xl font-bold text-white my-1">${notionalCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-gray-500 font-mono">${draftMarginPerTradeUsd.toLocaleString()} (Margin) &times; {draftLeverage}x (Leverage)</p>
        </div>

        {/* Risk Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Risk Model</label>
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setDraftRiskModel('percentage')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue transition-colors
                ${draftRiskModel === 'percentage' ? 'bg-brand-blue text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              Risk per Capital (%)
            </button>
            <button
              type="button"
              onClick={() => setDraftRiskModel('fixed')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue transition-colors
                ${draftRiskModel === 'fixed' ? 'bg-brand-blue text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              Risk per Trade ($)
            </button>
          </div>
        </div>

        {/* Conditional Risk Input */}
        {draftRiskModel === 'percentage' ? (
          <div>
            <label htmlFor="riskPercentageInput" className="block text-sm font-medium text-gray-300 mb-2">Risk of Notional Capital (%)</label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input
                  type="number"
                  id="riskPercentageInput"
                  name="riskPercentageInput"
                  className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 pl-3 pr-10 text-white focus:ring-brand-blue focus:border-brand-blue"
                  value={draftRiskPercentage}
                  onChange={handleRiskPercentageChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">%</span>
              </div>
              <select
                id="riskPercentagePresets"
                aria-label="Risk Percentage Presets"
                className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:ring-brand-blue focus:border-brand-blue"
                value={draftRiskPercentage}
                onChange={handleRiskPercentageChange}
              >
                <option value="" disabled>Presets</option>
                {RISK_PERCENTAGES.map(p => <option key={p} value={p}>{p}%</option>)}
              </select>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              With ${notionalCapital.toLocaleString()} notional, a {draftRiskPercentage}% risk is ${((notionalCapital * draftRiskPercentage) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
            </p>
          </div>
        ) : (
          <div>
            <label htmlFor="fixedRisk" className="block text-sm font-medium text-gray-300 mb-2">Risk per Trade (USD)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">$</span>
              <input
                type="number"
                id="fixedRisk"
                name="fixedRisk"
                className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 pl-7 pr-4 text-white focus:ring-brand-blue focus:border-brand-blue"
                value={draftFixedRiskAmount}
                onChange={handleNumericInputChange(setDraftFixedRiskAmount)}
                min="0"
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">Risking a fixed amount of ${draftFixedRiskAmount.toLocaleString()} per trade, regardless of capital or leverage.</p>
          </div>
        )}

        {/* Trailing Stop Section - Accordion Style */}
        <div className="pt-6 border-t border-gray-700">
          <button
            type="button"
            onClick={() => setIsTrailingStopSectionOpen(!isTrailingStopSectionOpen)}
            className="w-full flex justify-between items-center text-left text-lg font-semibold text-white focus:outline-none"
            aria-expanded={isTrailingStopSectionOpen}
            aria-controls="trailing-stop-content"
          >
            <span>Trailing Stop Loss</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transform transition-transform duration-200 ${isTrailingStopSectionOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div
            id="trailing-stop-content"
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isTrailingStopSectionOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <label htmlFor="trailing-stop-toggle" className="text-sm font-medium text-gray-300 cursor-pointer">
                      Enable Trailing Stop Loss
                      <p className="text-xs text-gray-400 mt-1 max-w-xs">Automatically moves your stop loss to lock in profits.</p>
                  </label>
                  <button
                      type="button"
                      id="trailing-stop-toggle"
                      role="switch"
                      aria-checked={draftTrailingStopEnabled}
                      onClick={() => setDraftTrailingStopEnabled(!draftTrailingStopEnabled)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-gray-800 ${
                          draftTrailingStopEnabled ? 'bg-brand-blue' : 'bg-gray-600'
                      }`}
                  >
                      <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              draftTrailingStopEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                      />
                  </button>
              </div>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${draftTrailingStopEnabled ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="mt-4 space-y-4 pl-4 border-l-2 border-brand-blue/30">
                    <div>
                        <label htmlFor="activationProfit" className="block text-sm font-medium text-gray-300 mb-2">
                            Activation Profit (USD per Trade)
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">$</span>
                            <input type="number" id="activationProfit" name="activationProfit"
                                   className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 pl-7 pr-4 text-white focus:ring-brand-blue focus:border-brand-blue disabled:cursor-not-allowed disabled:bg-gray-800"
                                   value={draftTrailingStopActivation}
                                   onChange={handleNumericInputChange(setDraftTrailingStopActivation)}
                                   disabled={!draftTrailingStopEnabled} min="0" />
                        </div>
                        <p className="mt-2 text-xs text-gray-400">
                            Stop will trail after trade profit exceeds this amount.
                        </p>
                    </div>
                    <div>
                        <label htmlFor="trailingDistance" className="block text-sm font-medium text-gray-300 mb-2">
                            Trailing Distance (USD per Trade)
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">$</span>
                            <input type="number" id="trailingDistance" name="trailingDistance"
                                   className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 pl-7 pr-4 text-white focus:ring-brand-blue focus:border-brand-blue disabled:cursor-not-allowed disabled:bg-gray-800"
                                   value={draftTrailingStopDistance}
                                   onChange={handleNumericInputChange(setDraftTrailingStopDistance)}
                                   disabled={!draftTrailingStopEnabled} min="0" />
                        </div>
                        <p className="mt-2 text-xs text-gray-400">
                            How far the stop loss follows the peak price.
                        </p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-700">
        <p className="text-sm text-gray-400 mb-4">Click save to update the Trade History with your new settings.</p>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saveStatus !== 'idle'}
          className={`w-full py-3 px-4 text-base font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200
            ${!hasChanges || saveStatus !== 'idle'
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-brand-blue text-white hover:bg-brand-blue/80 focus:ring-brand-blue'
            }
            ${saveStatus === 'saved' ? '!bg-brand-green' : ''}
          `}
        >
          {getSaveButtonText()}
        </button>
      </div>
    </div>
  );
};
