import { useEffect, useMemo, useRef, useState } from "react";

// Use our backend proxy to avoid CORS issues
const API_BASE_URL = "/api/yahoo";
const quoteCache = new Map<string, YahooQuote>();
const quotePromises = new Map<string, Promise<YahooQuote>>();
const candleCache = new Map<string, YahooChartResult>();
const candlePromises = new Map<string, Promise<YahooChartResult>>();

interface YahooQuote {
  regularMarketPrice: number;
  regularMarketChange: number | null;
  regularMarketChangePercent: number | null;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketOpen: number;
  regularMarketPreviousClose: number;
}

interface YahooChartResult {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        regularMarketChange: number;
        regularMarketChangePercent: number;
        regularMarketDayHigh: number;
        regularMarketDayLow: number;
        regularMarketOpen: number;
        regularMarketPreviousClose: number;
        currency: string;
        symbol: string;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          close: number[];
          high: number[];
          low: number[];
          open: number[];
          volume: number[];
        }>;
      };
    }>;
    error: any;
  };
}

// Convert symbol format for Yahoo Finance
function convertSymbol(symbol: string): string {
  // For crypto, Yahoo Finance uses different formats
  if (symbol.includes("BINANCE:")) {
    const crypto = symbol.split(":")[1];
    // Convert BTCUSDT to BTC-USD format
    if (crypto.includes("USDT")) {
      return crypto.replace("USDT", "-USD");
    }
    return crypto;
  }
  // For stocks, use as-is
  return symbol;
}

async function requestYahooQuote(yahooSymbol: string): Promise<YahooQuote> {
  const url = `${API_BASE_URL}/quote/${yahooSymbol}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch quote (${response.status}) ${errorText || ""}`.trim(),
    );
  }

  const data: YahooChartResult = await response.json();

  if (data.chart.error) {
    throw new Error(
      data.chart.error.description || "Yahoo Finance API error",
    );
  }

  if (!data.chart.result?.length) {
    throw new Error("No data returned from Yahoo Finance");
  }

  const result = data.chart.result[0];
  const meta = result.meta;

  if (!meta || typeof meta.regularMarketPrice !== "number") {
    throw new Error("Invalid quote data received");
  }

  const previousClose =
    meta.regularMarketPreviousClose ??
    (meta as any).chartPreviousClose ??
    (meta as any).previousClose ??
    (meta as any).previousClosePrice ??
    null;

  let change: number | null =
    meta.regularMarketChange ??
    (meta as any).change ??
    (meta as any).regularMarketChangeRaw ??
    null;

  let changePercent: number | null =
    meta.regularMarketChangePercent ??
    (meta as any).changePercent ??
    (meta as any).regularMarketChangePercentRaw ??
    null;

  const needsCalculation =
    (change === null || change === undefined || isNaN(change)) &&
    previousClose &&
    previousClose > 0 &&
    meta.regularMarketPrice;

  if (needsCalculation) {
    change = meta.regularMarketPrice - previousClose;
    changePercent = (change / previousClose) * 100;
  }

  if (
    !previousClose &&
    result.indicators?.quote?.[0]?.close?.length
  ) {
    const firstClose = result.indicators.quote[0].close[0];
    if (firstClose && firstClose > 0 && meta.regularMarketPrice) {
      const calculatedChange = meta.regularMarketPrice - firstClose;
      const calculatedChangePercent = (calculatedChange / firstClose) * 100;
      if (change === null || change === undefined || isNaN(change)) {
        change = calculatedChange;
        changePercent = calculatedChangePercent;
      }
    }
  }

  if (
    change !== null &&
    change !== undefined &&
    (isNaN(change) || !isFinite(change))
  ) {
    change = null;
  }
  if (
    changePercent !== null &&
    changePercent !== undefined &&
    (isNaN(changePercent) || !isFinite(changePercent))
  ) {
    changePercent = null;
  }

  return {
    regularMarketPrice: meta.regularMarketPrice ?? 0,
    regularMarketChange: change ?? null,
    regularMarketChangePercent: changePercent ?? null,
    regularMarketDayHigh: meta.regularMarketDayHigh ?? 0,
    regularMarketDayLow: meta.regularMarketDayLow ?? 0,
    regularMarketOpen: meta.regularMarketOpen ?? 0,
    regularMarketPreviousClose: previousClose ?? 0,
  };
}

