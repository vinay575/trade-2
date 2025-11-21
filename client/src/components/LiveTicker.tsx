import { useState } from "react";
import { useYahooQuote } from "@/hooks/useYahooFinance";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TickerItem {
  symbol: string;
  displayName: string;
  type: "crypto" | "stock" | "forex";
}

const TICKER_SYMBOLS: TickerItem[] = [
  { symbol: "BTC-USD", displayName: "BTC-USD", type: "crypto" },
  { symbol: "ETH-USD", displayName: "ETH-USD", type: "crypto" },
  { symbol: "AAPL", displayName: "AAPL", type: "stock" },
  { symbol: "MSFT", displayName: "MSFT", type: "stock" },
  { symbol: "GOOGL", displayName: "GOOGL", type: "stock" },
  { symbol: "AMZN", displayName: "AMZN", type: "stock" },
  { symbol: "TSLA", displayName: "TSLA", type: "stock" },
  { symbol: "META", displayName: "META", type: "stock" },
];

function TickerItemComponent({ item }: { item: TickerItem }) {
  // Load data once, no auto-refresh
  const { data: quote, isLoading, error } = useYahooQuote(item.symbol, true, false);

  // Show loading state
  if (isLoading || (!quote && !error)) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 border-r border-border/50 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-sm font-medium">{item.displayName}</span>
          <span className="text-xs text-muted-foreground">{item.type.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-4 bg-muted/50 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !quote) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 border-r border-border/50 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-sm font-medium">{item.displayName}</span>
          <span className="text-xs text-muted-foreground">{item.type.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">N/A</span>
        </div>
      </div>
    );
  }

  // Validate quote data
  if (!quote.regularMarketPrice || isNaN(quote.regularMarketPrice)) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 border-r border-border/50 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-sm font-medium">{item.displayName}</span>
          <span className="text-xs text-muted-foreground">{item.type.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">N/A</span>
        </div>
      </div>
    );
  }

  // Handle null values - calculate from price and previous close if needed
  let change = quote.regularMarketChange;
  let changePercent = quote.regularMarketChangePercent;
  
  if ((change === null || change === undefined) && quote.regularMarketPreviousClose > 0) {
    change = quote.regularMarketPrice - quote.regularMarketPreviousClose;
    changePercent = (change / quote.regularMarketPreviousClose) * 100;
  }
  
  // Fallback to 0 if still null/undefined
  change = change ?? 0;
  changePercent = changePercent ?? 0;
  
  const isPositive = change >= 0;
  const changePercentStr = changePercent.toFixed(2);
  const changeValue = Math.abs(change).toFixed(2);
  const displayPrice = item.type === "forex" 
    ? quote.regularMarketPrice.toFixed(4) 
    : quote.regularMarketPrice >= 1 
      ? quote.regularMarketPrice.toFixed(2) 
      : quote.regularMarketPrice.toFixed(4);

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-r border-border/50 whitespace-nowrap hover:bg-accent/30 transition-colors">
      <div className="flex flex-col min-w-[70px]">
        <span className="text-sm font-medium">{item.displayName}</span>
        <span className="text-xs text-muted-foreground">{item.type.toUpperCase()}</span>
      </div>
      <div className="flex flex-col items-end min-w-[110px]">
        <span className="text-sm font-mono font-semibold">
          {displayPrice}
        </span>
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-gain" : "text-destructive"}`}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>
            {isPositive ? "+" : ""}{changePercent}% ({isPositive ? "+" : "-"}{changeValue})
          </span>
        </div>
      </div>
    </div>
  );
}

export function LiveTicker() {
  const [isScrolling, setIsScrolling] = useState(true);

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .ticker-scroll {
          animation: ticker-scroll 60s linear infinite;
        }
      `}</style>
      <div 
        className="relative overflow-hidden bg-background/95 border-b border-border/50"
        onMouseEnter={() => setIsScrolling(false)}
        onMouseLeave={() => setIsScrolling(true)}
      >
        <div className="flex items-center h-14">
          <div className="px-4 py-2 bg-primary/10 border-r border-border/50 flex-shrink-0 h-full flex items-center">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Live Markets</span>
          </div>
          <div className="flex-1 overflow-hidden h-full">
            <div 
              className={`flex h-full items-center ${isScrolling ? "ticker-scroll" : ""}`}
            >
              {/* First set */}
              {TICKER_SYMBOLS.map((item) => (
                <TickerItemComponent key={item.symbol} item={item} />
              ))}
              {/* Duplicate for seamless loop */}
              {TICKER_SYMBOLS.map((item) => (
                <TickerItemComponent key={`${item.symbol}-dup`} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
