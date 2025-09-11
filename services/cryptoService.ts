import type { PriceData, AppTimeframeOption, TradingPair } from '../types';
import {
  CRYPTOCOMPARE_API_URL,
  EMA_PERIOD_TREND
} from '../constants';

export const getHistoricalData = async (timeframe: AppTimeframeOption, pair: TradingPair): Promise<PriceData[]> => {
  // CryptoCompare's API has a limit of 2000 data points per request.
  const limit = 2000;

  const url = new URL(`${CRYPTOCOMPARE_API_URL}${timeframe.cryptoCompareEndpoint}`);
  url.searchParams.append('fsym', pair.base);
  url.searchParams.append('tsym', pair.quote);
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('aggregate', timeframe.aggregate.toString());

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API error response body:", errorBody);
      throw new Error(`Network response was not ok. Status: ${response.status}`);
    }
    const apiResponse = await response.json();

    if (apiResponse.Response === 'Error') {
        throw new Error(`CryptoCompare API Error: ${apiResponse.Message}`);
    }

    // CryptoCompare data format: { Data: { Data: [{ time, open, ... }] } }
    const formattedData: PriceData[] = apiResponse.Data.Data.map((d: any) => ({
      time: d.time * 1000, // Convert UNIX timestamp in seconds to milliseconds
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    
    // Filter out data points with zero values, which can sometimes appear
    const cleanData = formattedData.filter(d => d.open && d.high && d.low && d.close);

    if (cleanData.length < EMA_PERIOD_TREND) {
        console.warn(`Fetched only ${cleanData.length} data points, which is less than the longest EMA period (${EMA_PERIOD_TREND}). Trend calculations may be inaccurate.`);
    }

    return cleanData;

  } catch (error) {
    console.error("Error fetching historical crypto data:", error);
    // Provide a more user-friendly error message for the UI
    throw new Error('Failed to fetch historical data. The CryptoCompare API may be temporarily unavailable.');
  }
};