async function loadYahooQuote(yahooSymbol: string, bypassCache: boolean = false): Promise<YahooQuote> {
  // Bypass cache if requested (for live updates)
  if (!bypassCache && quoteCache.has(yahooSymbol)) {
    return quoteCache.get(yahooSymbol)!;
  }
  
  // If there's already a pending request, wait for it
  if (quotePromises.has(yahooSymbol)) {
    return quotePromises.get(yahooSymbol)!;
  }

  const promise = requestYahooQuote(yahooSymbol)
    .then((quote) => {
      quoteCache.set(yahooSymbol, quote);
      quotePromises.delete(yahooSymbol);
      return quote;
    })
    .catch((error) => {
      quotePromises.delete(yahooSymbol);
      throw error;
    });

  quotePromises.set(yahooSymbol, promise);
  return promise;
}

interface QuoteState {
  data: YahooQuote | null;
  isLoading: boolean;
  error: Error | null;
}

export function useYahooQuote(
  symbol: string,
  enabled: boolean = true,
  autoRefresh: boolean = true,
) {
  const yahooSymbol = useMemo(() => convertSymbol(symbol), [symbol]);
  const [state, setState] = useState<QuoteState>({
    data: null,
    isLoading: Boolean(enabled && symbol),
    error: null,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !yahooSymbol) {
      return;
    }

    let cancelled = false;

    async function fetchQuote(bypassCache: boolean = false) {
      if (cancelled || !mountedRef.current) return;

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        // For live updates, bypass cache to get fresh data
        const data = await loadYahooQuote(yahooSymbol, bypassCache);
        
        if (!cancelled && mountedRef.current) {
          setState({
            data,
            isLoading: false,
            error: null,
          });
        }
      } catch (error: any) {
        if (!cancelled && mountedRef.current) {
          setState({
            data: null,
            isLoading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    }

    // Initial fetch
    fetchQuote(false);

    // Set up auto-refresh every 3 seconds - balance between live updates and performance
    let refreshInterval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        if (!cancelled && mountedRef.current && enabled) {
          fetchQuote(true); // Bypass cache for live updates
        }
      }, 3000); // 3 seconds - reduces flickering while maintaining live feel
    }

    return () => {
      cancelled = true;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [enabled, yahooSymbol, autoRefresh]);

  return state;
}

const intervalMap: Record<string, string> = {
  "60": "1h",
  "240": "4h",
  D: "1d",
  W: "1wk",
};

// Map intervals to appropriate ranges for Yahoo Finance API
const rangeMap: Record<string, string> = {
  "1m": "1d",
  "2m": "1d",
  "5m": "1d",
  "15m": "5d",
  "30m": "1mo",
  "60m": "1mo",
  "90m": "1mo",
  "1h": "1mo",
  "4h": "3mo",
  "1d": "1y",
  "5d": "2y",
  "1wk": "2y",
  "1mo": "5y",
};

async function requestYahooCandles(
  yahooSymbol: string,
  yahooInterval: string,
  yahooRange: string,
): Promise<YahooChartResult> {
  const url = `${API_BASE_URL}/candles/${yahooSymbol}?interval=${yahooInterval}&range=${yahooRange}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch candles (${response.status}) ${errorText || ""}`.trim(),
    );
  }

  const data: YahooChartResult = await response.json();

  if (data.chart.error) {
    throw new Error(
      data.chart.error.description || "Yahoo Finance API error",
    );
  }

  if (!data.chart.result?.length) {
    throw new Error("No data returned from Yahoo Finance");
  }

  return data;
}

function candlesKey(symbol: string, interval: string, range: string) {
  return `${symbol}__${interval}__${range}`;
}

