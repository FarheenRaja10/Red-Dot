import type { RiskModel, TradeDetails, TradingPair } from '../types';
import { RISK_REWARD_RATIO } from '../constants';

interface TradeCalculationParams {
  entryPrice: number;
  signalType: 'BUY' | 'SELL';
  notionalCapital: number;
  realCapital: number;
  riskModel: RiskModel;
  riskValue: number;
  leverage: number;
}

export const calculateTradeDetails = ({
  entryPrice,
  signalType,
  notionalCapital,
  realCapital,
  riskModel,
  riskValue,
  leverage,
}: TradeCalculationParams): TradeDetails | null => {
  // Basic validation
  if (realCapital <= 0 || riskValue <= 0 || notionalCapital <= 0 || entryPrice <= 0 || leverage <= 0) {
      return null;
  }

  // 1. Calculate the risk amount in USD
  let riskAmountInUSD: number;
  if (riskModel === 'percentage') {
      // Risk percentage is of NOTIONAL capital
      riskAmountInUSD = notionalCapital * (riskValue / 100);
  } else { // 'fixed'
      riskAmountInUSD = riskValue;
  }

  // 2. Sanity check: cannot risk more than total REAL capital
  if (riskAmountInUSD > realCapital) {
      console.warn(`Risk amount ($${riskAmountInUSD.toFixed(2)}) cannot be greater than total real capital ($${realCapital.toFixed(2)}). Adjusting risk to real capital size.`);
      riskAmountInUSD = realCapital;
  }
  
  // 3. Calculate position size based on notional capital
  const positionSizeInBase = notionalCapital / entryPrice;
  const positionSizeInUSD = notionalCapital; // By definition

  // 4. Calculate stop-loss distance based on risk amount and position size
  if (positionSizeInBase === 0) {
      return null; // Avoid division by zero
  }
  const stopDistance = riskAmountInUSD / positionSizeInBase;

  // 5. Calculate stop loss and take profit prices
  let stopLoss: number;
  let takeProfit: number;

  if (signalType === 'BUY') {
      stopLoss = entryPrice - stopDistance;
      takeProfit = entryPrice + stopDistance * RISK_REWARD_RATIO;
  } else { // 'SELL'
      stopLoss = entryPrice + stopDistance;
      takeProfit = entryPrice - stopDistance * RISK_REWARD_RATIO;
  }

  // Ensure stop loss is a valid price
  if (stopLoss <= 0) {
      console.warn("Calculated stop loss is zero or negative. Invalid trade.");
      return null;
  }

  return {
    takeProfit,
    stopLoss,
    positionSizeInBase,
    positionSizeInUSD,
    riskAmountInUSD,
    leverage,
  };
};

export const formatTradeAlert = (
  details: TradeDetails,
  entryPrice: number,
  signalType: 'BUY' | 'SELL',
  pair: TradingPair
): string => {
    const position = signalType === 'BUY' ? 'Buy (Open Long) 📈' : 'Sell (Open Short) 📉';

    return `
🚨 ${pair.symbol} Trade Alert 🚨

🔹 Pair: ${pair.symbol}
🔹 Position: ${position}
🔹 Leverage: ${details.leverage}x
🔹 Entry: Market Price (~$${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
🎯 Take Profit: $${details.takeProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
🛑 Stop Loss: $${details.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
📊 Position Size: ${details.positionSizeInBase.toFixed(6)} ${pair.base} (~$${details.positionSizeInUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})

⚠️ Risk Disclaimer: Crypto trading is highly volatile. Only invest what you can afford to lose. Stay focused, stay disciplined, and ride the waves wisely! 💼🚀📊
    `.trim();
};