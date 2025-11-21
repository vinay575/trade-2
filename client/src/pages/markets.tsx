import { useState, useMemo } from "react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { GlassCard } from "@/components/GlassCard";
import { PriceDisplay } from "@/components/PriceDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from "recharts";
import { useYahooQuote, useYahooCandles } from "@/hooks/useYahooFinance";
import { Search, TrendingUp, TrendingDown, Activity, BarChart3, Loader2 } from "lucide-react";

const STOCK_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX"];
const CRYPTO_SYMBOLS = ["BTC-USD", "ETH-USD", "SOL-USD"];

export default function Markets() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [timeframe, setTimeframe] = useState<"1h" | "4h" | "1d" | "1w">("1d");
  const [searchQuery, setSearchQuery] = useState("");

  // Get current quote for selected symbol - load once, no auto-refresh
  // 'enabled' must be true so the data actually loads; auto-refresh is still disabled
  const { data: quote, isLoading: isLoadingQuote } = useYahooQuote(selectedSymbol, true, false);
  
  // Map timeframe to Yahoo Finance intervals and ranges
  const { interval, range } = useMemo(() => {
    switch (timeframe) {
      case "1h":
        return { interval: "1h", range: "7d" };
      case "4h":
        return { interval: "4h", range: "1mo" };
      case "1d":
        return { interval: "1d", range: "1y" };
      case "1w":
        return { interval: "1wk", range: "2y" };
      default:
        return { interval: "1d", range: "1mo" };
    }
  }, [timeframe]);

  const { data: candlesData, isLoading: isLoadingCandles, error: candlesError } = useYahooCandles(
    selectedSymbol,
    interval,
    range,
    true
  );


  // Format candle data for charts - ONLY use real API data
  const chartData = useMemo(() => {
    // Only use real API data from Yahoo Finance
    if (candlesData && candlesData.chart && candlesData.chart.result && candlesData.chart.result.length > 0) {
      try {
        const result = candlesData.chart.result[0];
        const timestamps = result.timestamp || [];
        const quotes = result.indicators?.quote?.[0];
        
        if (quotes && timestamps.length > 0) {
          const validData = timestamps
            .map((timestamp: number, i: number) => {
              const closePrice = quotes.close?.[i];
              const openPrice = quotes.open?.[i];
              const highPrice = quotes.high?.[i];
              const lowPrice = quotes.low?.[i];
              const volume = quotes.volume?.[i];
              
              // Use close price, fallback to open if close is not available
              const price = closePrice ?? openPrice ?? 0;
              
              if (price > 0 && !isNaN(price)) {
                return {
                  time: new Date(timestamp * 1000).toLocaleDateString(),
                  price: price,
                  volume: volume || 0,
                  high: highPrice || price,
                  low: lowPrice || price,
                  open: openPrice || price,
                  close: closePrice || price,
                };
              }
              return null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
          
          if (validData.length > 0) {
            return validData;
          }
        }
      } catch (error) {
        console.error("Error processing candle data:", error);
      }
    }
    
    // Return empty array if no valid data - don't use mock data
    return [];
  }, [candlesData, timeframe]);

  // Get quotes for multiple symbols for the asset list
  const allSymbols = [...STOCK_SYMBOLS, ...CRYPTO_SYMBOLS];
  const filteredSymbols = allSymbols.filter(symbol => 
    symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSymbolName = selectedSymbol.includes("-") 
    ? selectedSymbol.replace("-USD", "")
    : selectedSymbol;

  // Check if we should show error or fallback
  const hasChartData = chartData.length > 0;
  const showFallback = !isLoadingCandles && !hasChartData && quote;

  const chartConfig = {
    price: {
      label: "Price",
      color: "hsl(var(--primary))",
    },
    volume: {
      label: "Volume",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <PublicNavbar />
      
      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-condensed font-bold mb-2">Markets</h1>
            <p className="text-muted-foreground">Real-time market data and advanced charts powered by Yahoo Finance</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-2">
              <Activity className="w-3 h-3" />
              Connected
            </Badge>
          </div>
        </div>

        {/* Market Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Selected Symbol</div>
            <div className="text-2xl font-condensed font-bold">{selectedSymbolName}</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Current Price</div>
            <div className="text-2xl font-condensed font-bold">
              {quote && quote.regularMarketPrice ? `$${quote.regularMarketPrice.toFixed(2)}` : "—"}
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-sm text-muted-foreground mb-1">24h Change</div>
            <div className="text-2xl font-condensed font-bold">
              {quote && quote.regularMarketChange !== undefined && quote.regularMarketChange !== null ? (
                <span className={quote.regularMarketChange >= 0 ? "text-gain" : "text-destructive"}>
                  {quote.regularMarketChange >= 0 ? "+" : ""}${quote.regularMarketChange.toFixed(2)}
                </span>
              ) : "—"}
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-sm text-muted-foreground mb-1">24h Change %</div>
            <div className="text-2xl font-condensed font-bold">
              {quote && quote.regularMarketChangePercent !== undefined && quote.regularMarketChangePercent !== null ? (
                <span className={quote.regularMarketChangePercent >= 0 ? "text-gain" : "text-destructive"}>
                  {quote.regularMarketChangePercent >= 0 ? "+" : ""}{quote.regularMarketChangePercent.toFixed(2)}%
                </span>
              ) : "—"}
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Selector */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-condensed font-semibold">{selectedSymbolName}</h2>
                  <Badge variant="secondary">
                    {selectedSymbol.includes("-USD") ? "CRYPTO" : "STOCK"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {(["1h", "4h", "1d", "1w"] as const).map((tf) => (
                    <Button
                      key={tf}
                      variant={timeframe === tf ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeframe(tf)}
                    >
                      {tf}
                    </Button>
                  ))}
                </div>
              </div>
              {quote && quote.regularMarketPrice && (
                <div className="space-y-2 mb-4">
                  <PriceDisplay
                    value={quote.regularMarketPrice}
                    change={quote.regularMarketChange ?? 0}
                    changePercent={quote.regularMarketChangePercent ?? 0}
                    size="lg"
                  />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">High: </span>
                      <span className="font-medium">${(quote.regularMarketDayHigh || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Low: </span>
                      <span className="font-medium">${(quote.regularMarketDayLow || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Open: </span>
                      <span className="font-medium">${(quote.regularMarketOpen || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prev Close: </span>
                      <span className="font-medium">${(quote.regularMarketPreviousClose || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Price Chart */}
            <GlassCard className="p-6" neonBorder>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-condensed font-semibold">Price Chart</h3>
                </div>
                {!isLoadingCandles && chartData.length > 0 && (
                  <Badge variant="secondary" className="text-xs gap-2">
                    <Activity className="w-3 h-3" />
                    Live Data
                  </Badge>
                )}
                {candlesError && (
                  <Badge variant="destructive" className="text-xs">
                    API Error
                  </Badge>
                )}
              </div>
              {isLoadingCandles ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : chartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return timeframe === "1d" || timeframe === "1w" 
                          ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                      }}
                    />
                    <YAxis 
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      domain={['dataMin - 10', 'dataMax + 10']}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-medium">No chart data available</p>
                  {candlesError ? (
                    <p className="text-xs mt-2 text-destructive">
                      API Error: {candlesError.message}
                    </p>
                  ) : (
                    <p className="text-xs mt-2">
                      Waiting for market data from Yahoo Finance...
                    </p>
                  )}
                </div>
              )}
            </GlassCard>

            {/* Volume Chart */}
            {chartData.length > 0 && (
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-condensed font-semibold">Volume</h3>
                </div>
                <ChartContainer config={chartConfig} className="h-[200px]">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return timeframe === "1d" || timeframe === "1w" 
                          ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                      }}
                    />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="volume" fill="hsl(var(--primary))" opacity={0.7} />
                  </BarChart>
                </ChartContainer>
              </GlassCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Asset List */}
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search symbols..." 
                  className="h-8" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredSymbols.map((symbol) => {
                  const displayName = symbol.includes("-") 
                    ? symbol.replace("-USD", "")
                    : symbol;
                  return (
                    <div
                      key={symbol}
                      onClick={() => setSelectedSymbol(symbol)}
                      className={`p-3 rounded-md cursor-pointer transition-all hover-elevate ${
                        selectedSymbol === symbol ? "bg-primary/10 border border-primary/50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{displayName}</div>
                          <div className="text-xs text-muted-foreground">{symbol}</div>
                        </div>
                        {selectedSymbol === symbol && isLoadingQuote && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Quick Stats */}
            {quote && quote.regularMarketPrice && (
              <GlassCard className="p-4">
                <h3 className="text-lg font-condensed font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">High (24h)</span>
                    <span className="font-medium text-gain">${(quote.regularMarketDayHigh || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Low (24h)</span>
                    <span className="font-medium text-destructive">${(quote.regularMarketDayLow || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Open</span>
                    <span className="font-medium">${(quote.regularMarketOpen || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Previous Close</span>
                    <span className="font-medium">${(quote.regularMarketPreviousClose || 0).toFixed(2)}</span>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