async function loadYahooCandles(
  yahooSymbol: string,
  yahooInterval: string,
  yahooRange: string,
  bypassCache: boolean = false,
): Promise<YahooChartResult> {
  const key = candlesKey(yahooSymbol, yahooInterval, yahooRange);
  
  // Bypass cache if requested (for live updates)
  if (!bypassCache && candleCache.has(key)) {
    return candleCache.get(key)!;
  }
  
  // If there's already a pending request, wait for it
  if (candlePromises.has(key)) {
    return candlePromises.get(key)!;
  }

  const promise = requestYahooCandles(
    yahooSymbol,
    yahooInterval,
    yahooRange,
  )
    .then((data) => {
      candleCache.set(key, data);
      candlePromises.delete(key);
      return data;
    })
    .catch((error) => {
      candlePromises.delete(key);
      throw error;
    });

  candlePromises.set(key, promise);
  return promise;
}

interface CandleState {
  data: YahooChartResult | null;
  isLoading: boolean;
  error: Error | null;
}

export function useYahooCandles(
  symbol: string,
  interval: string = "1d",
  range: string = "1mo",
  enabled: boolean = true,
) {
  const yahooSymbol = useMemo(() => convertSymbol(symbol), [symbol]);
  const yahooInterval = intervalMap[interval] || interval;
  // Use the mapped interval to determine the range, fallback to provided range
  const yahooRange = rangeMap[yahooInterval] || rangeMap[interval] || range;
  const [state, setState] = useState<CandleState>({
    data: null,
    isLoading: Boolean(enabled && symbol),
    error: null,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !yahooSymbol) {
      setState({
        data: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    let cancelled = false;
    const retryCountRef = { current: 0 };
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    // Determine refresh interval based on timeframe - balance between live updates and performance
    const getRefreshInterval = () => {
      if (interval === "1m") return 5000; // 5 seconds for 1m (reduce flickering)
      if (interval === "1h" || interval === "60m") return 10000; // 10 seconds for 1h
      if (interval === "4h" || interval === "240") return 30000; // 30 seconds for 4h
      return 60000; // 60 seconds for daily/weekly
    };

    async function fetchCandles(bypassCache: boolean = false) {
      if (cancelled || !mountedRef.current) return;

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const data = await loadYahooCandles(
          yahooSymbol,
          yahooInterval,
          yahooRange,
          bypassCache, // Bypass cache for live updates
        );
        
        // Validate that we have actual data
        if (!data?.chart?.result?.[0]?.indicators?.quote?.[0]) {
          throw new Error("No chart data available");
        }

        // Reset retry count on success
        retryCountRef.current = 0;

        if (!cancelled && mountedRef.current) {
          setState({
            data,
            isLoading: false,
            error: null,
          });
        }
      } catch (error: any) {
        if (!cancelled && mountedRef.current) {
          // Retry logic for transient errors
          if (retryCountRef.current < maxRetries && error.message?.includes("Failed to fetch")) {
            retryCountRef.current++;
            setTimeout(() => {
              if (!cancelled && mountedRef.current) {
                fetchCandles(bypassCache);
              }
            }, retryDelay * retryCountRef.current);
          } else {
            retryCountRef.current = 0; // Reset for next attempt
            setState({
              data: null,
              isLoading: false,
              error: error instanceof Error ? error : new Error(String(error)),
            });
          }
        }
      }
    }

    // Initial fetch with cache
    fetchCandles(false);

    // Set up auto-refetch with interval based on timeframe (bypass cache)
    const refreshInterval = getRefreshInterval();
    const refetchInterval = setInterval(() => {
      if (!cancelled && mountedRef.current && enabled) {
        retryCountRef.current = 0; // Reset retry count for periodic refresh
        fetchCandles(true); // Bypass cache to get fresh data
      }
    }, refreshInterval);

    return () => {
      cancelled = true;
      clearInterval(refetchInterval);
    };
  }, [enabled, yahooSymbol, yahooInterval, yahooRange]);

  return state;
}

