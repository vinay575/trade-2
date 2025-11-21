import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useYahooQuote, useYahooCandles } from "@/hooks/useYahooFinance";
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
  const [timeframe, setTimeframe] = useState<"1h" | "4h" | "1d" | "1w">("1d");

  // Get current quote - load once, no auto-refresh
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

  const { data: candlesData, isLoading: isLoadingCandles } = useYahooCandles(
    selectedSymbol,
    interval,
    range,
    true
  );

  // Format candle data for charts
  const chartData = useMemo(() => {
    if (candlesData && candlesData.chart && candlesData.chart.result && candlesData.chart.result.length > 0) {
      try {
        const result = candlesData.chart.result[0];
        const timestamps = result.timestamp || [];
        const quotes = result.indicators?.quote?.[0];
        
        if (quotes && timestamps.length > 0) {
          return timestamps.map((timestamp: number, i: number) => ({
            time: new Date(timestamp * 1000).toLocaleDateString(),
            price: quotes.close?.[i] || 0,
          })).filter(item => item.price > 0 && !isNaN(item.price));
        }
      } catch (error) {
        console.error("Error processing candle data:", error);
      }
    }
    
    return [];
  }, [candlesData, timeframe]);

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
              <h3 className="font-condensed font-semibold text-lg">Price Chart</h3>
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
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p>Loading chart data...</p>
                </div>
              </div>
            )}
          </GlassCard>

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
                    <Input type="number" placeholder="0.00" data-testid="input-price" />
                  </div>
                )}

                <div>
                  <Label className="text-xs">Amount</Label>
                  <Input type="number" placeholder="0.00" data-testid="input-amount" />
                </div>

                <div>
                  <Label className="text-xs">Total</Label>
                  <Input type="number" placeholder="0.00" disabled data-testid="input-total" />
                </div>

                <Button
                  className={`w-full ${side === "buy" ? "bg-gain hover:bg-gain/90" : "bg-destructive hover:bg-destructive/90"}`}
                  data-testid={`button-${side}`}
                >
                  {side === "buy" ? "Buy" : "Sell"} {selectedSymbolData.label}
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
