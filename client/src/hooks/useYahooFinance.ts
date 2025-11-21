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

async function loadYahooQuote(yahooSymbol: string): Promise<YahooQuote> {
  if (quoteCache.has(yahooSymbol)) {
    return quoteCache.get(yahooSymbol)!;
  }
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

    async function fetchOnce() {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const data = await loadYahooQuote(yahooSymbol);
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

    fetchOnce();

    return () => {
      cancelled = true;
    };
  }, [enabled, yahooSymbol]);

  return state;
}

const intervalMap: Record<string, string> = {
  "60": "1h",
  "240": "4h",
  D: "1d",
  W: "1wk",
};

const rangeMap: Record<string, string> = {
  "1h": "7d",
  "4h": "1mo",
  "1d": "1y",
  "1w": "2y",
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
): Promise<YahooChartResult> {
  const key = candlesKey(yahooSymbol, yahooInterval, yahooRange);
  if (candleCache.has(key)) {
    return candleCache.get(key)!;
  }
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
  const yahooRange = rangeMap[interval] || range;
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
      return;
    }

    let cancelled = false;

    async function fetchCandles() {
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
        );
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

    fetchCandles();

    return () => {
      cancelled = true;
    };
  }, [enabled, yahooSymbol, yahooInterval, yahooRange]);

  return state;
}

