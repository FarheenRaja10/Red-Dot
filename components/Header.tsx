import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
        RedDot
      </h1>
      <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
        An institution-level precision signals engine for BTC/USD and ETH/USD. RedDot locks onto momentum shifts with a dual-horizon model, routes them through a structural trend filter, and delivers execution-ready cues with volatility-adaptive smoothing and drawdown-aware risk gating. Built for low noise, near-zero lag, and dead-center entries, it highlights decisive breaks, confirms across regimes, and gets you out fast when the tide turns—no clutter, just clean targets for pro-desk execution.
      </p>
    </header>
  );
};