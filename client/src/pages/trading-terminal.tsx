import { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useYahooQuote, useYahooCandles } from "@/hooks/useYahooFinance";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from "recharts";
import { TrendingUp, TrendingDown, Loader2, Activity } from "lucide-react";

const SYMBOLS = [
  { value: "AAPL", label: "AAPL", type: "Stock" },
  { value: "MSFT", label: "MSFT", type: "Stock" },
  { value: "GOOGL", label: "GOOGL", type: "Stock" },
  { value: "TSLA", label: "TSLA", type: "Stock" },
  { value: "BTC-USD", label: "BTC/USD", type: "Crypto" },
  { value: "ETH-USD", label: "ETH/USD", type: "Crypto" },
];

export default function TradingTerminal() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [orderType, setOrderType] = useState<"market" | "limit" | "stop">("market");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [timeframe, setTimeframe] = useState<"1m" | "1h" | "4h" | "1d" | "1w">("1d");
  const [tradeTimeframe, setTradeTimeframe] = useState<"1m" | "1h" | "1d" | "1w">("1h");
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Get current quote with live updates (every 1 second for real-time trading feel)
  const { data: quote, isLoading: isLoadingQuote } = useYahooQuote(selectedSymbol, true, true);

  // Map timeframe to Yahoo Finance intervals and ranges
  const { interval, range } = useMemo(() => {
    switch (timeframe) {
      case "1m":
        return { interval: "1m", range: "1d" };
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

  // Update candles more frequently for live trading feel (every 1-2 seconds for 1m, 5s for others)
  const { data: candlesData, isLoading: isLoadingCandles } = useYahooCandles(
    selectedSymbol,
    interval,
    range,
    true
  );

  // Format candle data for charts - only recalculate when candles change, not on every quote update
  const baseChartData = useMemo(() => {
    const data: Array<{ time: number; price: number }> = [];
    
    if (candlesData && candlesData.chart && candlesData.chart.result && candlesData.chart.result.length > 0) {
      try {
        const result = candlesData.chart.result[0];
        const timestamps = result.timestamp || [];
        const quotes = result.indicators?.quote?.[0];
        
        if (quotes && timestamps.length > 0) {
          const candleData = timestamps.map((timestamp: number, i: number) => ({
            time: timestamp * 1000, // Store as timestamp in milliseconds
            price: quotes.close?.[i] || 0,
          })).filter(item => item.price > 0 && !isNaN(item.price));
          
          data.push(...candleData);
        }
      } catch (error) {
        console.error("Error processing candle data:", error);
      }
    }
    
    return data.sort((a, b) => a.time - b.time);
  }, [candlesData, timeframe]); // Only recalculate when candles or timeframe change

  // Merge live quote price - separate memo to avoid full chart re-render
  // Use ref to track last update time and last price to prevent excessive re-renders
  const lastUpdateRef = useRef<number>(0);
  const lastPriceRef = useRef<number | null>(null);
  const chartDataRef = useRef<Array<{ time: number; price: number }>>([]);
  
  const chartData = useMemo(() => {
    // Only update chart data if enough time has passed (prevent flickering)
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    const minUpdateInterval = 5000; // Update at most every 5 seconds to prevent flickering
    
    if (!quote || !quote.regularMarketPrice || quote.regularMarketPrice <= 0) {
      return baseChartData.length > 0 ? baseChartData : chartDataRef.current;
    }

    // Throttle updates to prevent continuous re-rendering
    if (timeSinceLastUpdate < minUpdateInterval && baseChartData.length > 0) {
      // Return cached data if update is too frequent
      return chartDataRef.current.length > 0 ? chartDataRef.current : baseChartData;
    }

    // Only update if price changed significantly (0.1% threshold)
    if (lastPriceRef.current !== null) {
      const priceDiff = Math.abs(quote.regularMarketPrice - lastPriceRef.current);
      const minPriceChange = lastPriceRef.current * 0.001; // 0.1% change threshold
      if (priceDiff < minPriceChange && chartDataRef.current.length > 0) {
        return chartDataRef.current; // Return cached data if price hasn't changed enough
      }
    }

    lastUpdateRef.current = now;
    lastPriceRef.current = quote.regularMarketPrice;
    
    // Remove any existing live price points (within last 60 seconds) to avoid duplicates
    const filteredData = baseChartData.filter(item => {
      const timeDiff = now - item.time;
      return timeDiff > 60000; // Keep only points older than 60 seconds
    });
    
    // Add the latest live price
    filteredData.push({
      time: now,
      price: quote.regularMarketPrice,
    });
    
    const sortedData = filteredData.sort((a, b) => a.time - b.time);
    chartDataRef.current = sortedData; // Cache the result
    return sortedData;
  }, [baseChartData, quote?.regularMarketPrice]); // Only update when base data or quote price changes

  // Get last data timestamp for freshness indicator
  const lastDataTime = useMemo(() => {
    if (chartData.length > 0) {
      const lastTimestamp = chartData[chartData.length - 1].time;
      return new Date(lastTimestamp);
    }
    return null;
  }, [chartData]);

  const selectedSymbolData = SYMBOLS.find(s => s.value === selectedSymbol) || SYMBOLS[0];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      const timeoutId = setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isLoading]); // Removed toast from dependencies

  const mockOrderbook = {
    asks: Array.from({ length: 15 }, (_, i) => ({
      price: (quote?.regularMarketPrice || 100) + i * 0.5,
      quantity: Math.random() * 2,
      total: Math.random() * 100000
    })),
    bids: Array.from({ length: 15 }, (_, i) => ({
      price: (quote?.regularMarketPrice || 100) - i * 0.5,
      quantity: Math.random() * 2,
      total: Math.random() * 100000
    }))
  };

  const queryClient = useQueryClient();
  
  // Fetch open positions
  const { data: openPositions, refetch: refetchPositions } = useQuery<any[]>({
    queryKey: ['/api/trade/open-positions'],
    enabled: isAuthenticated,
    refetchInterval: 5000, // Refresh every 5 seconds
    queryFn: async () => {
      const res = await fetch('/api/trade/open-positions', {
        credentials: 'include',
      });
      if (!res.ok) {
        return [];
      }
      return res.json();
    },
  });

  const chartConfig = {
    price: {
      label: "Price",
      color: "hsl(var(--primary))",
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary text-xl font-condensed">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-condensed font-bold" data-testid="text-terminal-title">Trading Terminal</h1>
          <div className="flex items-center gap-2">
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-40" data-testid="select-symbol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYMBOLS.map((symbol) => (
                  <SelectItem key={symbol.value} value={symbol.value}>
                    {symbol.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary">{selectedSymbolData.type}</Badge>
            <Badge variant="outline" className="gap-2">
              <Activity className="w-3 h-3" />
              Connected
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-condensed font-bold" data-testid="text-current-price">
              {quote ? `$${quote.regularMarketPrice.toFixed(2)}` : "—"}
            </div>
            {quote && quote.regularMarketChange !== null && quote.regularMarketChangePercent !== null && (
              <div className={`text-sm flex items-center gap-1 ${quote.regularMarketChange >= 0 ? "text-gain" : "text-destructive"}`}>
                {quote.regularMarketChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {quote.regularMarketChange >= 0 ? "+" : ""}{quote.regularMarketChange.toFixed(2)} ({quote.regularMarketChangePercent >= 0 ? "+" : ""}{quote.regularMarketChangePercent.toFixed(2)}%)
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        <div className="lg:col-span-3 space-y-6">
          {/* Chart */}
          <GlassCard className="p-6 h-[500px]" neonBorder>
            <div className="flex items-center justify-between mb-4">
              <div>
              <h3 className="font-condensed font-semibold text-lg">Price Chart</h3>
                {lastDataTime && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last update: {lastDataTime.toLocaleString("en-US", { 
                      month: "short", 
                      day: "numeric", 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    })}
                    {(() => {
                      const now = new Date();
                      const diffMs = now.getTime() - lastDataTime.getTime();
                      const diffMins = Math.floor(diffMs / 60000);
                      if (diffMins < 60) {
                        return ` (${diffMins}m ago)`;
                      }
                      const diffHours = Math.floor(diffMins / 60);
                      return ` (${diffHours}h ago)`;
                    })()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {(["1m", "1h", "4h", "1d", "1w"] as const).map((tf) => (
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
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    interval="preserveStartEnd"
                    minTickGap={50}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      if (timeframe === "1w") {
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      } else if (timeframe === "1d") {
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      } else if (timeframe === "4h") {
                        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                      } else if (timeframe === "1h") {
                        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                      } else if (timeframe === "1m") {
                        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                      }
                      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
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
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p>Loading chart data...</p>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Open Positions */}
          {openPositions && openPositions.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="font-condensed font-semibold text-lg mb-4">Open Positions</h3>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {openPositions.map((position: any) => {
                    const entryPrice = parseFloat(position.averagePrice || position.price || "0");
                    const quantity = parseFloat(position.quantity);
                    const isSelected = position.symbol === selectedSymbol;
                    
                    return (
                      <div
                        key={position.id}
                        className={`p-3 rounded-md border ${
                          isSelected ? "border-primary bg-primary/10" : "border-border/50"
                        } hover-elevate cursor-pointer`}
                        onClick={() => setSelectedSymbol(position.symbol)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{position.symbol}</span>
                              <Badge variant="secondary" className="text-xs">{position.assetType}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <span>Qty: {quantity.toFixed(4)}</span>
                              <span className="mx-2">•</span>
                              <span>Entry: ${entryPrice.toFixed(2)}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const priceRes = await fetch(`/api/yahoo/quote/${position.symbol}`);
                                if (!priceRes.ok) throw new Error("Failed to get price");
                                const priceData = await priceRes.json();
                                const currentPrice = priceData.chart?.result?.[0]?.meta?.regularMarketPrice;

                                const sellOrder = {
                                  symbol: position.symbol,
                                  assetType: position.assetType,
                                  type: "market",
                                  side: "sell",
                                  quantity: position.quantity,
                                  price: null,
                                  timeframe: null,
                                };

                                await fetch("/api/trade/place-order", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  credentials: "include",
                                  body: JSON.stringify(sellOrder),
                                });

                                await fetch("/api/trade/close-order", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  credentials: "include",
                                  body: JSON.stringify({ orderId: position.id }),
                                });

                                toast({
                                  title: "Position Sold",
                                  description: `Sold ${quantity} ${position.symbol}`,
                                });

                                refetchPositions();
                              } catch (error: any) {
                                toast({
                                  title: "Sell Failed",
                                  description: error.message,
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            Sell
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </GlassCard>
          )}

          {/* Order Book */}
          <GlassCard className="p-6">
            <h3 className="font-condensed font-semibold text-lg mb-4">Order Book & Depth</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 px-2">
                  <span>Price</span>
                  <span>Amount</span>
                  <span>Total</span>
                </div>
                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {mockOrderbook.asks.map((ask, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs p-1 hover-elevate rounded"
                        data-testid={`orderbook-ask-${i}`}
                      >
                        <span className="text-destructive font-mono">${ask.price.toFixed(2)}</span>
                        <span className="text-muted-foreground">{ask.quantity.toFixed(4)}</span>
                        <span className="text-muted-foreground">${ask.total.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 px-2">
                  <span>Price</span>
                  <span>Amount</span>
                  <span>Total</span>
                </div>
                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {mockOrderbook.bids.map((bid, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs p-1 hover-elevate rounded"
                        data-testid={`orderbook-bid-${i}`}
                      >
                        <span className="text-gain font-mono">${bid.price.toFixed(2)}</span>
                        <span className="text-muted-foreground">{bid.quantity.toFixed(4)}</span>
                        <span className="text-muted-foreground">${bid.total.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Order Panel */}
        <div className="space-y-6">
          <GlassCard className="p-6" glow>
            <h3 className="font-condensed font-semibold text-lg mb-4">Place Order</h3>
            <Tabs value={side} onValueChange={(v) => setSide(v as "buy" | "sell")}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="buy" className="data-[state=active]:bg-gain/20 data-[state=active]:text-gain" data-testid="tab-buy">
                  Buy
                </TabsTrigger>
                <TabsTrigger value="sell" className="data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive" data-testid="tab-sell">
                  Sell
                </TabsTrigger>
              </TabsList>

              <TabsContent value={side} className="space-y-4">
                <div>
                  <Label className="text-xs">Order Type</Label>
                  <Select value={orderType} onValueChange={(v) => setOrderType(v as any)}>
                    <SelectTrigger data-testid="select-order-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="limit">Limit</SelectItem>
                      <SelectItem value="stop">Stop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {orderType !== "market" && (
                  <div>
                    <Label className="text-xs">Price</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      data-testid="input-price" 
                    />
                  </div>
                )}

                <div>
                  <Label className="text-xs">Trade Duration</Label>
                  <Select value={tradeTimeframe} onValueChange={(v) => setTradeTimeframe(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1 Minute</SelectItem>
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="1d">1 Day</SelectItem>
                      <SelectItem value="1w">1 Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Amount</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    data-testid="input-amount" 
                  />
                </div>

                <div>
                  <Label className="text-xs">Total</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    disabled 
                    value={amount && quote ? (parseFloat(amount) * quote.regularMarketPrice).toFixed(2) : ""}
                    data-testid="input-total" 
                  />
                </div>

                <Button
                  className={`w-full ${side === "buy" ? "bg-gain hover:bg-gain/90" : "bg-destructive hover:bg-destructive/90"}`}
                  data-testid={`button-${side}`}
                  disabled={isPlacingOrder || !amount || parseFloat(amount) <= 0}
                  onClick={async () => {
                    if (!amount || parseFloat(amount) <= 0) {
                      toast({
                        title: "Invalid Amount",
                        description: "Please enter a valid amount",
                        variant: "destructive",
                      });
                      return;
                    }

                    setIsPlacingOrder(true);
                    try {
                      const orderData = {
                        symbol: selectedSymbol,
                        assetType: selectedSymbolData.type.toLowerCase(),
                        type: orderType,
                        side: side,
                        quantity: amount,
                        price: orderType === "market" ? null : limitPrice,
                        stopPrice: orderType === "stop" ? limitPrice : null,
                        timeframe: tradeTimeframe,
                      };

                      const response = await fetch("/api/trade/place-order", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        credentials: "include",
                        body: JSON.stringify(orderData),
                      });

                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.message || "Failed to place order");
                      }

                      const order = await response.json();
                      
                      console.log("Order placed successfully:", order);
                      
                      toast({
                        title: "Order Placed",
                        description: `${side === "buy" ? "Buy" : "Sell"} order for ${amount} ${selectedSymbolData.label} placed successfully${order.type === "market" ? " and executed" : ""}`,
                      });

                      // Reset form
                      setAmount("");
                      setLimitPrice("");

                      // Refresh all data immediately after trade
                      await Promise.all([
                        refetchPositions(),
                        queryClient.invalidateQueries({ queryKey: ['/api/trade/trades'] }),
                        queryClient.invalidateQueries({ queryKey: ['/api/trade/open-positions'] }),
                        queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] }),
                        queryClient.invalidateQueries({ queryKey: ['/api/wallet/summary'] }),
                        queryClient.invalidateQueries({ queryKey: ['/api/wallet/ledger'] }),
                      ]);
                      
                      // Force immediate refetch to show updated balance
                      await Promise.all([
                        queryClient.refetchQueries({ queryKey: ['/api/trade/trades'] }),
                        queryClient.refetchQueries({ queryKey: ['/api/trade/open-positions'] }),
                        queryClient.refetchQueries({ queryKey: ['/api/portfolio/summary'] }),
                        queryClient.refetchQueries({ queryKey: ['/api/wallet/summary'] }),
                        queryClient.refetchQueries({ queryKey: ['/api/wallet/ledger'] }),
                      ]);

                      // If market order, schedule auto-close based on timeframe
                      if (orderType === "market" && order.status === "filled") {
                        const timeframeMs: Record<string, number> = {
                          "1m": 60 * 1000,
                          "1h": 60 * 60 * 1000,
                          "1d": 24 * 60 * 60 * 1000,
                          "1w": 7 * 24 * 60 * 60 * 1000,
                        };
                        
                        setTimeout(async () => {
                          try {
                            const closeResponse = await fetch("/api/trade/close-order", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              credentials: "include",
                              body: JSON.stringify({ orderId: order.id }),
                            });
                            
                            if (closeResponse.ok) {
                              // Invalidate all related queries after auto-close
                              await Promise.all([
                                refetchPositions(),
                                queryClient.invalidateQueries({ queryKey: ['/api/trade/trades'] }),
                                queryClient.invalidateQueries({ queryKey: ['/api/trade/open-positions'] }),
                                queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] }),
                                queryClient.invalidateQueries({ queryKey: ['/api/wallet/summary'] }),
                              ]);
                              
                              toast({
                                title: "Trade Auto-Closed",
                                description: `Trade for ${selectedSymbolData.label} has been automatically closed`,
                              });
                            }
                          } catch (error) {
                            console.error("Failed to auto-close order:", error);
                          }
                        }, timeframeMs[tradeTimeframe]);
                      }
                    } catch (error: any) {
                      toast({
                        title: "Order Failed",
                        description: error.message || "Failed to place order",
                        variant: "destructive",
                      });
                    } finally {
                      setIsPlacingOrder(false);
                    }
                  }}
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Placing...
                    </>
                  ) : (
                    `${side === "buy" ? "Buy" : "Sell"} ${selectedSymbolData.label}`
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </GlassCard>

          <Card className="backdrop-blur-sm bg-card/40 p-6">
            <h3 className="font-condensed font-semibold text-sm mb-4">Position Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available</span>
                <span className="font-mono">$45,234.12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">In Orders</span>
                <span className="font-mono">$12,543.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margin</span>
                <span className="font-mono">5x</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
