import type { AppTimeframeOption, TradingPair, TradeType } from './types';

export const EMA_PERIOD_FAST = 13;
export const EMA_PERIOD_SLOW = 48;
export const EMA_PERIOD_TREND = 200;

export const RISK_PERCENTAGES: number[] = [0.5, 1, 1.5, 2, 2.5, 5];

export const RISK_REWARD_RATIO = 2; // e.g., 2:1 risk/reward

export const SUPPORTED_PAIRS: TradingPair[] = [
  { base: 'BTC', quote: 'USD', symbol: 'BTC/USD', tradingViewSymbol: 'COINBASE:BTCUSD' },
  { base: 'ETH', quote: 'USD', symbol: 'ETH/USD', tradingViewSymbol: 'COINBASE:ETHUSD' },
];

export const TIMEFRAMES: AppTimeframeOption[] = [
  { label: '1m', value: '1m', cryptoCompareEndpoint: 'histominute', aggregate: 1, days: 3, tradingView: '1', pollInterval: 20000 },
  { label: '2m', value: '2m', cryptoCompareEndpoint: 'histominute', aggregate: 2, days: 4, tradingView: '2', pollInterval: 25000 },
  { label: '5m', value: '5m', cryptoCompareEndpoint: 'histominute', aggregate: 5, days: 5, tradingView: '5', pollInterval: 30000 },
  { label: '15m', value: '15m', cryptoCompareEndpoint: 'histominute', aggregate: 15, days: 10, tradingView: '15', pollInterval: 45000 },
  { label: '30m', value: '30m', cryptoCompareEndpoint: 'histominute', aggregate: 30, days: 15, tradingView: '30', pollInterval: 60000 },
  { label: '1H', value: '1H', cryptoCompareEndpoint: 'histohour', aggregate: 1, days: 30, tradingView: '60', pollInterval: 120000 },
];

export const CRYPTOCOMPARE_API_URL = 'https://min-api.cryptocompare.com/data/v2/';

export const LEVERAGE_OPTIONS: { [key in TradeType]: { label: string; value: number }[] } = {
  spot: [
    { label: '1x (None)', value: 1 },
  ],
  margin: [
    { label: '3x', value: 3 },
    { label: '5x', value: 5 },
    { label: '10x', value: 10 },
  ],
  contracts: [
    { label: '20x', value: 20 },
    { label: '50x', value: 50 },
    { label: '100x', value: 100 },
  ],
};