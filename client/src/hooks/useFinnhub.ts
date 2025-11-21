import { useQuery } from "@tanstack/react-query";

const FINNHUB_API_KEY = "d4el159r01qrumpfvh4gd4el159r01qrumpfvh50";
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

interface Quote {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high price
  l: number; // low price
  o: number; // open price
  pc: number; // previous close
  t: number; // timestamp
}

interface Candle {
  c: number[]; // close prices
  h: number[]; // high prices
  l: number[]; // low prices
  o: number[]; // open prices
  s: string; // status
  t: number[]; // timestamps
  v: number[]; // volumes
}

export function useFinnhubQuote(symbol: string, enabled: boolean = true, refetchInterval: number = 5000) {
  return useQuery<Quote>({
    queryKey: ["finnhub", "quote", symbol],
    queryFn: async () => {
      const response = await fetch(
        `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Finnhub quote API error for ${symbol}:`, errorText);
        throw new Error(`Failed to fetch quote: ${response.status}`);
      }
      const data = await response.json();
      // Validate the response has required fields
      if (!data || typeof data.c !== 'number') {
        throw new Error("Invalid quote data received");
      }
      return data;
    },
    enabled: enabled && !!symbol,
    refetchInterval: false, // Never auto-refetch - load once only
    staleTime: Infinity, // Data never becomes stale
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnMount: false, // Don't refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
}

export function useFinnhubCandles(
  symbol: string,
  resolution: string = "D",
  from: number,
  to: number,
  enabled: boolean = true
) {
  return useQuery<Candle>({
    queryKey: ["finnhub", "candles", symbol, resolution, from, to],
    queryFn: async () => {
      // For crypto symbols, use crypto/candle endpoint, otherwise use stock/candle
      const isCrypto = symbol.includes("BINANCE:") || symbol.includes(":");
      const endpoint = isCrypto 
        ? `${FINNHUB_BASE_URL}/crypto/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
        : `${FINNHUB_BASE_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Finnhub API error:", errorText);
        throw new Error(`Failed to fetch candles: ${response.status}`);
      }
      const data = await response.json();
      
      // Check if we got an error response
      if (data.s === "no_data" || data.s === "error") {
        console.warn("No data from Finnhub for symbol:", symbol);
        return { s: "no_data", t: [], c: [], h: [], l: [], o: [], v: [] };
      }
      
      return data;
    },
    enabled: enabled && !!symbol && from > 0 && to > 0,
    retry: 1,
    retryDelay: 2000,
    refetchInterval: false, // Never auto-refetch
    staleTime: Infinity, // Data never becomes stale
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnMount: false, // Don't refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
}

export function useFinnhubNews(category: string = "general") {
  return useQuery({
    queryKey: ["finnhub", "news", category],
    queryFn: async () => {
      const response = await fetch(
        `${FINNHUB_BASE_URL}/news?category=${category}&token=${FINNHUB_API_KEY}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }
      return response.json();
    },
    refetchInterval: false, // Never auto-refetch
    staleTime: Infinity, // Data never becomes stale
    refetchOnMount: false, // Don't refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
}

export function useFinnhubMarketStatus() {
  return useQuery({
    queryKey: ["finnhub", "market-status"],
    queryFn: async () => {
      const response = await fetch(
        `${FINNHUB_BASE_URL}/stock/market-status?exchange=US&token=${FINNHUB_API_KEY}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch market status");
      }
      return response.json();
    },
    refetchInterval: false, // Never auto-refetch
    staleTime: Infinity, // Data never becomes stale
    refetchOnMount: false, // Don't refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
}

