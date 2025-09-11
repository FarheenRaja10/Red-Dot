# RedDot: A Precision Signals Engine for Crypto Trading

![RedDot UI Screenshot](https://i.imgur.com/8Q9bJzW.png)

RedDot is an institution-level precision signals engine designed for BTC/USD and ETH/USD. It provides a real-time dashboard for traders to visualize signals from a momentum-based strategy, configure granular risk parameters, and instantly backtest the strategy's performance against historical data.

This document serves as a comprehensive guide to the application's features, trading strategy, and technical architecture.

---

### Table of Contents
1.  [The RedDot Strategy: Capturing Momentum](#-the-reddot-strategy-capturing-momentum)
2.  [Key Features](#-key-features)
3.  [Application Workflow](#-application-workflow)
4.  [Architecture & Code Deep Dive](#-architecture--code-deep-dive)
5.  [Technology Stack](#-technology-stack)
6.  [Disclaimer](#️-disclaimer)

---

## 📈 The RedDot Strategy: Capturing Momentum

The core philosophy of the RedDot strategy is to identify and capture momentum in trending markets while filtering out noise from sideways or "choppy" price action.

### Signal Generation Logic

The signal is generated through a two-step process to ensure accuracy:

1.  **Dual EMA Crossover:** The system first identifies a crossover between the fast **13-period EMA** and the slow **48-period EMA**. This indicates a potential shift in market momentum.
2.  **Momentum Confirmation:** A signal is only triggered on the *next* candle if the spread between the two EMAs widens. This confirms that the new momentum is accelerating, reducing false signals during periods of low conviction.
    -   **BUY Signal:** 13 EMA crosses *above* 48 EMA, and the distance between them increases.
    -   **SELL Signal:** 13 EMA crosses *below* 48 EMA, and the distance between them increases.

### Trade Management & Exits

The system employs a clear hierarchy of exit conditions to manage trades:

1.  **Primary Exit (Trend Reversal):** The main exit condition is a crossover in the opposite direction (13 EMA crossing back over the 48 EMA), signaling that the trend has likely ended.
2.  **Protective Exits (Stop Loss / Trailing Stop):** Each trade has a calculated initial stop loss. If enabled, a trailing stop will automatically move the stop loss to lock in profits as the trade moves favorably.
3.  **Systematic Exit (Opposing Signal):** An open position is automatically closed if a new, opposing signal is generated, ensuring the system is always aligned with the latest market signal.

---

## ✨ Key Features

-   **Real-Time Signal Dashboard:** Live BUY/SELL/HOLD signals for BTC/USD and ETH/USD across multiple timeframes.
-   **Interactive TradingView Chart:** A professional-grade chart that visualizes price action and overlays signal markers, entries, exits, and stop-loss levels.
-   **Dynamic Backtesting Engine:** The "Trade History" table instantly simulates the strategy's performance with your custom settings, providing immediate feedback on how risk parameters affect outcomes.
-   **Advanced Risk Management Panel:** Configure portfolio size, margin per trade, leverage, risk models (% vs. fixed $), and trailing stop parameters.
-   **Detailed Trade Analytics:** Click any historical trade to open a modal with a focused chart view and a detailed P/L breakdown for that specific trade.
-   **Instant Trade Alerts:** Execution-ready alerts are generated for new signals, containing all necessary parameters to place a trade.

---

## 🚀 Application Workflow

The dashboard is designed for an intuitive, cyclical workflow of analysis and configuration:

1.  **Configure Risk:** In the **"Trade Setup & Risk Management"** panel, set your portfolio size, margin, trade type (Spot/Margin/Contracts), leverage, and risk model.
2.  **Select Market:** At the top of the screen, choose a `Pair` (BTC/USD or ETH/USD) and a `Timeframe` (1m to 1H).
3.  **Analyze Performance:**
    -   Observe the current signal in the **Signal Indicator**.
    -   Review the **Trade History** table to see how your settings would have performed. Note the P/L, win rate, and exit reasons.
4.  **Review Trades:** Click any row in the history table to launch the **Trade Review** modal. This shows a dedicated chart for that trade's duration, helping you understand its context.
5.  **Refine & Repeat:** Adjust your risk settings in the panel. The Trade History will instantly update, allowing you to fine-tune your approach.

---

## 💻 Architecture & Code Deep Dive

The application is built with a modern React hooks-based architecture, emphasizing a clear separation of concerns between state management, business logic, API services, and UI components.

### Data Flow

The application follows a unidirectional data flow orchestrated by the main `App.tsx` component:

1.  **User Action:** A user changes a setting in the `TradeSetupPanel`.
2.  **State Update:** The `useTradeSettings` hook updates the application's settings state.
3.  **Data Re-computation:** `App.tsx` passes the new settings to the `useSignalData` and `useTradeHistory` hooks. These hooks re-run their memoized calculations:
    -   `useSignalData` recalculates stop-loss markers for the chart.
    -   `useTradeHistory` runs the entire backtest simulation from scratch with the new parameters.
4.  **UI Re-render:** React efficiently re-renders the components (`CryptoChart`, `SignalHistoryTable`) that depend on the new data, displaying the updated results.

### Core Logic: Custom Hooks (`/hooks`)

The application's "brain" is contained within three custom hooks:

-   `useTradeSettings.ts`: The single source of truth for all user-configurable parameters. It manages the state for the risk panel and computes the `notionalCapital`.
-   `useSignalData.ts`: The data fetching and processing layer. It handles API calls to CryptoCompare, polls for new data, adds indicators via `indicatorUtils`, and identifies the latest signal.
-   `useTradeHistory.ts`: The backtesting engine. It iterates through the signal data, simulates entries and exits based on the strategy rules and user settings, and calculates the P/L for each trade.

### UI Layer: Components (`/components`)

-   `App.tsx`: The top-level component that orchestrates the entire application. It initializes the custom hooks and passes state and data down to the child UI components.
-   `CryptoChart.tsx`: A sophisticated wrapper for the TradingView widget. It is responsible for rendering the main chart and dynamically drawing signal markers and detailed trade overlays (entry, exit, SL).
-   `TradeSetupPanel.tsx`: The primary form where users interact with and modify all risk and trade settings.
-   `SignalHistoryTable.tsx`: Displays the complex output of the `useTradeHistory` hook in a clean, paginated, and interactive table.
-   `TradeDetailModal.tsx`: A specialized view that combines the `CryptoChart` with statistical data to provide an in-depth review of a single historical trade.

### Services & Utilities

-   `services/cryptoService.ts`: Isolates all API communication with the CryptoCompare API, keeping data fetching logic separate from the application state.
-   `utils/indicatorUtils.ts` & `utils/tradeUtils.ts`: Contain pure, testable functions for the core business logic. `indicatorUtils` calculates EMAs and signals, while `tradeUtils` calculates position sizes, stop-loss/take-profit levels, and formats trade alerts.

---

## 🛠️ Technology Stack

-   **Frontend Framework:** React with TypeScript
-   **Styling:** Tailwind CSS
-   **Charting Library:** TradingView Widget
-   **Data Source:** CryptoCompare API
-   **Architecture:** Component-based with custom React Hooks for state management and logic separation.

---

## ⚠️ Disclaimer

This is a trading tool for educational and informational purposes only. It is **not financial advice**. Trading cryptocurrency involves significant risk of loss. All strategy performance shown is based on historical data and is not indicative of future results. Always conduct your own research and consult with a qualified financial advisor before making any investment decisions.
