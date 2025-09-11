import { useState, useMemo } from 'react';
import type { TradeSettings } from '../types';

/**
 * The initial state for trade settings, used on component mount.
 */
const initialSettings: TradeSettings = {
  capital: 24000,
  marginPerTradeUsd: 6000,
  riskPercentage: 1,
  riskModel: 'fixed',
  fixedRiskAmount: 1500,
  tradeType: 'contracts',
  leverage: 100,
  trailingStopEnabled: true,
  trailingStopActivation: 1500,
  trailingStopDistance: 500,
};

/**
 * A custom hook to manage the state and logic for user-configurable trade settings.
 * It centralizes all settings state, provides a single method for updates,
 * and computes derived values like notional capital.
 * @returns An object containing the current settings, the calculated notional capital,
 *          and a handler to save updated settings.
 */
export const useTradeSettings = () => {
  const [settings, setSettings] = useState<TradeSettings>(initialSettings);
  
  /**
   * Memoized calculation of notional capital based on the current margin, leverage, and trade type.
   * For 'spot' trading, leverage is effectively 1x.
   */
  const notionalCapital = useMemo(() => {
    if (settings.tradeType === 'spot') {
        return settings.marginPerTradeUsd;
    }
    return settings.marginPerTradeUsd * settings.leverage;
  }, [settings.marginPerTradeUsd, settings.leverage, settings.tradeType]);

  /**
   * Callback to update the entire settings object.
   * This is passed to the TradeSetupPanel.
   * @param {TradeSettings} newSettings - The new settings object from the setup panel.
   */
  const handleSaveSettings = (newSettings: TradeSettings) => {
    setSettings(newSettings);
  };

  return {
    settings,
    notionalCapital,
    handleSaveSettings,
  };
};
